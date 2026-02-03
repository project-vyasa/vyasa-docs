// Imports moved to dynamic import in init() to support SSR environment


export class SQLiteService {
    private sqlite3: any = null;
    private db: number | null = null;
    private dbName: string = 'vyasa-v1';
    private SQLiteModule: any = null;
    private memoryVfs: any = null;

    async init() {
        if (this.db) return;

        console.log('Initializing SQLite WASM...');
        // Dynamic imports to avoid SSR/Build issues
        const { default: SQLiteAsyncESMFactory } = await import('wa-sqlite/dist/wa-sqlite-async.mjs');
        const { IDBBatchAtomicVFS } = await import('wa-sqlite/src/examples/IDBBatchAtomicVFS.js');
        const { MemoryVFS } = await import('wa-sqlite/src/examples/MemoryVFS.js');
        const SQLite = await import('wa-sqlite');
        this.SQLiteModule = SQLite;

        const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
        // const wasmUrl = `${baseUrl}/wa-sqlite-async.wasm`;

        const module = await SQLiteAsyncESMFactory({
            locateFile: (file: string) => {
                console.log('SQLite requesting:', file);
                return `${baseUrl}/wasm/${file}`;
            }
        });

        this.sqlite3 = SQLite.Factory(module);

        // Register VFS
        const idbVfs = new IDBBatchAtomicVFS(this.dbName);
        await idbVfs.isReady; // Keep this line for IDBBatchAtomicVFS readiness
        this.sqlite3.vfs_register(idbVfs, true); // Default

        this.memoryVfs = new MemoryVFS();
        this.sqlite3.vfs_register(this.memoryVfs, false);

        console.log('Capabilities:', {
            serialize: !!this.sqlite3.serialize,
            vfsName: this.memoryVfs.name
        });

        this.db = await this.sqlite3.open_v2(this.dbName);
        console.log('SQLite database opened');

        // Initialize schema
        await this.exec(`
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY,
                path TEXT UNIQUE NOT NULL,
                urn TEXT
            );
            CREATE TABLE IF NOT EXISTS nodes (
                doc_id INTEGER NOT NULL,
                parent_id INTEGER,
                position INTEGER,
                type TEXT,
                cmd TEXT,
                argument TEXT,
                value TEXT,
                FOREIGN KEY(doc_id) REFERENCES documents(id)
            );
            CREATE TABLE IF NOT EXISTS node_attrs (
                node_id INTEGER NOT NULL,
                key TEXT,
                value TEXT,
                FOREIGN KEY(node_id) REFERENCES nodes(rowid)
            );
            CREATE INDEX IF NOT EXISTS idx_nodes_doc ON nodes(doc_id);
            CREATE INDEX IF NOT EXISTS idx_nodes_cmd ON nodes(cmd);
        `);
        console.log('SQLite database opened and schema initialized');
    }

    async exportDb(): Promise<Uint8Array | null> {
        if (!this.db) return null;
        console.log('Exporting DB (Manual strategies)...');

        // Strategy 1: Serialized (Fastest)
        if (this.sqlite3.serialize) {
            console.log('Using sqlite3.serialize');
            const result = await this.sqlite3.serialize(this.db, 'main');
            return result;
        }

        // Strategy 2: Manual Copy to MemoryVFS (Fallback)
        try {
            const vfsName = this.memoryVfs?.name || 'memory';
            const exportName = `export-${Date.now()}.db`;
            const uri = `file:${exportName}?vfs=${vfsName}`;


            console.log('Strategy 2: Decoupled Copy (JS Memory buffering)');

            // Step 1: Fetch data (read from connection 1)
            const docs = await this.query('SELECT * FROM documents');
            const nodes = await this.query('SELECT * FROM nodes');
            const attrs = await this.query('SELECT * FROM node_attrs');
            console.log(`Buffered: ${docs.length} docs, ${nodes.length} nodes, ${attrs.length} attrs`);

            // Step 2: Open separate connection to Memory VFS
            const flags = 6; // SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE
            const memDb = await this.sqlite3.open_v2(exportName, flags, vfsName);

            try {
                // Recreate Schema
                await this.sqlite3.exec(memDb, `
                    CREATE TABLE documents (id INTEGER PRIMARY KEY, path TEXT UNIQUE NOT NULL, urn TEXT);
                    CREATE TABLE nodes (doc_id INTEGER NOT NULL, parent_id INTEGER, position INTEGER, type TEXT, cmd TEXT, argument TEXT, value TEXT, FOREIGN KEY(doc_id) REFERENCES documents(id));
                    CREATE TABLE node_attrs (node_id INTEGER NOT NULL, key TEXT, value TEXT, FOREIGN KEY(node_id) REFERENCES nodes(rowid));
                `);

                await this.sqlite3.exec(memDb, 'BEGIN');

                // Helper for inserts
                const runInsert = async (sql: string, rows: any[]) => {
                    const str = this.sqlite3.str_new(memDb, sql);
                    const prep = await this.sqlite3.prepare_v2(memDb, this.sqlite3.str_value(str));
                    this.sqlite3.str_finish(str);
                    const stmt = (prep.stmt !== undefined) ? prep.stmt : prep;
                    if (!stmt) throw new Error('Failed to prepare: ' + sql);

                    try {
                        for (const row of rows) {
                            this.sqlite3.reset(stmt);
                            for (let i = 0; i < row.length; i++) {
                                const val = row[i];
                                if (val === null) {
                                    this.sqlite3.bind_null(stmt, i + 1);
                                } else if (typeof val === 'number') {
                                    this.sqlite3.bind_double(stmt, i + 1, val);
                                } else if (typeof val === 'string') {
                                    this.sqlite3.bind_text(stmt, i + 1, val);
                                } else {
                                    this.sqlite3.bind_text(stmt, i + 1, String(val));
                                }
                            }
                            const rc = await this.sqlite3.step(stmt);
                            if (rc !== 101) { // SQLITE_DONE
                                console.error('Insert failed code:', rc);
                            }
                        }
                    } finally {
                        this.sqlite3.finalize(stmt);
                    }
                };

                await runInsert('INSERT INTO documents VALUES (?,?,?)', docs);
                await runInsert('INSERT INTO nodes VALUES (?,?,?,?,?,?,?)', nodes);
                await runInsert('INSERT INTO node_attrs VALUES (?,?,?)', attrs);

                await this.sqlite3.exec(memDb, 'COMMIT');
                console.log('Memory DB populated.');

            } finally {
                await this.sqlite3.close(memDb);
            }

            // Retrieve file from MemoryVFS map

            // Retrieve file from MemoryVFS map
            // Note: wa-sqlite MemoryVFS uses 'map' property
            if (this.memoryVfs && this.memoryVfs.map instanceof Map) {
                const fileObj = this.memoryVfs.map.get(exportName);
                if (fileObj) {
                    // MemoryVFS file object: { content: Uint8Array, ... } or plain Uint8Array?
                    // Checking source: usually has .content or it is the value.
                    // But some implementations use File object with .data.
                    // Let's debug key keys if needed, but try logical property access.
                    // Log what we found
                    console.log('Found export file object:', fileObj);
                    if (fileObj instanceof Uint8Array) return fileObj;
                    if (fileObj.data instanceof Uint8Array) return fileObj.data;
                    if (fileObj.content instanceof Uint8Array) return fileObj.content;
                    // wa-sqlite MemoryVFS often uses { size, content } or similar
                }
            } else {
                // Fallback traversal if .map isn't standard
                for (const key of Object.keys(this.memoryVfs)) {
                    const val = this.memoryVfs[key];
                    if (val instanceof Map && val.has(exportName)) {
                        const fileObj = val.get(exportName);
                        if (fileObj && fileObj.data) return fileObj.data;
                        if (fileObj && fileObj.content) return fileObj.content;
                        if (fileObj instanceof Uint8Array) return fileObj;
                    }
                }
            }

            return null;
        } catch (e) {
            console.error('Export DB failed:', e);
            throw e;
        }
    }
    async exec(sql: string) {
        if (!this.db) await this.init();
        await this.sqlite3.exec(this.db, sql);
    }

    async importJson(pack: any) {
        if (!this.db) await this.init();

        console.log('Starting import...');
        // Simple transaction wrapper
        await this.exec('BEGIN TRANSACTION');
        let stmtNode: number | null = null;
        let stmtAttr: number | null = null;

        try {
            // Clear existing
            await this.exec('DELETE FROM node_attrs; DELETE FROM nodes; DELETE FROM documents;');

            // Import documents
            // Assuming pack structure: { primary: { body: [...] }, ... }
            const docId = 1;
            await this.exec(`INSERT INTO documents (id, path, urn) VALUES (${docId}, 'root', 'urn:root')`);

            const sqlNode = 'INSERT INTO nodes (doc_id, parent_id, position, type, cmd, argument, value) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const strNode = this.sqlite3.str_new(this.db, sqlNode);
            const rNode = await this.sqlite3.prepare_v2(this.db, this.sqlite3.str_value(strNode));
            stmtNode = (rNode.stmt !== undefined) ? rNode.stmt : rNode;

            const sqlAttr = 'INSERT INTO node_attrs (node_id, key, value) VALUES (?, ?, ?)';
            const strAttr = this.sqlite3.str_new(this.db, sqlAttr);
            const rAttr = await this.sqlite3.prepare_v2(this.db, this.sqlite3.str_value(strAttr));
            stmtAttr = (rAttr.stmt !== undefined) ? rAttr.stmt : rAttr;

            let nodeIdCounter = 1;

            const insertNode = async (node: any, parentId: number | null, pos: number) => {
                const id = nodeIdCounter++;
                this.sqlite3.bind_int(stmtNode, 1, docId);
                if (parentId) this.sqlite3.bind_int(stmtNode, 2, parentId);
                else this.sqlite3.bind_null(stmtNode, 2);
                this.sqlite3.bind_int(stmtNode, 3, pos);
                this.sqlite3.bind_text(stmtNode, 4, node.type);

                if (node.type === 'Command') {
                    this.sqlite3.bind_text(stmtNode, 5, node.cmd);
                    this.sqlite3.bind_text(stmtNode, 6, node.argument || '');
                    this.sqlite3.bind_null(stmtNode, 7);
                } else if (node.type === 'Text') {
                    this.sqlite3.bind_null(stmtNode, 5);
                    this.sqlite3.bind_null(stmtNode, 6);
                    this.sqlite3.bind_text(stmtNode, 7, node.value);
                } else {
                    // SegmentBreak, etc.
                    this.sqlite3.bind_null(stmtNode, 5);
                    this.sqlite3.bind_null(stmtNode, 6);
                    this.sqlite3.bind_null(stmtNode, 7);
                }

                const stepCode = await this.sqlite3.step(stmtNode);
                if (stepCode !== 101) {
                    console.error('Insert Node failed with code:', stepCode, 'Node:', node);
                }
                await this.sqlite3.reset(stmtNode);

                // Attributes
                if (node.attributes) {
                    for (const [k, v] of Object.entries(node.attributes)) {
                        this.sqlite3.bind_int(stmtAttr, 1, id);
                        this.sqlite3.bind_text(stmtAttr, 2, k);
                        this.sqlite3.bind_text(stmtAttr, 3, v as string);
                        await this.sqlite3.step(stmtAttr);
                        await this.sqlite3.reset(stmtAttr);
                    }
                }

                // Children
                if (node.children && node.children.length > 0) {
                    for (let i = 0; i < node.children.length; i++) {
                        await insertNode(node.children[i], id, i);
                    }
                }
            };

            // Import body nodes
            // Import root nodes (from body)
            if (pack.body && Array.isArray(pack.body)) {
                for (let i = 0; i < pack.body.length; i++) {
                    await insertNode(pack.body[i], null, i);
                }
            }

            await this.exec('COMMIT');
            console.log('Import complete. Imported', nodeIdCounter - 1, 'nodes.');
        } catch (e) {
            console.error('Import failed', e);
            await this.exec('ROLLBACK');
            throw e;
        } finally {
            // clean up statements
            if (stmtNode) await this.sqlite3.finalize(stmtNode);
            if (stmtAttr) await this.sqlite3.finalize(stmtAttr);
        }
    }

    async query(sql: string, params: any[] = []) {
        if (!this.db) await this.init();
        console.log('Querying:', sql);

        try {
            const str = this.sqlite3.str_new(this.db, sql);
            const preparedResult = await this.sqlite3.prepare_v2(this.db, this.sqlite3.str_value(str));
            // console.log('Prepared stmt:', preparedResult);

            if (!preparedResult) return [];

            const prepared = (preparedResult.stmt !== undefined) ? preparedResult.stmt : preparedResult;
            // console.log('Using output stmt pointer:', prepared);

            const results = [];
            try {
                // Bind params if needed (TODO implementation)
                let stepResult;
                const ROW = this.SQLiteModule.SQLITE_ROW;
                console.log('Starting step loop. SQLITE_ROW constant:', ROW);

                while ((stepResult = await this.sqlite3.step(prepared)) === ROW) {
                    const row = this.sqlite3.row(prepared);
                    results.push(row);
                }
                console.log('Step finished with code:', stepResult);
            } finally {
                await this.sqlite3.finalize(prepared);
            }
            return results;
        } catch (e) {
            console.error('Query failed:', e);
            throw e;
        }
    }
}

export const sqliteService = new SQLiteService();

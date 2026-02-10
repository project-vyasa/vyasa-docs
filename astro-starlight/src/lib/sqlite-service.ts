// Imports moved to dynamic import in init() to support SSR environment
import { SCHEMA_SQL } from './schema';

export class SQLiteService {
    private sqlite3: any = null;
    private db: number | null = null;
    private dbName: string = 'vyasa-v3';
    private SQLiteModule: any = null;
    private memoryVfs: any = null;

    async init() {
        if (this.db) return;

        console.log('Initializing SQLite WASM (vyasa-v2)...');
        // Dynamic imports to avoid SSR/Build issues
        const { default: SQLiteAsyncESMFactory } = await import('wa-sqlite/dist/wa-sqlite-async.mjs');
        const { IDBBatchAtomicVFS } = await import('wa-sqlite/src/examples/IDBBatchAtomicVFS.js');
        const { MemoryVFS } = await import('wa-sqlite/src/examples/MemoryVFS.js');
        const SQLite = await import('wa-sqlite');
        this.SQLiteModule = SQLite;

        const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

        const module = await SQLiteAsyncESMFactory({
            locateFile: (file: string) => {
                console.log('SQLite requesting:', file);
                return `${baseUrl}/wasm/${file}`;
            }
        });

        this.sqlite3 = SQLite.Factory(module);

        // Register VFS
        const idbVfs = new IDBBatchAtomicVFS(this.dbName);
        await idbVfs.isReady;
        this.sqlite3.vfs_register(idbVfs, true);

        this.memoryVfs = new MemoryVFS();
        this.sqlite3.vfs_register(this.memoryVfs, false);

        this.db = await this.sqlite3.open_v2(this.dbName);
        console.log('SQLite database opened');

        // Initialize schema using the official SQL from CLI
        try {
            await this.exec(SCHEMA_SQL);
            console.log('SQLite database schema initialized (Synced with CLI)');
        } catch (e) {
            console.error('Schema Init Failed:', e);
            throw e;
        }
    }

    async bulkPutFiles(files: Record<string, string>) {
        if (!this.db) await this.init();
        console.log(`Bulk inserting ${Object.keys(files).length} files to DB...`);
        try {
            await this.exec('BEGIN TRANSACTION');

            // Note: Schema uses 'hash', 'modified_at', 'mime_type'. We populate what we can.
            const sql = "INSERT OR REPLACE INTO files (path, content, modified_at) VALUES (?, ?, datetime('now'))";
            const stmt = await this.prepare(sql);

            for (const [path, content] of Object.entries(files)) {
                await this.runPrepared(stmt, [path, content]);
            }
            await this.sqlite3.finalize(stmt);
            await this.exec('COMMIT');
            console.log('Bulk insert complete.');
        } catch (e) {
            console.error('Bulk insert failed:', e);
            try { await this.exec('ROLLBACK'); } catch (re) { }
            throw new Error(`Bulk Put Failed: ${e}`);
        }
    }

    async getAllFiles(): Promise<Record<string, string>> {
        if (!this.db) await this.init();
        console.log('Reading all files from DB...');
        const rows = await this.query('SELECT path, content FROM files');
        const result: Record<string, string> = {};
        for (const row of rows) {
            result[row[0]] = row[1];
        }
        console.log(`Read ${Object.keys(result).length} files from DB.`);
        return result;
    }

    async updateFile(path: string, content: string) {
        if (!this.db) await this.init();
        const stmt = await this.prepare("INSERT OR REPLACE INTO files (path, content, modified_at) VALUES (?, ?, datetime('now'))");
        await this.runPrepared(stmt, [path, content]);
        await this.sqlite3.finalize(stmt);
    }

    async clearFiles() {
        if (!this.db) await this.init();
        console.log('Clearing all files from VFS...');
        await this.exec('DELETE FROM files');
        console.log('VFS Cleared.');
    }

    async getStreamId(name: string, type: string = 'tree'): Promise<number> {
        // Find existing
        const rows = await this.query(`SELECT id FROM streams WHERE name = '${name}'`);
        if (rows.length > 0) return rows[0][0] as number;

        // Create new
        const stmt = await this.prepare("INSERT INTO streams (name, type) VALUES (?, ?)");
        await this.runPrepared(stmt, [name, type]);
        const id = this.sqlite3.last_insert_rowid(this.db);
        await this.sqlite3.finalize(stmt);
        return id;
    }

    async bulkPutNodes(nodesMap: Record<string, any>) {
        if (!this.db) await this.init();
        const paths = Object.keys(nodesMap);
        if (paths.length === 0) return;

        console.log(`Bulk inserting ${paths.length} nodes to DB...`);
        try {
            await this.exec('BEGIN TRANSACTION');

            // Clean slate for nodes/streams?
            // Since this is a "compile result" sync, we often want to replace the semantic graph.
            // But we might want to keep history? CLI overrides output file.
            // Let's clear 'nodes' and 'streams' for now to be safe, or just 'nodes' and reuse 'streams'.
            await this.exec('DELETE FROM nodes');
            await this.exec('DELETE FROM streams');
            await this.exec('DELETE FROM registry');

            // 1. Create Primary Stream
            const streamId = await this.getStreamId('primary');

            // 2. Prepare Insert Node Stmt
            // Schema: id, stream_id, parent_id, type, name, body, attributes, urn, ordinal, location
            const sql = `INSERT INTO nodes (stream_id, parent_id, type, name, body, attributes, urn, ordinal, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const stmt = await this.prepare(sql);

            // 3. Insert Documents
            for (const [path, doc] of Object.entries(nodesMap)) {
                // We treat each "document" file as a top-level node in the primary stream?
                // Or should we just insert the body nodes directly if they are fragments?
                // The CLI (sqlite.rs) treats `primary` as a stream and inserts the `doc.primary.body`.
                // `nodesMap` here is `result.nodes` from compiler, which is map<path, CompiledDocument>.
                // We should iterate and insert them efficiently.

                // Let's create a "File" node to group them, or just dump contents?
                // CLI backend `write_document` takes `doc.body` and writes it.
                // It doesn't wrap in a "file" node explicitly, but it might need to if we handle multiple files.
                // Let's wrap in a `file` type node for now to keep them organized.

                const fileAttrs = JSON.stringify({ path: path, environment: doc.environment });
                await this.runPrepared(stmt, [
                    streamId,
                    null,
                    'file',
                    path.split('/').pop(),
                    null, // body
                    fileAttrs,
                    `urn:file:${path}`,
                    0,
                    JSON.stringify({})
                ]);
                const fileNodeId = this.sqlite3.last_insert_rowid(this.db);

                // Recursive insert of body nodes
                if (Array.isArray(doc.body)) {
                    for (let i = 0; i < doc.body.length; i++) {
                        await this.insertNodeRecursive(stmt, doc.body[i], streamId, fileNodeId, i + 1);
                    }
                }

                // 4. Registry
                // TODO: Insert into registry table from doc.environment.entities
            }
            await this.sqlite3.finalize(stmt);
            await this.exec('COMMIT');
            console.log('Bulk insert nodes complete.');

        } catch (e) {
            console.error('Bulk insert nodes failed:', e);
            try { await this.exec('ROLLBACK'); } catch (re) { }
        }
    }

    private async insertNodeRecursive(stmt: any, node: any, streamId: number, parentId: number | null, ordinal: number) {
        if (!node) return;

        let type = node.type || "unknown";
        let name = null;
        let body = null;
        let attrs = null;
        let urn = null;
        let location = JSON.stringify(node.location || {});

        if (type === "Command") {
            type = "command"; // Normalize to lower case as per CLI convention if relevant, though CLI stores "command" literal.
            name = node.cmd;
            body = node.argument || null;
            if (node.attributes) {
                urn = node.attributes.urn || null;
                attrs = JSON.stringify(node.attributes);
            }
        } else if (type === "Text") {
            type = "text";
            name = null;
            body = node.value || "";
        } else if (type === "SegmentBreak") {
            type = "break";
            body = "|";
        } else if (type === "Comment") {
            type = "comment";
            body = node.content;
        }

        await this.runPrepared(stmt, [
            streamId,
            parentId,
            type,
            name,
            body,
            attrs,
            urn,
            ordinal,
            location
        ]);
        const nodeId = this.sqlite3.last_insert_rowid(this.db);

        // Children
        if (node.children && Array.isArray(node.children)) {
            for (let i = 0; i < node.children.length; i++) {
                await this.insertNodeRecursive(stmt, node.children[i], streamId, nodeId, i + 1);
            }
        }
    }

    // Helper for prepared statements
    async prepare(sql: string) {
        const str = this.sqlite3.str_new(this.db, sql);
        const prep = await this.sqlite3.prepare_v2(this.db, this.sqlite3.str_value(str));
        this.sqlite3.str_finish(str);
        return (prep.stmt !== undefined) ? prep.stmt : prep;
    }

    async runPrepared(stmt: number, params: any[]) {
        this.sqlite3.reset(stmt);
        for (let i = 0; i < params.length; i++) {
            const val = params[i];
            if (val === null || val === undefined) this.sqlite3.bind_null(stmt, i + 1);
            else if (typeof val === 'number') this.sqlite3.bind_double(stmt, i + 1, val);
            else this.sqlite3.bind_text(stmt, i + 1, String(val));
        }
        const rc = await this.sqlite3.step(stmt);
        if (rc !== 101) throw new Error('Step failed: ' + rc);
    }

    async exportDb(): Promise<Uint8Array | null> {
        if (!this.db) return null;
        console.log('Exporting DB...');
        if (this.sqlite3.serialize) {
            return await this.sqlite3.serialize(this.db, 'main');
        }
        return null;
    }

    async exec(sql: string) {
        if (!this.db) await this.init();
        await this.sqlite3.exec(this.db, sql);
    }

    async importJson(pack: any) {
        // Deprecated/Needs update for new schema if still used.
        // For now logging warning.
        console.warn("importJson not fully updated for new schema.");
    }

    async query(sql: string, params: any[] = []) {
        if (!this.db) await this.init();
        try {
            const str = this.sqlite3.str_new(this.db, sql);
            const preparedResult = await this.sqlite3.prepare_v2(this.db, this.sqlite3.str_value(str));
            if (!preparedResult) return [];

            const prepared = (preparedResult.stmt !== undefined) ? preparedResult.stmt : preparedResult;
            const results = [];
            try {
                let stepResult;
                const ROW = this.SQLiteModule.SQLITE_ROW;
                while ((stepResult = await this.sqlite3.step(prepared)) === ROW) {
                    const row = this.sqlite3.row(prepared);
                    results.push(row);
                }
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

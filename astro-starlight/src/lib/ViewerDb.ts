import { sqliteService } from './sqlite-service';

export class ViewerDb {
    private sqlite3: any = null;
    private db: number | null = null;
    private dbName: string = 'viewer-db-temp';

    async loadFromUrl(url: string) {
        // Fetch the sqlite file
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        
        // We reuse the WASM initialization from the existing service
        if (!sqliteService['sqlite3']) {
            await sqliteService.init();
        }
        this.sqlite3 = sqliteService['sqlite3'];
        
        // Close previous if exists
        if (this.db) {
            await this.sqlite3.close(this.db);
            this.db = null;
        }
        
        // Generate a unique dbName to prevent schema caching issues when switching DBs
        this.dbName = `viewer-db-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        
        // Populate MemoryVFS directly
        const memoryVfs = sqliteService['memoryVfs'];
        if (memoryVfs) {
            memoryVfs.mapNameToFile.set(this.dbName, {
                name: this.dbName,
                flags: 0,
                size: buffer.byteLength,
                data: buffer
            });
        }
        
        // Open a memory DB (without OPEN_CREATE so it must use our file)
        this.db = await this.sqlite3.open_v2(
            this.dbName, 
            this.sqlite3.OPEN_READONLY,
            "memory"
        );
        
        console.log("Loaded SQLite DB from URL into memory VFS.");
    }
    
    async query(sql: string, params: any[] = []) {
        if (!this.db) throw new Error("DB not loaded");
        try {
            const str = this.sqlite3.str_new(this.db, sql);
            const preparedResult = await this.sqlite3.prepare_v2(this.db, this.sqlite3.str_value(str));
            if (!preparedResult) return [];

            const prepared = (preparedResult.stmt !== undefined) ? preparedResult.stmt : preparedResult;
            const results = [];
            
            // Re-bind params
            this.sqlite3.reset(prepared);
            for (let i = 0; i < params.length; i++) {
                const val = params[i];
                if (val === null || val === undefined) this.sqlite3.bind_null(prepared, i + 1);
                else if (typeof val === 'number') this.sqlite3.bind_double(prepared, i + 1, val);
                else this.sqlite3.bind_text(prepared, i + 1, String(val));
            }

            try {
                let stepResult;
                const ROW = sqliteService['SQLiteModule'].SQLITE_ROW;
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

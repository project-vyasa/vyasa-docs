const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/IDBBatchAtomicVFS.CC8B09Xw.js","_astro/VFS.s2ec6Ydu.js","_astro/sqlite-constants.BOKEY2FU.js","_astro/MemoryVFS.Bur-bvtw.js","_astro/sqlite-api.CRMg_kgw.js"])))=>i.map(i=>d[i]);
import{M as C,N as Q,O as U,K as N,P as y,Q as Y,S as g,R as K,T as P,U as q,V as G,n as h,W as $,X as O,Y as I,Z as z,_ as M,p as J,y as j,$ as W,a0 as H,a1 as Z,a2 as k,a3 as ee,a4 as te,a5 as ie,a6 as se,a7 as B,a8 as re,a9 as x,aa as F,ab as T,ac as ne}from"./branches.CAbNiEYW.js";import{_ as w}from"./preload-helper.Cpe9nc4y.js";let m=!1;function ae(t){var e=m;try{return m=!1,[t(),m]}finally{m=e}}function v(t,e){return t===e||t?.[g]===e}function Ee(t={},e,i,s){var r=C.r,n=y;return Q(()=>{var l,o;return U(()=>{l=o,o=[],N(()=>{v(i(...o),t)||(e(t,...o),l&&v(i(...l),t)&&e(null,...l))})}),()=>{let a=n;for(;a!==r&&a.parent!==null&&a.parent.f&Y;)a=a.parent;const c=()=>{o&&v(i(...o),t)&&e(null,...o)},f=a.teardown;a.teardown=()=>{c(),f?.()}}}),t}function _e(t=!1){const e=C,i=e.l.u;if(!i)return;let s=()=>$(e.s);if(t){let r=0,n={};const l=O(()=>{let o=!1;const a=e.s;for(const c in a)a[c]!==n[c]&&(n[c]=a[c],o=!0);return o&&r++,r});s=()=>h(l)}i.b.length&&K(()=>{D(e,s),q(i.b)}),P(()=>{const r=N(()=>i.m.map(G));return()=>{for(const n of r)typeof n=="function"&&n()}}),i.a.length&&P(()=>{D(e,s),q(i.a)})}function D(t,e){if(t.l.s)for(const i of t.l.s)h(i);e()}const oe={get(t,e){if(!t.exclude.has(e))return t.props[e]},set(t,e){return!1},getOwnPropertyDescriptor(t,e){if(!t.exclude.has(e)&&e in t.props)return{enumerable:!0,configurable:!0,value:t.props[e]}},has(t,e){return t.exclude.has(e)?!1:e in t.props},ownKeys(t){return Reflect.ownKeys(t.props).filter(e=>!t.exclude.has(e))}};function Te(t,e,i){return new Proxy({props:t,exclude:e},oe)}const le={get(t,e){if(!t.exclude.includes(e))return h(t.version),e in t.special?t.special[e]():t.props[e]},set(t,e,i){if(!(e in t.special)){var s=y;try{F(t.parent_effect),t.special[e]=ue({get[e](){return t.props[e]}},e,M)}finally{F(s)}}return t.special[e](i),x(t.version),!0},getOwnPropertyDescriptor(t,e){if(!t.exclude.includes(e)&&e in t.props)return{enumerable:!0,configurable:!0,value:t.props[e]}},deleteProperty(t,e){return t.exclude.includes(e)||(t.exclude.push(e),x(t.version)),!0},has(t,e){return t.exclude.includes(e)?!1:e in t.props},ownKeys(t){return Reflect.ownKeys(t.props).filter(e=>!t.exclude.includes(e))}};function Se(t,e){return new Proxy({props:t,exclude:e,special:{},version:re(0),parent_effect:y},le)}const ce={get(t,e){let i=t.props.length;for(;i--;){let s=t.props[i];if(T(s)&&(s=s()),typeof s=="object"&&s!==null&&e in s)return s[e]}},set(t,e,i){let s=t.props.length;for(;s--;){let r=t.props[s];T(r)&&(r=r());const n=I(r,e);if(n&&n.set)return n.set(i),!0}return!1},getOwnPropertyDescriptor(t,e){let i=t.props.length;for(;i--;){let s=t.props[i];if(T(s)&&(s=s()),typeof s=="object"&&s!==null&&e in s){const r=I(s,e);return r&&!r.configurable&&(r.configurable=!0),r}}},has(t,e){if(e===g||e===B)return!1;for(let i of t.props)if(T(i)&&(i=i()),i!=null&&e in i)return!0;return!1},ownKeys(t){const e=[];for(let i of t.props)if(T(i)&&(i=i()),!!i){for(const s in i)e.includes(s)||e.push(s);for(const s of Object.getOwnPropertySymbols(i))e.includes(s)||e.push(s)}return e}};function we(...t){return new Proxy({props:t},ce)}function ue(t,e,i,s){var r=!Z||(i&k)!==0,n=(i&H)!==0,l=(i&ie)!==0,o=s,a=!0,c=void 0,f=()=>l&&r?(c??=O(s),h(c)):(a&&(a=!1,o=l?N(s):s),o);let p;if(n){var b=g in t||B in t;p=I(t,e)?.set??(b&&e in t?u=>t[e]=u:void 0)}var d,A=!1;n?[d,A]=ae(()=>t[e]):d=t[e],d===void 0&&s!==void 0&&(d=f(),p&&(r&&z(),p(d)));var E;if(r?E=()=>{var u=t[e];return u===void 0?f():(a=!0,u)}:E=()=>{var u=t[e];return u!==void 0&&(o=void 0),u===void 0?o:u},r&&(i&M)===0)return E;if(p){var X=t.$$legacy;return(function(u,S){return arguments.length>0?((!r||!S||X||A)&&p(S?E():u),u):E()})}var R=!1,_=((i&ee)!==0?O:te)(()=>(R=!1,E()));n&&h(_);var V=y;return(function(u,S){if(arguments.length>0){const L=S?h(_):r&&n?J(u):u;return j(_,L),R=!0,o!==void 0&&(o=L),u}return se&&R||(V.f&W)!==0?_.v:h(_)})}ne();const fe=`
-- Vyasa SQLite VFS & Graph Schema

-- 1. Virtual File System (VFS)
-- Stores the source code.
CREATE TABLE IF NOT EXISTS files (
    path TEXT PRIMARY KEY,       -- Virtual path (e.g., "content/1.vy")
    content TEXT NOT NULL,       -- Raw content (UTF-8)
    hash TEXT,                   -- Content hash (SHA-256) for cache invalidation
    modified_at DATETIME,        -- Last modification time (ISO8601)
    mime_type TEXT DEFAULT 'text/vyasa'
);

-- 2. Streams (Output Organization)
-- Defines compilation roots (e.g., Primary, Footnotes).
CREATE TABLE IF NOT EXISTS streams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,   -- "primary", "footnotes", "metadata"
    type TEXT NOT NULL           -- "tree"
);

-- 3. Nodes (The Compiled Graph)
-- Stores the AST/DOM. Replaces JSON output.
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY,      -- Auto-increment ID
    stream_id INTEGER,           -- Belongs to stream
    parent_id INTEGER,           -- Hierarchy
    
    -- Structure
    type TEXT NOT NULL,          -- "command", "text", "comment", "template", "break"
    name TEXT,                   -- Command name (e.g. "verse") or Tag name
    
    -- Data
    body TEXT,                   -- Text content or Template body
    attributes JSON,             -- Key-value pairs (stored as JSON object)
    
    -- Metadata
    urn TEXT,                    -- Universal Resource Name (if applicable)
    ordinal INTEGER,             -- Ordering within parent
    location JSON,               -- Source span {file, line, col, length}
    
    FOREIGN KEY(stream_id) REFERENCES streams(id),
    FOREIGN KEY(parent_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_urn ON nodes(urn);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);

-- 4. Registry (Global Quantities)
-- Stores entities and cross-reference data.
CREATE TABLE IF NOT EXISTS registry (
    name TEXT PRIMARY KEY,
    attributes JSON              -- Entity attributes
);

-- 5. Manifest (Workspace Config)
-- Stores build metadata.
CREATE TABLE IF NOT EXISTS manifest (
    key TEXT PRIMARY KEY,
    value TEXT
);

`;class de{sqlite3=null;db=null;dbName="vyasa-v3";SQLiteModule=null;memoryVfs=null;wasmModule=null;SQLite=null;async init(){if(this.db)return;console.log("Initializing SQLite WASM (vyasa-v2)...");const{default:e}=await w(async()=>{const{default:a}=await import("./wa-sqlite-async.CrbEWIeq.js");return{default:a}},[]),{IDBBatchAtomicVFS:i}=await w(async()=>{const{IDBBatchAtomicVFS:a}=await import("./IDBBatchAtomicVFS.CC8B09Xw.js");return{IDBBatchAtomicVFS:a}},__vite__mapDeps([0,1,2])),{MemoryVFS:s}=await w(async()=>{const{MemoryVFS:a}=await import("./MemoryVFS.Bur-bvtw.js");return{MemoryVFS:a}},__vite__mapDeps([3,1,2])),r=await w(()=>import("./sqlite-api.CRMg_kgw.js"),__vite__mapDeps([4,2]));this.SQLiteModule=r,this.SQLite=r;const n="/vyasa-docs".replace(/\/$/,""),l=await e({locateFile:a=>(console.log("SQLite requesting:",a),`${n}/wasm/${a}`)});this.wasmModule=l,this.sqlite3=r.Factory(l);const o=new i(this.dbName);await o.isReady,this.sqlite3.vfs_register(o,!0),this.memoryVfs=new s,this.sqlite3.vfs_register(this.memoryVfs,!1),this.db=await this.sqlite3.open_v2(this.dbName),console.log("SQLite database opened");try{await this.exec(fe),console.log("SQLite database schema initialized (Synced with CLI)")}catch(a){throw console.error("Schema Init Failed:",a),a}}async bulkPutFiles(e){this.db||await this.init(),console.log(`Bulk inserting ${Object.keys(e).length} files to DB...`);try{await this.exec("BEGIN TRANSACTION");const s=await this.prepare("INSERT OR REPLACE INTO files (path, content, modified_at) VALUES (?, ?, datetime('now'))");for(const[r,n]of Object.entries(e))await this.runPrepared(s,[r,n]);await this.sqlite3.finalize(s),await this.exec("COMMIT"),console.log("Bulk insert complete.")}catch(i){console.error("Bulk insert failed:",i);try{await this.exec("ROLLBACK")}catch{}throw new Error(`Bulk Put Failed: ${i}`)}}async getAllFiles(){this.db||await this.init(),console.log("Reading all files from DB...");const e=await this.query("SELECT path, content FROM files"),i={};for(const s of e)i[s[0]]=s[1];return console.log(`Read ${Object.keys(i).length} files from DB.`),i}async updateFile(e,i){this.db||await this.init();const s=await this.prepare("INSERT OR REPLACE INTO files (path, content, modified_at) VALUES (?, ?, datetime('now'))");await this.runPrepared(s,[e,i]),await this.sqlite3.finalize(s)}async clearFiles(){this.db||await this.init(),console.log("Clearing all files from VFS..."),await this.exec("DELETE FROM files"),console.log("VFS Cleared.")}async getStreamId(e,i="tree"){const s=await this.query(`SELECT id FROM streams WHERE name = '${e}'`);if(s.length>0)return s[0][0];const r=await this.prepare("INSERT INTO streams (name, type) VALUES (?, ?)");await this.runPrepared(r,[e,i]);const n=this.sqlite3.last_insert_rowid(this.db);return await this.sqlite3.finalize(r),n}async bulkPutNodes(e){this.db||await this.init();const i=Object.keys(e);if(i.length!==0){console.log(`Bulk inserting ${i.length} nodes to DB...`);try{await this.exec("BEGIN TRANSACTION"),await this.exec("DELETE FROM nodes"),await this.exec("DELETE FROM streams"),await this.exec("DELETE FROM registry");const s=await this.getStreamId("primary"),n=await this.prepare("INSERT INTO nodes (stream_id, parent_id, type, name, body, attributes, urn, ordinal, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");for(const[l,o]of Object.entries(e)){const a=JSON.stringify({path:l,environment:o.environment});await this.runPrepared(n,[s,null,"file",l.split("/").pop(),null,a,`urn:file:${l}`,0,JSON.stringify({})]);const c=this.sqlite3.last_insert_rowid(this.db);if(Array.isArray(o.body))for(let f=0;f<o.body.length;f++)await this.insertNodeRecursive(n,o.body[f],s,c,f+1)}await this.sqlite3.finalize(n),await this.exec("COMMIT"),console.log("Bulk insert nodes complete.")}catch(s){console.error("Bulk insert nodes failed:",s);try{await this.exec("ROLLBACK")}catch{}}}}async insertNodeRecursive(e,i,s,r,n){if(!i)return;let l=i.type||"unknown",o=null,a=null,c=null,f=null,p=JSON.stringify(i.location||{});l==="Command"?(l="command",o=i.cmd,a=i.argument||null,i.attributes&&(f=i.attributes.urn||null,c=JSON.stringify(i.attributes))):l==="Text"?(l="text",o=null,a=i.value||""):l==="SegmentBreak"?(l="break",a="|"):l==="Comment"&&(l="comment",a=i.content),await this.runPrepared(e,[s,r,l,o,a,c,f,n,p]);const b=this.sqlite3.last_insert_rowid(this.db);if(i.children&&Array.isArray(i.children))for(let d=0;d<i.children.length;d++)await this.insertNodeRecursive(e,i.children[d],s,b,d+1)}async prepare(e){const i=this.sqlite3.str_new(this.db,e),s=await this.sqlite3.prepare_v2(this.db,this.sqlite3.str_value(i));return this.sqlite3.str_finish(i),s.stmt!==void 0?s.stmt:s}async runPrepared(e,i){this.sqlite3.reset(e);for(let r=0;r<i.length;r++){const n=i[r];n==null?this.sqlite3.bind_null(e,r+1):typeof n=="number"?this.sqlite3.bind_double(e,r+1,n):this.sqlite3.bind_text(e,r+1,String(n))}const s=await this.sqlite3.step(e);if(s!==101)throw new Error("Step failed: "+s)}async exportDb(){return this.db?(console.log("Exporting DB..."),this.sqlite3.serialize?await this.sqlite3.serialize(this.db,"main"):null):null}async exec(e){this.db||await this.init(),await this.sqlite3.exec(this.db,e)}async importJson(e){console.warn("importJson not fully updated for new schema.")}async query(e,i=[]){this.db||await this.init();try{const s=this.sqlite3.str_new(this.db,e),r=await this.sqlite3.prepare_v2(this.db,this.sqlite3.str_value(s));if(!r)return[];const n=r.stmt!==void 0?r.stmt:r,l=[];try{let o;const a=this.SQLiteModule.SQLITE_ROW;for(;(o=await this.sqlite3.step(n))===a;){const c=this.sqlite3.row(n);l.push(c)}}finally{await this.sqlite3.finalize(n)}return l}catch(s){throw console.error("Query failed:",s),s}}}const me=new de;export{we as a,Ee as b,_e as i,Se as l,ue as p,Te as r,me as s};

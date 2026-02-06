---
title: RFC 012 SQLite VFS
description: Architecture for using SQLite as the single source of truth for Vyasa Source Code and Graph Output.
---

# RFC 012: SQLite VFS & Graph Store

**Status**: Accepted
**Date**: 2026-02-05
**Topics**: VFS, Persistence, Architecture, WASM

## Summary
Migrate Vyasa from a file-based compiler (reading files, producing JSON) to a **SQLite-native compiler**. The SQLite database becomes the single source of truth for both:
1.  **Source Code** (The Virtual File System).
2.  **Compiled Graph** (The AST/Node Output).

This unifies persistence, querying, and Incremental Compilation into one technology stack, leveraging `wa-sqlite` for high-performance in-browser storage (OPFS).

## Motivation
- **Single File Package**: Entire workspace (source + output) is just `workspace.db`. Easy to share/sync.
- **True Persistence**: Browser auto-saves to OPFS. No more LocalStorage limits.
- **Rich Queries**: IDE features become SQL queries. "Find all references to verse 1.1" -> `SELECT * FROM nodes WHERE attributes LIKE '%urn:1.1%'`.
- **Incremental Builds**: Store hash of source files. If hash matches, skip parsing.

## Scope Clarification
1.  **Native CLI**: Will continue to use the **OS Filesystem** as the workspace source. It can *compile to* a SQLite DB (as an output target), but developer ergonomics (editors, git) remain file-based.
2.  **Browser (WASM)**: Will use the **SQLite VFS** as its workspace source. This replaces the volatile in-memory filesystem.
3.  **"Git-in-a-DB" Metaphor**: Refers to the *portability* of the DB (single file snapshot) and *content-hashing* for incremental builds. It does **not** imply implementing version control features (commits, branches) within the DB at this stage. The `files` table stores only the current state of the workspace.

## Schema Design

### 1. `files` (The VFS)
Stores the raw source code.
```sql
CREATE TABLE files (
    path TEXT PRIMARY KEY,       -- Virtual path (e.g., "content/1.vy")
    content TEXT NOT NULL,       -- Raw content (UTF-8)
    hash TEXT,                   -- Content hash (SHA-256) for cache invalidation
    modified_at DATETIME,        -- Last modification time
    mime_type TEXT               -- "text/vyasa", "text/html", etc.
);
```

### 2. `nodes` (The Graph)
Stores the compiled output. This replaces the huge JSON tree.
```sql
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,         -- URN or UUID
    parent_id TEXT,              -- Hierarchy
    type TEXT NOT NULL,          -- "command", "text", "template"
    name TEXT,                   -- Command name or Tag name
    attributes JSON,             -- Key-value pairs
    body TEXT,                   -- Text content or Template body
    location JSON,               -- Source span {file, line, col}
    FOREIGN KEY(parent_id) REFERENCES nodes(id)
);

CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_nodes_type ON nodes(type);
```

## Compiler Architecture Change

**Current Flow:**
`Input (Map<Path, String>)` -> `Output (JSON Tree)`

**New Flow:**
`Input (SqliteConn)` -> `Output (SqliteConn Transaction)`

1.  **Mount**: Compiler opens `workspace.db`.
2.  **Scan**: Reads `files` table. Checks hashes against internal cache.
3.  **Parse**: For changed files, parse and generate AST.
4.  **Emplace**: Write new AST nodes to `nodes` table (clearing old nodes for that file).
5.  **Project**: Run templates? (Maybe templates run on-demand or materialize into a `render_cache` table?)

## PlayArea Integration
- **Boot**: Initialize `wa-sqlite` with OPFS backend.
- **Load**: Open/Create `vyasa.db`.
- **Edit**: User types in `CodeEditor`. `onChange` -> UPDATE `files` SET content = ?`.
- **Compile**: Click "Run". Rust WASM reads DB, writes DB.
- **Render**: `PlayArea` queries `nodes` table to build the Tree View or rendered HTML.

## Non-Technical Architecture Overview

For users, the Vyasa App behaves like a desktop application running inside a browser tab, similar to Google Docs or Photoshop Web.

### The 3 Core Pieces

1.  **PlayArea (The Manager)**
    *   **Role**: This is the User Interface (UI). It manages the editor, visual preview, and user interactions.
    *   **Analogy**: The "Operating System" or Desktop Environment.

2.  **SQLite (The Hard Drive)**
    *   **Role**: A high-performance database running entirely in the browser. It uses **OPFS** (Origin Private File System), a special, hidden folder on your computer that the browser can access very quickly.
    *   **Analogy**: The "Filesystem". It ensures that if you refresh the page or close the browser, your work is saved and loads instantly next time.

3.  **Vyasa Compiler (The Engine)**
    *   **Role**: The heavy lifter. Written in Rust/WASM, it acts as a black box that transforms Source Code into the Compiled Graph.
    *   **Analogy**: The "CPU" or Application Logic.

### The Data Flow

```mermaid
graph TD
    User((User))
    
    subgraph Browser Tab ["Browser Tab (The Runtime)"]
        direction TB
        
        UI[PlayArea JS]
        Disk[("SQLite DB (wa-sqlite)")]
        Engine[Vyasa Compiler WASM]
        
        %% Editing
        User -- 1. Types Code --> UI
        UI -- 2. Auto-Saves --> Disk
        
        %% Compiling
        User -- 3. Clicks 'Preview' --> UI
        UI -- 4. Reads All Files --> Disk
        Disk -- 5. Returns Files --> UI
        UI -- 6. Sends Files to --> Engine
        
        %% Result
        Engine -- 7. Compiles (In Memory) --> Engine
        Engine -- 8. Returns Graph JSON --> UI
        UI -- 9. Renders Preview --> User
    end
    
    subgraph PC ["Your Computer"]
        Stor[OPFS Storage]

## Appendix: Alternatives Considered

### Embedding SQLite in WASM (Rust-side)
We initially attempted to compile `rusqlite` (bundled mode) directly into the `vyasac` WASM binary.
- **Goal**: Allow Rust output logic (`SqliteGraphSink`) to write directly to the DB without leaving WASM memory.
- **Result**: Failed due to `wasm32-unknown-unknown` target missing C standard library headers (`stdio.h`) required by the C-based SQLite amalgamation.
- **Decision**: Reverted to a hybrid approach where the Browser/JS manages the DB (via `wa-sqlite` which handles the VFS/OPFS bridging) and passes data to Rust.
- **TODO**: Reconsider this when pure-Rust SQLite implementations (e.g. `sqlite-rs`) mature or when `rusqlite` adds better support for `wasm32-unknown-unknown` without WASI.

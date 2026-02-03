---
title: RFC-009 SQLite WASM Strategy
description: Research note on SQLite WASM bundle sizing and optimization strategies.
---

# RFC 009: SQLite WASM Strategy

**Status**: Research
**Date**: 2026-02-02
**Topics**: WASM, SQLite, Bundle Size, Optimization

## 1. Context

The current `vyasac.wasm` bundle is **~4.5 MB** (gzip: ~1.3 MB). As we consider packaging Vyasa workspaces for end-user applications (Electron, PWA), SQLite becomes an attractive backend for:
- Efficient storage of large narrative graphs.
- Query capabilities for segment addressing.
- Offline-first user experiences.

This note explores the bundle size implications of adding SQLite WASM.

### Bundle Composition (Benchmark 2026-02-02)

| Crate | Purpose | Est. Size |
|-------|---------|-----------|
| **tera** | Jinja2 template engine | ~400-500 KB |
| **handlebars** | Alternative templates (redundant?) | ~200-300 KB |
| **serde_json** | JSON serialization | ~150-200 KB |
| **regex** | Pattern matching | ~200-300 KB |
| **chrono** | Date/time handling | ~100-150 KB |
| **wasm-bindgen** | JS interop | ~50-100 KB |
| **Parser (parser.rs)** | Custom Vyasa parser | ~200-300 KB |
| **Data sections** | Static strings, tables | ~1.5-2 MB |

> [!IMPORTANT]
> Both **tera** and **handlebars** are included. Removing handlebars could save ~200-300 KB.

## 2. SQLite WASM Library Options

| Library | Uncompressed | Gzipped | Notes |
|---------|-------------|---------|-------|
| **sql.js** | ~1.5 MB | ~500 KB | Mature, Emscripten-based. |
| **sqlite-wasm** (official) | ~1.2 MB | ~400 KB | From SQLite team. |
| **wa-sqlite** | ~600 KB | ~200 KB | Minimal, modern, recommended. |

**Recommendation**: `wa-sqlite` is sufficient for our needs (simple CRUD, no advanced SQL features required).

## 3. Projected Bundle Sizes

| Scenario | Uncompressed | Gzipped |
|----------|-------------|---------|
| Current (`vyasac` only) | 4.5 MB | 1.3 MB |
| + wa-sqlite | ~5.1 MB | ~1.5 MB |
| + sql.js | ~6.0 MB | ~1.8 MB |

## 4. Optimization Hypothesis: SQLite as AST Store

An interesting question: *Could SQLite actually reduce vyasac WASM size?*

Currently, vyasac WASM likely includes:
- **Serde JSON** serialization (~hundreds of KB).
- **Tera** template engine (~300-500 KB contribution).
- In-memory data structures for the AST.

If we offload the "AST persistence" to SQLite:
1. **Remove Serde JSON**: Store nodes/edges directly in tables instead of JSON blobs.
2. **Lazy Loading**: Nodes fetched on-demand via SQL queries, reducing initial memory.
3. **Smaller Compiler Core**: The compiler becomes a "processor" that reads/writes to a shared DB.

**Potential Savings**: If Serde JSON + large struct layouts contribute ~1-1.5 MB, and wa-sqlite adds ~0.6 MB, there could be a **net reduction** or near-parity.

### Trade-offs
| Approach | Pros | Cons |
|----------|------|------|
| Current (JSON + Tera) | Simple, no external deps. | Large bundle, no query. |
| SQLite Backend | Query, smaller compiled logic. | Adds wa-sqlite dep, schema mgmt. |
| **Remove Tera from WASM** | ~300-500 KB savings. | Templates processed JS-side. |

### Side Exploration: Tera in WASM

Tera is a powerful Jinja2-like template engine, but it adds significant weight to the WASM bundle. Alternatives:

1. **Keep Tera in WASM**: Full server-side rendering capability.
2. **Move Tera to JS**: Use [Nunjucks](https://mozilla.github.io/nunjucks/) or [Eta](https://eta.js.org/) in JS; vyasac outputs JSON, JS renders.
3. **Minimal Built-in Renderer**: vyasac has a simple string-based renderer; complex templates handled externally.

**Recommendation**: For end-user apps, consider option 2 (Tera → JS). This could save ~300-500 KB from the WASM bundle.

## 5. Next Steps

1. **Benchmark**: Build `vyasac` with `--features sqlite` (excluding JSON serde) and measure WASM size.
2. **Evaluate wa-sqlite**: Prototype integration, confirm it meets our needs.
3. **Lazy Loading PoC**: Test fetching AST nodes on-demand from SQLite.

## 6. Proposed SQLite Schema

A minimal schema for storing Vyasa data:

```sql
-- Core document metadata
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    title TEXT,
    urn TEXT,
    parent_id INTEGER REFERENCES documents(id)
);

-- AST nodes (flat representation)
CREATE TABLE nodes (
    id INTEGER PRIMARY KEY,
    doc_id INTEGER REFERENCES documents(id),
    parent_id INTEGER REFERENCES nodes(id),
    position INTEGER,  -- Order within parent
    type TEXT CHECK(type IN ('Command', 'Text', 'SegmentBreak')),
    cmd TEXT,          -- Command name (if type='Command')
    argument TEXT,     -- [argument]
    value TEXT         -- Text content (if type='Text')
);

-- Node attributes (key-value)
CREATE TABLE node_attrs (
    node_id INTEGER REFERENCES nodes(id),
    key TEXT,
    value TEXT,
    PRIMARY KEY (node_id, key)
);

-- Entity registry
CREATE TABLE entities (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    category TEXT,
    label_dev TEXT,
    label_iast TEXT
);

-- Context/settings (JSON blob for flexibility)
CREATE TABLE meta (
    key TEXT PRIMARY KEY,
    value TEXT  -- JSON
);

-- Indexes for common queries
CREATE INDEX idx_nodes_doc ON nodes(doc_id);
CREATE INDEX idx_nodes_cmd ON nodes(cmd) WHERE type = 'Command';
CREATE INDEX idx_docs_urn ON documents(urn);
```

### Query Examples

**Get all verses from a document:**
```sql
SELECT n.*, na.key, na.value
FROM nodes n
LEFT JOIN node_attrs na ON n.id = na.node_id
WHERE n.doc_id = ? AND n.cmd = 'verse';
```

**Get entity labels:**
```sql
SELECT name, label_dev, label_iast FROM entities WHERE category = 'entity';
```

## 7. JSON vs SQLite Pack Format

| Aspect | JSON Pack | SQLite Pack |
|--------|-----------|-------------|
| **Size** | ~1-2 MB for large works | ~0.5-1 MB (normalized, indexed) |
| **Query** | Full load + JS filter | SQL queries, lazy loading |
| **Streaming** | No | Row-by-row possible |
| **Offline** | IndexedDB/localStorage | SQLite OPFS/IndexedDB VFS |
| **Tooling** | Any JSON viewer | DB Browser, SQL clients |

**Recommendation**: Use SQLite for large works (100+ documents); JSON for small samples.

## 8. References

- [wa-sqlite GitHub](https://github.com/rhashimoto/wa-sqlite)
- [Official SQLite WASM](https://sqlite.org/wasm/doc/trunk/index.md)
- [sql.js](https://github.com/sql-js/sql.js)


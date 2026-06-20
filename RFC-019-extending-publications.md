# RFC 019: Extending Publications (Cross-Publication Merging)

## Goal
To allow a derived publication (e.g., `vedabase-bg`) to securely inherit or merge streams (e.g., `mula`, `iast`) from a base publication (e.g., `vyasa-bg`), without physically duplicating the content files in the derived repository. This enables modular, layered, and collaborative corpora ecosystems.

## Motivation
Presently, a workspace contains all its `content/*.vy` files. If an author wants to create a new English translation (`vedabase-bg`) of the Bhagavad Gita, they shouldn't have to duplicate the original Devanagari (`mula`) and Roman transliteration (`iast`) streams. They should only maintain the `en-translation` stream locally, and structurally merge the missing pieces from a trusted public source (`vyasa-bg`).

This adheres to our invariants:
1. **Publication Bloat Optimization**: Avoids duplicating massive source files across multiple workspaces.
2. **Unified WASM Runtime**: Relies on the same deterministic graph sorting and URN-relative querying logic to stitch streams together.

## Proposed Architecture

### 1. The `dependencies` Table
We introduce a `[dependencies]` section in the `vyasac.toml` of the derived publication. This acts similarly to Cargo or NPM dependencies.

```toml
[dependencies]
base_corpus = { package = "vyasa-bg", source = "local", path = "../vyasa-bg" }
# Future: base_corpus = { url = "https://vyasa.org/packages/vyasa-bg.sqlite" }
```

### 2. Stream Inheritance via Projection Profiles
In the layout configurations (`vyasac.toml`), authors can map streams from remote dependencies to local projection streams:

```toml
[build.view.reading]
layout = "grid"
streams = [
    { name = "mula", source = "dependency.base_corpus.mula" },
    { name = "iast", source = "dependency.base_corpus.iast" },
    { name = "translation", source = "local.translation" }
]
```

### 3. Compile-Time vs Runtime Merging
There are two potential paradigms for executing this merge:

**A. Compile-Time Ingestion (Recommended for Zero-Runtime Invariants)**
When `vyasac pack` runs for `vedabase-bg`:
1. It reads the local `translation` stream files.
2. It fetches the `vyasa-bg` database package via the dependency declaration.
3. For every `urn:vyasa:vedabase:bg:X:Y`, it queries the base package for the matching relative path (e.g., `X:Y`) to extract the `mula` and `iast` HTML blocks.
4. It weaves them into a single comprehensive SQLite `.db` output for `vedabase-bg`.
*Pros*: Svelte client logic remains entirely untouched. Load speed is identical. 
*Cons*: The final `.sqlite` file for the derived work duplicates the base bytes.

**B. Runtime WASM Merging (Recommended for Bloat Optimization)**
1. The Svelte Viewer initializes the `VyasaViewerRuntime` and loads *multiple* SQLite databases via `viewerDb.loadFromUrl()`.
2. When the user requests a View for `urn:vyasa:bg:1:1`, the `weave_view` WASM function accepts an array of rows drawn from a SQL `UNION` or `ATTACH DATABASE` query across both DBs.
3. The WASM function groups streams based on the `[dependencies]` mapping embedded in the manifest JSON.
*Pros*: Zero data duplication. True decentralized architecture.
*Cons*: Requires `ATTACH DATABASE` logic in SQL.js, or complex client-side multi-DB querying.

## Next Steps
We will evaluate whether SQLite `ATTACH DATABASE` in SQL.js performs fast enough for Runtime WASM Merging. If not, we will default to Compile-Time Ingestion as it guarantees performance and backward compatibility with the existing Svelte client.

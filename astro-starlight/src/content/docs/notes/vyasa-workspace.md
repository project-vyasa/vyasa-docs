---
title: Workspace Design History
description: History of design decisions for the Vyasa workspace model.
---

# Vyasa Workspace Design History

*In reverse chronological order*

## 2026-02-14: Build Tooling Cleanup
*   **Migration**: WASM output directory moved from `src/pkg` to `src/vyasac-wasm` for clarity.
*   **Convention**: Build scripts renamed for consistency: `build-samples` → `build:samples`, alongside existing `build:wasm`.
*   **Cleanup**: Removed redundant nested `vyasa-docs` directory from the `vyasa` workspace.

## 2026-02-12: Configuration Cleanup
*   **Removal**: Removed `[collection]` configuration from `vyasac.toml`.
    *   **Constraint**: Collection behavior is now defined entirely within the template files (`reference.vy`) using attributes.
*   **Semantics**: `work.chapters` is deprecated in favor of `work.items` (though aliases may exist during transition).

## 2026-02-08: Standardized Template Directory
*   **Convention**: `templates/<target>/` is now the standard location for templates.
*   **Shell**: `default.html` (formerly `native.html`) is the standard entry point.
*   **Configuration**: Removed explicit `[templates]` section from `vyasac.toml` in favor of convention.

## 2026-02-07: Dynamic Template Configuration
*   **Feature**: Added `template_dir` configuration key in `vyasac.toml`.
*   **Behavior**: PlayArea parsing logic scan this directory (defaulting to `templates/`) to populate the template dropdown.
*   **Goal**: Allow flexible workspace structures where templates might reside in `theme/` or other custom paths.

## 2026-02-05: Graph Persistence (The "Sink")
*   **Goal**: Close the loop by persisting compiler output back to the database.
*   **Implementation**:
    *   **Compiler**: Returns a map of `CompiledDocument` ASTs.
    *   **SQLite Service**: Recursively inserts AST nodes into the `nodes` table.
    *   **Schema**: `files` (source) and `nodes` (graph) are now synchronized.
*   **Benefit**: Enables graph querying (e.g., "Find all `v` commands spoken by `Krishna`").

## 2026-02-03: The "Git-in-a-DB" Architecture
*   **Major Shift**: Moved away from in-memory WASM FS (memfs) to a database-backed Virtual File System.
*   **Architecture**:
    *   **Browser (PlayArea)**: Manages `wa-sqlite` (OPFS) as the source of truth.
    *   **WASM (Compiler)**: Reads source files directly from the DB via `SqliteFileSystem`.
*   **Significance**:
    *   **Zero-Copy**: No need to "upload" files to WASM memory manually.
    *   **Persistence**: Changes survive page reloads naturally.
    *   **Incremental**: The DB state *is* the build state.

## 2026-01-30: SQLite Source Packaging
*   **Goal**: Provide an "App-Ready" distribution format for Vyasa content.
*   **Format**: Monolithic SQLite database (`.db`) containing normalized tables: `manifest`, `streams`, `nodes`, `registry`.
*   **Usage**: `vyasac pack --target sqlite`. Enables direct SQL querying of the semantic graph (e.g., "Select all verses in Chapter 1").

## 2026-01-29: Source Packaging (Samples)
*   **Goal**: Enable distribution of compiled workspaces to publishers without requiring them to rebuild from source.
*   **Format**: ZIP archive containing `vyasac.toml`, `context.vy`, and compiled `content`.
*   **Implementation**: Initial support added via `package-samples.js` for the documentation site. Future `vyasac pack` command will formalize this.

## 2026-01-26: Context-Driven Configuration
*   **Shift**: Moved configuration logic (Aliases, URN Schemes) out of `vyasac.toml` and into `context.vy`.
*   **Mechanism**: The `context.vy` file is now the single source of truth for "soft" configuration that might change per-folder. `vyasac.toml` is reserved for "hard" build config (source path, streams).
*   **Benefit**: Simplifies the mental model. Configuring the language is done *in* the language.

## 2026-01-25: Template Customization & Aliases
*   **Templates**: Added support for a `templates/` directory in the workspace root. The compiler now looks for `default.html` here to override built-in templates.
*   **AST Rendering**: Templates now receive the raw AST (`Node::Command`, `Node::Text`).
    *   **Change**: Moved away from pre-formatted HTML generation in the backend to giving templates full control over the AST.
    *   **Refinement**: `Text` nodes must be accessed via `.value`.
*   **Workflows**: Added support for packaging workspaces (`build-samples`) and syncing WASM binaries (`/sync-wasm`).

## 2025-12-31: The Workspace Model
*   **Shift**: Moved from "Project + Sidecars" to "Workspace + Streams".
*   **Reasoning**: "Sidecar" implies second-class citizenship. In reality, a translation or an audio alignment file is just another stream of information about the work.
*   **Concept**:
    *   **Workspace**: A collection of related streams defined by `vyasac.toml`.
    *   **Primary Stream**: The definitive text source (defining valid reference IDs).
    *   **Secondary Streams**: Other folders (formerly sidecars) that reference the primary stream.
*   **Linking**: Linking is implicit based on relative paths. `primary/vol1/gen.vy` links to `secondary/vol1/gen.vy`.
*   **Config**:
    ```toml
    [streams]
    primary = "hebrew"
    secondary = ["spanish", "audio"]
    ```

## 2025-12-30: Sidecars as Vyasa Files
*   **Decision**: Rejected using custom TOML schemas for sidecars (e.g., `.audio.toml`).
*   **Insight**: **"One Grammar to Rule Them All"**.
    *   Translation sidecar? It's a Vyasa file with text.
    *   Audio alignment? It's a Vyasa file using `r` commands with time attributes.
*   **Result**: Sidecars are just `.vy` files. The compiler processes them into standard ASTs.

## 2025-12-29: Project Structure & Inheritance
*   **Decision**: Configuration should be hierarchical.
*   **Mechanism**:
    *   `vyasac.toml` at root defines global context (Work="Bible").
    *   `content/vyasa.toml` overrides/adds context.
    *   `content/vol1/vyasa.toml` adds `volume="1"`.
*   **Output**: The compiler merges these contexts down the tree so every file has a complete view of its metadata.

## Initial Concept
*   Single folder of Text files.
*   Sidecars as ad-hoc ancillary files.

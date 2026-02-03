---
description: Update documentation and sync WASM if needed
---

# Sync Documentation

This workflow guides the process of updating documentation to match the latest compiler and language state.

## 1. Sync WASM Binary
**Condition**: logic check - Has the `vyasac` Rust source code (`vyasa/vyasac/src`) changed since the last docs build?
-   **YES**: Invoke the `/sync-wasm` workflow to rebuild and copy the WASM binary.
-   **NO**: Skip to Step 2.

## 2. Update Change Log
-   File: `src/content/docs/notes/vyasa-language.md`
-   **Action**: Add a new entry to the top of the history list (Reverse Chronological Order).
    -   Date: `YYYY-MM-DD`
    -   Title: Brief summary of the change.
    -   Details: Problem, Solution, Impact.
-   File: `src/content/docs/notes/vyasa-workspace.md`
-   **Action**: Add a new entry to the top of the history list (Reverse Chronological Order) if workspace structure/configuration changed.

## 3. Update Reference Documentation
-   **Commands** (`src/content/docs/reference/commands.md`): If new commands/aliases were added to `stdlib.vy` or `builtins`.
-   **Grammar** (`src/content/docs/reference/grammar.md`): If syntax parsing changed.

## 4. Update Guides
-   **User Guide** (`src/content/docs/guides/user-guide.md`): New features, examples, or quick reference table.
-   **Template Guide** (`src/content/docs/guides/template-guide.md`): New Tera filters, macros, or template patterns.
-   **Developer Guide** (`src/content/docs/guides/developer-guide.md`): Internal architecture or specs changes.
-   **Workspace Guide** (`src/content/docs/notes/vyasa-workspace.md`): Project structure, configuration (`vyasac.toml`, `context.vy`), or packaging changes.

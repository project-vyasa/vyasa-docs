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
-   **Commands**: If new commands/aliases were added to `stdlib.vy` or `builtins`, update `src/content/docs/reference/commands.md`.
-   **Grammar**: If syntax parsing changed, update `src/content/docs/reference/grammar.md`.

## 4. Update Guides
-   **User Guide**: Update `src/content/docs/guides/user-guide.md` with new features or examples.
-   **Developer Guide**: Update `src/content/docs/guides/developer-guide.md` if internal architecture or specs changed.
-   **Workspace Guide**: Update `src/content/docs/notes/vyasa-workspace.md` if project structure, configuration (`vyasac.toml`, `context.vy`), or packaging formats change.

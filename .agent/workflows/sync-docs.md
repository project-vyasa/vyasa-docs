---
description: Update documentation to match the latest compiler and language state
---

# Sync Documentation

This workflow guides the process of updating documentation to match the latest compiler and language state.

## 1. Update Change Log
-   File: `src/content/docs/notes/vyasa-language.md`
-   **Action**: Add a new entry to the top of the history list (Reverse Chronological Order).
    -   Date: `YYYY-MM-DD`
    -   Title: Brief summary of the change.
    -   Details: Problem, Solution, Impact.
-   File: `src/content/docs/notes/vyasa-workspace.md`
-   **Action**: Add a new entry to the top of the history list (Reverse Chronological Order) if workspace structure/configuration changed.

## 2. Update Reference Documentation
-   **Commands** (`src/content/docs/reference/commands.md`): If new commands/aliases were added to `stdlib.vy`.
-   **Grammar** (`src/content/docs/reference/grammar.md`): If syntax parsing changed.

## 3. Update Guides
-   **User Guide** (`src/content/docs/guides/user-guide.md`): New features, examples, or quick reference table.
-   **Template Guide** (`src/content/docs/guides/template-guide.md`): New template patterns, view conventions, or projection logic.
-   **Developer Guide** (`src/content/docs/guides/developer-guide.md`): Internal architecture or specs changes.
-   **Workspace Guide** (`src/content/docs/notes/vyasa-workspace.md`): Project structure, configuration (`vyasac.toml`, `context.vy`), or packaging changes. Target audience: linguists, publishers, and other non-developer personas.

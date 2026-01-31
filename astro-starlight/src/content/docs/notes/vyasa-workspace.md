---
title: Workspace Design History
description: History of design decisions for the Vyasa workspace model.
---

# Vyasa Workspace Design History

*In reverse chronological order*

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

---
title: Language Design History
description: History of design decisions for the Vyasa language.
---

# Vyasa Language Design History

<!-- IMMUTABLE LOG: Do not edit past entries. Add new entries at the top. -->
*In reverse chronological order*

## 2026-02-07: Default Template & Optimization
*   **Experience**: Added "Built-in HTML" option in PlayArea using a baked-in, clean `src/backend/html/default_template.html` (Noto Serif typography, no custom classes).
*   **Refinement**: Renamed "AST" to "AST (JSON)" for clarity.
*   **Optimization**: Removed `handlebars` dependency and optimized WASM build (LTO enabled, ~500KB binary).

## 2026-02-07: Title Command & Structure Refinement
*   **Feature**: Introduced `title` as a first-class structural command.
    *   **Semantics**: Distinct from `heading` level 1. Represents the formal title of a document or work.
    *   **Output**: Renders as `<h1 class="title">` in HTML.
*   **Discussion**: Evaluated `h1`-`h6` vs `section` debate.
    *   Retained `h1` aliases for pragmatism (HTML similarity).
    *   `title` serves as the semantic root for the document's identity.

## 2026-02-06: Native Templates & Projection
*   **Major Feature**: Implemented **Native Templates** (RFC-011).
    *   **Concept**: Vyasa can now define its own output format using `template` blocks.
    *   **Syntax**: `` `template `cmd_name `for "html" { ... } ``.
    *   **Engine**: `Projector` module replaces Handlebars/Tera.
*   **Benefit**: Removes external dependencies, reduces WASM size, and keeps the entire build definition within the Vyasa language.
*   **Binding**: Templates bind to AST nodes. `$.text`, `$.argument`, `$.attributes` are available in scope.

## 2026-02-04: Graph Sink
*   **Arch**: Compiler now outputs `nodes` map (AST) alongside files.
*   **Persistence**: `sqlite-service.ts` bridges this AST into the `nodes` table in the browser DB.
*   **Result**: "Git-in-a-DB" is fully operational for both source code and compiled graph.

## 2026-02-03: SQLite VFS
*   **Arch**: Implemented `SqliteFileSystem` (VFS) in Rust.
*   **Flow**: Browser (JS) -> SQLite (OPFS) -> Rust VFS -> Compiler.
*   **Benefit**: Zero-copy (conceptually) access to source files from the compiler running in WASM.

## 2026-02-02: Tera Template Simplification
*   **Feature**: Custom Tera filters (`is_cmd`, `is_text`) for cleaner template conditionals.
*   **Feature**: Context shortcuts (`env`, `entities`, `ctx`, `settings`) injected into template context.
*   **Feature**: `_macros.html` stdlib template with `render_children`, `text_content` macros.
*   **Refactor**: BG template uses dynamic `entities[speaker]` lookup — removed hardcoded if/elif chains.
*   **Impact**: `backend/html/tera.rs` updated; samples use entity labels from `context.vy`.

## 2026-02-02: Ignore-Whitespace Mode
*   **Feature**: Added `settings` map to `VyasaEnvironment` for workspace-wide configuration (separate from flow `context`).
*   **Default**: Whitespace-only text nodes are now **stripped** and text values are **trimmed**.
    *   Produces cleaner AST/JSON for structured content.
    *   **Opt-out**: `` `set settings { whitespace = "preserve" } `` retains whitespace (for prose).
*   **Impact**: `pipeline.rs` now includes `strip_whitespace()` pass; `intimate-note` sample updated with preserve setting.

## 2026-02-02: Shared Workspace Processor
*   **Refactor**: Created `workspace_processor.rs` module to centralize context loading.
    *   `load_context_chain()`: Walks the directory tree loading `context.vy` at each level.
    *   `WorkspaceFileIterator`: Efficient iterator with context caching.
*   **Fix**: `packer.rs` now properly resolves subdirectory context (e.g., `content/18/context.vy` → `{chapter}="18"`).
*   **Cleanup**: Removed dead alias resolution code from `enricher.rs` (already done by `alias_resolver.rs`).
*   **Impact**: Ensures behavioral parity between `build` and `pack` commands.

## 2026-02-01: Segment Addressing & Flow State
*   **Feature**: Implemented **Segment Addressing** (RFC 005), allowing URNs with path components (e.g. `/d`, `/s:1`) to target specific sub-structures.
*   **Feature**: Implemented **Flow State** (Context Persistence).
    *   **Natural Sorting**: The compiler now respects numeric order in filenames (`1.vy` -> `2.vy`).
    *   **State Threading**: Speaker context (`entity`) defined in one file persists to the next, enabling proper sequencing for multi-file works.
*   **Impact**:
    *   `vyasac/src/resolver.rs`: New module for URN resolution.
    *   `vyasac/src/packer.rs`: Updated to sort files and thread state.

## 2026-02-01: Template Logic Simplification
*   **Refactor**: Changed `Node` serialization from Externally Tagged (`{ "Command": { ... } }`) to Internally Tagged (`{ "type": "Command", ... }`).
    *   **Rationale**: Greatly simplifies Tera templates by removing the need for verbose checks like `{% if node.Command %}` and accessing `node.Command.cmd`.
    *   **New Syntax**: `{% if node.type == "Command" %}` then access `node.cmd` directly.
*   **Fix**: Corrected canonical URN generation logic in the compiler CLI to match the enrichment logic.
    *   **Impact**: Verses now correctly generate `urn:verse:...` instead of falling back to default work URNs.

## 2026-02-01: Entity-Action Pattern
*   **Design Decision**: Adopted **Entity-Action Pattern** (`` `Subject `Verb [...] ``) for defining graph relationships (e.g., Speaker-Speech) to avoid dense key-value syntax.

## 2026-01-31: Verse Elevation & Experience
*   **Semantic Refinement**: The `verse` command (`v`) is now a first-class citizen with an optional `id` argument.
    *   **Syntax**: `` `v 1 [ ... ] `` combines definition and content.
    *   **Benefit**: Simplifies the authoring experience for standard scriptures, removing the need for separate `marker` commands for simple structures.
*   **Editor Experience**:
    *   Implemented **Word Wrap** (toggleable) in `PlayArea`.
    *   Implemented **Syntax Highlighting** for `.vy` files, mapping commands to HTML-like tags for intuitive coloring.
*   **Cleanup**: Removed unused legacy aliases (`col-break`, `pg-break`) to streamline the core language.
*   **Refinement**: Reclaimed `verse` (`v`) as a built-in structural container.
*   **Alias Change**: Re-aliased `marker` to `m` (was `v`) to avoid conflict and optimize for "Writer" experience.
*   **Impact**:
    *   `stdlib.vy`: Added `verse` command. Added `m` -> `marker` alias.
    *   `commands.md`: Updated documentation.
    *   **Samples**: Updated Bible and Gita samples to use new `m` / `v` schema.

## 2026-01-30: Marker Resolution & URN Fallback
*   **Refinement**: Improved the `pack` command's analysis pipeline.
    *   **Marker Counting**: Ensure aliases (like `v` -> `marker`) are fully resolved before generating manifest statistics.
    *   **URN Fallback**: If `urn_scheme` is missing in `manifest.json`, the packer now correctly resolves it from `context.vy` within the environment.

## 2026-01-29: Semantic Refactoring (Marker vs Citation)
*   **Problem**: The `reference` command (aliased `r`) was ambiguous. It was used both to *define* a structure (Verse 1) and to *point* to one (John 3:16).
*   **Solution**: Split the semantics.
    *   **`marker`** (alias `v`): Defines a structural anchor and sets the ID.
    *   **`ref`** (alias `r`, `cite`): Points to a target URN (Citation).
*   **Impact**:
    *   Renamed `reference` -> `marker` in Standard Library.
    *   Updated `bible` and `bhagavad-gita` samples to use `v` command.

## 2026-01-28: Whitespace Preservation
*   **Problem**: Previous versions aggressively stripped whitespace between nodes, making it impossible to render poetry or lists where line breaks mattered.
*   **Fix**: Modified parser to preserve text whitespace as `Text` nodes.
*   **Impact**:
    *   **Prose**: Unaffected (HTML collapses whitespace naturally).
    *   **Poetry**: Can now be rendered correctly using CSS `white-space: pre-wrap` on container blocks (e.g., `preformatted`).

## 2026-01-27: Standard Library Refinement
*   **Decision**: Cleaned up `builtins.vy` to include only Meta and Formatting commands. Domain-specific commands (like `verse`) moved to context configuration.
*   **Standardization**: Renamed `def-alias` to `alias-def` to align with `command-def`.
*   **Headings**: Added hierarchical `heading` command and `h1-h3` aliases.

## 2026-01-26: Explicit Formatting & Context URNs
*   **Decision**: Adopted **Explicit Formatting Commands** (`br`, `e1`, `e2`) over implicit markdown-like syntax or raw HTML.
    *   **Rationale**: Ensures portability and consistent rendering across environments (WASM/Editor). implicit double-newlines for breaks proved fragile.
*   **URNs**: Moved URN scheme definition from static `vyasac.toml` to dynamic `context.vy`.
    *   **Reason**: Allows different parts of a workspace (e.g., Intro vs Main Text) to use different URN structures.

## 2026-01-25: Stream vs. Container Architecture
*   **Concept**: Formalized two valid ways to structure content.
    *   **Stream-based**: Using `reference` (aliased as `r`) to mark points in a continuous flow. Best for narratives (e.g., Bible).
    *   **Container-based**: Using `verse` blocks to contain content. Best for structured data (e.g., Gita).
*   **Addition**: Added `verse` command as a standard container that inherits the active URN.

## 2025-12-31: URN Attributes & Enrichment
*   **Decision**: Reference identifiers (`r 1.1`) are insufficient for global linking.
*   **Change**: Added an "Enrichment" pass that computes a `urn` attribute for every reference node based on a configured scheme (e.g., `urn:vyasa:{work}:{id}`).
*   **Syntax impact**: None (purely semantic/compiler behavior).

## 2025-12-30: Text Stream Patterns
*   **Problem**: Explicitly tagging every line in a large block (like a specific translation or transliteration stream) is verbose.
*   **Solution**: Introduced `stream-def` and Implicit Tagging.
*   **Syntax**:
    ```text
    `stream-def { id="gita"; pattern="d, i, e" }
    
    `gita
    `[
    Text for 'd'
    Text for 'i'
    Text for 'e'
    `]
    ```
*   **Mechanism**: The parser treats the block content as a sequence of text lines, and a Transformer pass applies the pattern commands (`d`, `i`, `e`) cyclically to the lines.

## 2025-12-30: Unified Command Model (Refactor)
*   **Problem**: The grammar had special cases for "Blocks" vs "Commands" vs "References".
*   **Solution**: **Everything is a Command**.
    *   Block: A command with a delimiter and children.
    *   Reference: A command (`r`) with an argument.
    *   Metadata: A command (`set`) with attributes.
*   **Syntax**:
    *   Inline: `` `cmd arg {attrs} ``
    *   Block: `` `cmd arg ;DELIM {attrs} [ ... ]DELIM ``
*   **Impact**: drastically simplified the AST (`Node::Command` covers 90% of nodes) and Parser logic.
*   **Removed**: Explicit `Node::Reference` and `Node::Block` enums.

## 2025-12-29: Attributes Support
*   **Decision**: Commands need key-value metadata (e.g. time codes, ids).
*   **Syntax**: `{ key="value"; key2=val2 }` immediately following the command/arg.
*   **Example**: `` `r 1.1 {t="16.32"} ``.

## Initial Proposal
*   Markdown-like text.
*   Backtick `` ` `` for commands.
*   `|` for segment breaks.
*   Explicit `[` `]` for blocks.

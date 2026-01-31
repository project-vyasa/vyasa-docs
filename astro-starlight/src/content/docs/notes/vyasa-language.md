---
title: Language Design History
description: History of design decisions for the Vyasa language.
---

# Vyasa Language Design History

<!-- IMMUTABLE LOG: Do not edit past entries. Add new entries at the top. -->
*In reverse chronological order*

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

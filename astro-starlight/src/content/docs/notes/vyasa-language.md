---
title: Language Design History
description: History of design decisions for the Vyasa language.
---

# Vyasa Language Design History

*In reverse chronological order*

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

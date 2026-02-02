---
title: "RFC-002: Text Formatting Strategy"
status: "Implemented"
created: "2026-01-26"
---

# RFC 002: Text Formatting Strategy

**Status**: Implemented
**Date**: 2026-01-26
**Topics**: Syntax, Formatting, Standard Library

## Objective
Define a strategy for handling character-level and block-level text formatting (e.g., bold, italics, lists, paragraphs) within the Vyasa language.

## Context
Vyasa currently focuses on semantic structure (`chapter`, `verse`, `translation`, `purport`). However, users often need to structure text *within* these blocks (e.g., emphasizing a word in a purport, or creating a list of points).

## Alternatives

### Option A: Embedded Markdown
Allow users to write Markdown syntax directly within Vyasa text blocks.

**Prerequisites**:
- Templates must route text content through a Markdown parser (e.g., `markdown-it` logic in `vyasac` or in the template engine).

**Pros**:
- Familiar syntax for users (`**bold**`, `*italics*`, etc.).
- Robust tooling ecosystem.
- Clean and concise.

**Cons**:
- Increases compiler complexity (managing two grammars).
- Potential syntax conflicts (e.g., brackets `[]` used by both).
- "Black box" chunks of text that Vyasa logic cannot easily inspect or transform.

### Option B: Native Vyasa Commands (Proposed)
Introduce a "Standard Formatting Library" of commands that act as semantic markers for formatting.

**Syntax (Refined Proposal)**:

We propose using **Explicit Semantic Commands** with optional shorthands (aliases) for brevity. This avoids cryptic names while allowing efficiency for power users.

- **Emphasis**:
  - `emphasis { level=1 } [text]` (Primary, bold)
  - `emphasis { level=2 } [text]` (Secondary, italics)
  - *Aliases*: `e1` -> `emphasis { level=1 }`, `e2` -> `emphasis { level=2 }`

- **Breaks**:
  - `break { type="line" }` (Manual line break)
  - `break { type="column" }` (Column break)
  - `break { type="page" }` (Page break)
  - *Aliases*: `br`, `col-break`, `pg-break`
  - *Note*: These are **presentational** breaks. They do not interrupt the semantic flow of content (e.g., a `reference` stream). A `chapter` command creates a *structural* boundary; a `break { type="page" }` merely suggests where a page *might* end in print.
  - **Best Practice**: Use explicit `` `br `` commands for line breaks within text blocks (like purports) instead of relying on double newlines. This ensures consistent rendering across different templates and output formats.

- **Lists**:
  ```vyasa
  `list[
      `item[Point 1]
      `item[Point 2]
  ]
  ```
    *   **Note**: We recommend requiring explicit `` `item `` (or aliased as `-`) commands. This avoids ambiguity for multi-line items.

**Analysis of Command Mingling**:
- **Drawback**: Visual noise. Mixing `chapter` (structural) with `e1` (inline) in the same backtick syntax might be visually dense.
- **Mitigation**: 
  - Structural commands (`chapter`, `verse`, `reference`) are typically block-level.
  - Formatting commands (`e1`, `br`) are inline.
  - Good syntax highlighting in editors will help distinguish them.
- **Benefit**: Uniform parsing logic. The compiler doesn't need to know "this is formatting" vs "this is structure"; it just builds the AST. The *template* decides how to render it.

## Recommendation
Pursue **Option B (Native Commands)**.

**Rationale**:
1.  **Semantic Integrity**: Vyasa's core value is semantic enrichment. Mixing in "dumb" formatting syntax (Markdown) dilutes the purity of the AST.
2.  **Extensibility**: Native commands can carry attributes. `list { type="ordered" } [ ... ]` is natural in Vyasa.
3.  **Control**: We define exactly how these render in the templates, rather than relying on a generic Markdown-to-HTML implementation.

## Implementation Steps
1.  Define the standard formatting library (names and arguments).
2.  Update `vyasac` to handle these (if special parsing is needed beyond standard command parsing).
3.  Update the default templates to render these commands (e.g., map `node.Command.cmd == "e1"` to `<strong>` or `<b>`).

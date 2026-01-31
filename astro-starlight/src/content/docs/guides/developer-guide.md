---
title: Developer Guide
description: Technical specification and guide for Vyasa parser/compiler developers.
sidebar:
  order: 2
---

# Vyasa Developer Guide

This guide describes the formal specification of the Vyasa Markup Language and is intended for anyone building a parser or compiler for Vyasa.

For details on the reference implementation in Rust, see [Appendix A](#appendix-a-reference-implementation).

:::note
Vyasa is still in alpha and subject to change. Help shape the future of Vyasa!
:::

## 1. Syntax Specification

Vyasa uses a **Unified Command Model**. Every functional element (header, alignment identifier, metadata block) is a `Command`.

### 1.1 Grammar

The formal grammar is defined in the [Grammar Reference](/reference/grammar).
This specification serves as the authoritative source for all parser implementations.

### 1.2 Core Concepts

1.  **Commands**: Started by a backtick `` ` ``.
    *   Example: `` `marker 1.1 `` (Marker command).
    *   Example: `` `set file{id="Gen"} `` (Metadata command).
2.  **Attributes**: Key-value pairs enclosed in `{}`.
    *   Used for metadata (time, id, speakers).
3.  **Blocks**: Commands that contain other content.
    *   Distinguished by a **Delimiter** syntax: `;DELIM [ ... ]DELIM`.
    *   This ensures "Safe Block Parsing" where the parser scans until the matching delimiter, ignoring internal syntax conflicts.
4.  **Interlinear Streams**:
    *   Blocks can be defined as "Interlinear Streams" where lines are implicitly tagged with commands based on a pattern.

## 2. URN Scheme & Context

A Vyasa compiler is expected to generate Uniform Resource Names (URNs) for addressable nodes.

1.  **Context**: The compiler must maintain a hierarchical context stack (e.g. `Work -> Volume -> Book`).
2.  **Scheme**: A template provided in configuration (e.g. `urn:vyasa:{work}:{id}`).
3.  **Enrichment**: Upon encountering a Reference Node (e.g. `r 1.1`), the compiler must:
    *   Substitute context variables into the scheme.
    *   Inject the resulting URN into the node's attributes.

---

## Appendix A: Reference Implementation

The reference implementation is built in **Rust** and acts as both a CLI tool and a WASM library.

### Language Specification

The Vyasa language syntax is formally defined in the [Grammar Reference](/reference/grammar).
The compiler is written in Rust and exposes a WASM interface for web usage.

### Architecture

The implementation uses a shared compilation pipeline:

1.  **Parser** (`src/parser.rs`): Uses `nom` to parse `.vy` source text into a `VyasaDocument` AST.
    *   Tracks source locations using `nom_locate` for error reporting.
    *   Produces `Node` variants: `Command`, `Text`, `SegmentBreak`, `Comment`.

2.  **Transformer** (`src/transformer.rs`): Performs initial AST mutations.
    *   Handles **Interlinear Streams** (`interlinear-streams`): Expands raw text lines into command nodes based on defined patterns.
    *   Preserves source locations during transformation.

3.  **Alias Resolver** (`src/alias_resolver.rs`):
    *   Resolves user-defined aliases (e.g., `h1` -> `heading`).
    *   Respects `alias-def` commands in the environment.

4.  **Validator** (`src/validator.rs`):
    *   Performs semantic validation.
    *   Checks that all used commands are defined in the **Standard Library** (`stdlib.vy`) or via `command-def`.
    *   Validates arguments against allowed lists.

6.  **Enricher** (`src/enricher.rs`):
    *   Populates entity registries (`set entities`).
    *   **State & Entities**: Propagates state from `state` commands and aliases (Registry).
    *   Future: Will resolve cross-references and URNs.

6.  **Backend compilation** (`src/backend/`):
    *   **Tera** / **Handlebars**: Renders the AST to HTML using templates.
    *   **SQLite**: Serializes the AST structure into a relational database for querying.

### Codebase Layout

*   **`src/lib.rs`**: Library entry point.
*   **`src/pipeline.rs`**: Core `process_string` logic used by all targets.
*   **`src/wasm.rs`**: WebAssembly bindings (`compile` function).
*   **`src/models.rs`**: AST definitions.

### Build Instructions

**CLI**:
```bash
cargo build --release
```

**WASM**:
```bash
wasm-pack build --target web
```

### Database Schema (SQLite)

When compiling with `--target sqlite`, the reference implementation uses:
*   `nodes` (id, urn, content, type)
*   `attributes` (node_id, key, value)
*   `registry` (name) - Exported from `context.vy`
*   `registry_attributes` (entity_name, key, value)

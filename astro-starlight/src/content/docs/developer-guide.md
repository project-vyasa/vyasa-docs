---
title: Developer Guide
description: Technical specification and guide for Vyasa parser/compiler developers.
---

# Vyasa Developer Guide

This guide describes the formal specification of the Vyasa Markup Language and is intended for anyone building a parser or compiler for Vyasa.

For details on the reference implementation in Rust, see [Appendix A](#appendix-a-reference-implementation).

:::note
Vyasa is still in alpha and subject to change. Help shape the future of Vyasa!
:::

## 1. Syntax Specification

Vyasa uses a **Unified Command Model**. Every functional element (header, alignment identifier, metadata block) is a `Command`.

### 1.1 Grammar (EBNF)

```
document        ::= ( node )*
node            ::= command | text | comment | segment_break

/* --- Unified Command Structure --- */
command         ::= inline_command | block_command

/* `cmd arg {key=val} */
inline_command  ::= "`" identifier [ whitespace argument ] [ attributes ]

/* `cmd arg ;DELIM {key=val} [ ... ]DELIM */
block_command   ::= "`" identifier [ whitespace argument ] marker attributes? whitespace "[" content "]" marker_end

marker          ::= ";" identifier
marker_end      ::= identifier

/* --- Components --- */
identifier      ::= [a-zA-Z0-9_-]+
argument        ::= [a-zA-Z0-9_.:-/]+  /* Restricted charset */

attributes      ::= "{" map_pairs "}"
map_pairs       ::= map_pair ( separator map_pair )*
map_pair        ::= key "=" value
separator       ::= whitespace
key             ::= identifier
value           ::= string | argument | boolean
string          ::= '"' [^"]* '"'

/* --- Content --- */
content         ::= ( node )*
segment_break   ::= "|"
comment         ::= "`" whitespace+ /* Empty command is a comment */
```

### 1.2 Core Concepts

1.  **Commands**: Started by a backtick `` ` ``.
    *   Example: `` `r 1.1 `` (Reference command).
    *   Example: `` `set file{id="Gen"} `` (Metadata command).
2.  **Attributes**: Key-value pairs enclosed in `{}`.
    *   Used for metadata (time, id, speakers).
3.  **Blocks**: Commands that contain other content.
    *   Distinguished by a **Delimiter** syntax: `;DELIM [ ... ]DELIM`.
    *   This ensures "Safe Block Parsing" where the parser scans until the matching delimiter, ignoring internal syntax conflicts.
4.  **Implicit Text Streams**:
    *   Blocks can be defined as "Streams" where lines are implicitly tagged with commands based on a pattern.

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

### Architecture

The implementation uses a shared compilation pipeline:

1.  **Parsing** (`src/parser.rs`): Zero-copy parsing using `nom`.
2.  **Environment Injection**: Inherits context from `vyasa.toml`.
3.  **Alias Source Injection** (`src/alias_resolver.rs`): Handles macro expansion by injecting `_alias` attributes.
4.  **Enrichment** (`src/enricher.rs`):
    *   **URNs**: Generates URNs based on the scheme.
    *   **State & Entities**: Propagates state from `entity` commands and aliases (Registry).
5.  **Output** (`src/backend/`): Serializes to JSON or SQLite.

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

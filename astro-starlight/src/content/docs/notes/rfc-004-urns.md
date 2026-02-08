---
title: RFC-004 Context-Driven URNs
description: Design for generating fully qualified URNs using context variables
---

# RFC 004: Context-Driven URNs

**Status**: Implemented
**Date**: 2026-01-28
**Topics**: URN, Configuration, Context Variables

## Summary

This RFC proposes moving the URN generation scheme from the static `vyasac.toml` configuration to the dynamic `context.vy` files. This allows for greater flexibility, enabling different sub-sections of a workspace to use different URN structures or namespaces.

## Motivation

Previously, URNs were defined globally in `vyasac.toml` using a single `urn_scheme` key (e.g., `urn:vyasa:vedabase:bg:{chapter}:{verse}`). This had several limitations:
1.  **Rigidity**: It enforced a single scheme for the entire workspace.
2.  **Context Unawareness**: It relied on implicit variable availability (like `chapter` and `verse`) without a clear mechanism for how those variables were scoped.
3.  **Separation of Concerns**: URN structure is semantic data, closely tied to the content's domain, whereas `vyasac.toml` is primarily for build configuration (streams, templates).

## Design

### 1. `context.vy` Configuration

The URN scheme is now defined as a standard context variable within `context.vy`.

```text
`set context { urn_scheme = "urn:vyasa:vedabase:bg:{chapter}:{id}" }
```

-   **`urn_scheme`**: A special context key used by the enricher.
-   **Variables**: Placeholders like `{chapter}` and `{id}` are substituted during the enrichment phase.
    -   `{id}`: The ID argument of the `reference` command (e.g., in `` `reference 78 ``, ID is "78").
    -   `{chapter}`: A context variable defined in a parent or local `context.vy` (e.g., `` `set context { chapter="18" } ``).

### 2. Resolution Logic

The compiler's `builder.rs` has been updated to prioritize the `urn_scheme` found in the document's environment (loaded from `context.vy`).

```rust
// In builder.rs
let env_scheme = document.environment.context.get("urn_scheme").cloned();
// If present in context, use it. Otherwise, fall back to vyasac.toml (deprecated) or None.
```

### 3. Implementation Details

-   **Enricher**: The `enrich_with_scheme` function performs the substitution. It iterates over all available context keys and replaces matching placeholders in the scheme string. Finally, it replaces `{id}` with the reference command's argument.
-   **Propagation**: The generated URN is stored in the `urn` attribute of the node and propagated to child nodes (like `synonyms`) via the state mechanism, ensuring all related content shares the canonical URN.

## Example

**`bhagavad-gita/context.vy` (Root)**
```text
`set context { urn_scheme = "urn:vyasa:vedabase:bg:{chapter}:{id}" }
```

**`bhagavad-gita/content/18/context.vy`**
```text
`set context { chapter = "18" }
```

**`bhagavad-gita/content/18/78.vy`**
```text
`r 78
```

**Resulting URN**: `urn:vyasa:vedabase:bg:18:78`

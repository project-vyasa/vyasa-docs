---
title: Internals Q&A
description: Answers to tricky questions about Vyasac internals.
---

# Internals Q&A

### 1. What is the difference between `category="flow"` and `propagate_state`?

These control completely different aspects of a command:

*   **`category="flow"`**: Controls **Context & Hierarchy**.
    *   Tells the Enricher "This command starts a new section."
    *   Triggers **Structural Logic**: extracting ID/Title, updating global context (e.g. `chapter.id=1`), and resetting subordinate state based on `urn.hierarchy`.
*   **`propagate_state`**: Controls **Attribute Injection**.
    *   Tells the Enricher "Should the current state (speaker, urn, etc.) be injected into this node?"
    *   **True (Default)**: Attributes are injected.
    *   **False**: Node is skipped. Critical for meta-commands (`marker`, `entity`) to avoid pollution.

### 2. How are templates scoped to HTML?

Templates are scoped via the `namespace` attribute.

*   **Explicit Definition**: `template { target="heading" namespace="html" }`
*   **Usage**: The `Projector` requests a specific namespace (currently hardcoded to "html") from the environment.
*   **Future**: Different backends (LaTeX, PDF) will request their respective namespaces.

### 3. Why separate `builtins.vy` and `stdlib.vy`?

To distinguish between **Language Primitives** and the **Standard Document Model**.

*   **`builtins.vy`**: Immutable primitives required by the compiler (`command-def`, `set`, `template`). These map directly to Rust code.
*   **`stdlib.vy`**: The standard convention for documents (`chapter`, `heading`). These are largely data-driven and could be replaced by a different model (e.g. legal or technical) without changing the compiler.

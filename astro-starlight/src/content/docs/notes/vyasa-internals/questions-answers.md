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

### 4. What is Interpolation and where is it used?

**Interpolation** is the process of substituting placeholders with dynamic values during compilation. It is the mechanism that makes Vyasa "data-driven".

In `vyasac`, interpolation happens in two distinct phases with slightly different syntax:

1.  **URN Generation (Enricher)**
    *   **Context**: Constructing unique identifiers for nodes based on the document hierarchy.
    *   **Syntax**: `{variable_name}`
    *   **Example**: A scheme of `urn:vyasa:{work}:{id}` becomes `urn:vyasa:bg:1` when `work="bg"` and `id="1"`.
    *   **Source**: Configuration (`vyasac.toml`).

2.  **Template Expansion (Projector)**
    *   **Context**: Transforming semantic commands into output (HTML, etc.).
    *   **Syntax**: `$.variable_name`
    *   **Example**: A template `div [ $.id ]` becomes `div [ 1 ]`.
    *   **Source**: `template` definitions.
    *   **Scope**: Variables are resolved from the *command's attributes* first, then the *global context*. Note that key length matters: `$.variable_long` is matched before `$.variable` to prevent partial replacement errors.

### 5. What are `Segments` and how do they help with Versioning?

A **Segment** is a structural boundary within a stream of text, typically denoted by the `|` delimiter in Interlinear Streams.

**The Problem**: In a word-addressable system, inserting a word would shift the ID of every subsequent word in the chapter, breaking external references (commentaries, translations).

**The Solution**: Segments act as **Firebreaks**.
*   They isolate ID shifting to the local segment.
*   Addresses include the segment index: `Chapter.Verse.Segment.Word`.
*   If you change text in Segment A, the addresses in Segment B remain unchanged.

This makes the document robust to minor edits and corrections without invalidating the entire connection graph.

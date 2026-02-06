---
title: RFC 011 Vyasa Templating
description: Proposal for a native, content-centric templating language for Vyasa.
---

# RFC 011: Vyasa Native Templating

**Status**: Draft
**Date**: 2026-02-03
**Topics**: Templates, HTML Generation, DSL

## 1. Problem Statement

Currently, Vyasa relies on external templating engines (Handlebars, formerly Tera) to convert nodes into HTML.
*   **Disconnect**: The template logic (`{{#each children}}`) is syntactically disjoint from the content source (`[ ... ]`).
*   **Output-Oriented**: Handlebars focuses on constructing an output string (HTML) rather than declaring how content *projects* into a view.
*   **Complexity**: Requires exposing Rust structs to Serde to JSON to Handlebars Context.

The content should be central. We need a way to define the **Presentation** of a node using syntax that feels like Vyasa itself.

## 2. Proposal: Content Projection

Instead of "Generating HTML", we define "Projections".
A template is just a mapping of **Node Properties** -> **Visual Elements**.

### Syntax Layout

We can use the existing Vyasa Command syntax to define templates.

```vyasa
// Define a template for 'verse' nodes
`template `verse {
  // Implicit context: 'this' is the node
  
  `div .class="verse-container" [
     
     // Project the 'text' property
     `span .class="sanskrit-text" [ $.text ]
     
     // Project the 'translation' property if it exists
     `if ($.translation) [
        `p .class="translation" [ $.translation ]
     ]
     
     // Recurse children
     `slot
  ]
}
```

## 3. Key Concepts

### A. Vyasa-DOM Mapping
Since HTML is a tree, and Vyasa is a tree, the mapping is natural.
*   `div`, `span`, `p` become known commands in the Template DSL.
*   Attributes `{ class="..." }` map 1:1 to HTML attributes.
*   Blocks `[ ... ]` map to children.

### B. Selectors / Accessors
We need a way to access node data.
*   `$` or `this`: Represents the current node.
*   `$.attr`: Access attribute.
*   `$.children`: Access children list.

### C. Logic (Control Flow)
We keep it minimal to ensure "Content is Center".
*   `if (condition) [ ... ]`
*   `each (list) [ ... ]`

### D. Slots
The `slot` command indicates where the children of the node should be rendered (recursively applying their own templates).

## 4. Comparison

**Handlebars (Current)**:
```html
<div class="verse-container">
  <span class="sanskrit-text">{{text}}</span>
  {{#if translation}}
    <p class="translation">{{translation}}</p>
  {{/if}}
  {{#each children}} ... {{/each}}
</div>
```

**Vyasa Native**:
```vyasa
`div .verse-container [
  `span .sanskrit-text [ $.text ]
  `if ($.translation) `p .translation [ $.translation ]
  `slot
]
```

## 5. Benefits

1.  **Unified Syntax**: One parser for both content and display logic.
2.  **Type Safety (Future)**: The compiler knows the schema of `verse`, so it can validate that `$.text` exists.
3.  **Componentization**: Templates can be packaged *with* the content libraries (e.g., a "Gita Theme" package).
4.  **No JSON Overhead**: Direct transformation from AST to DOM/HTML tree without intermediate serialization.

## 6. Implementation Strategy

1.  **Parser**: Extend Vyasa parser to handle `template` blocks (or process them as generic nodes first).
2.  **Evaluator**: A new compiler pass that walks the Content Tree and "applies" the matching Template Tree to generate the output (HTML/React/Target).
3.  **Fallbacks**: Default template for unknown nodes (e.g., render as `div` with json dump).

## 7. Projection Namespaces

We formally define **Projection Namespace** as a bounded context where a specific set of commands maps to a specific Output Format.

### A. The Core Namespaces

Vyasa will ship with three standard Projection Namespaces:

1.  **`html` (Default)**
    *   **Target**: Browsers, Web Views.
    *   **Native Commands**: `div`, `span`, `p`, `img`, `a`, `h1`..`h6`, `ul`, `li`...
    *   **Attributes**: Maps 1:1 to HTML5 Global Attributes (`class`, `id`, `style`...).

2.  **`speech` (SSML)**
    *   **Target**: Text-to-Speech engines (AWS Polly, Google TTS).
    *   **Native Commands**: `say`, `pause`, `prosody`, `audio`, `phoneme`, `sub`.
    *   **Attributes**: Maps to SSML attributes (`strength`, `rate`, `pitch`).

3.  **`print` (Paged Media)**
    *   **Target**: PDF, Book Layout.
    *   **Native Commands**: `box`, `text`, `page-break`, `footnote`, `margin`, `column`.
    *   **Attributes**: Layout primitives (`width`, `height`, `border`).

### B. Resolution Mechanism

When the compiler builds for a target (e.g., `vyasac build --target speech`), it adheres to the following resolution logic:

1.  **Template Lookup**: For a node `verse`, search for `template verse for "speech"`.
2.  **Fallback**:
    *   If no "speech" template exists -> Check "generic" template (?).
    *   If no template -> Ignore node (or synthesize default speech text).
3.  **Command Validation**: Inside a "speech" template, usage of `div` is a **Compiler Error**. Only commands from the `speech` namespace (or generic logic like `if`, `each`) are allowed.

This strict isolation prevents "HTML pollution" in non-visual targets.

### C. Extension

Users can define custom namespaces in `vyasa.toml`:

```toml
[projections.ebook]
base = "html" // Inherits HTML commands but allows overrides
```

## 8. Open Questions

1.  **CSS**: Do we embed CSS in the template (Scoped Styles)?
2.  **Reactivity**: If we target WASM/PlayArea, can these templates be reactive? (Svelte-like?)
3.  **Fallback**: If no template exists for "print", does it fall back to "html"?
4.  **Whitespace Handling**: How do we handle insignificant whitespace vs meaningful whitespace in templates? (We've struggled with this in samples).


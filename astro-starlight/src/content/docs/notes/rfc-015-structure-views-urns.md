---
title: RFC 015 - Structure, Views, and URIs
description: Proposal for hierarchical document structure, output views (profiles), and structural URNs.
---

# RFC 015: Structure, Views, and URIs

## Summary
This RFC addresses four interrelated requirements for advancing the Vyasa document model:
1. **Views (Profiles)**: The ability to generate different output variations (e.g., "Reference/Chanting" vs. "Study") from the same source content.
2. **Whole-Work Processing**: Templates that operate on the entire collection (Book/Work) rather than just individual files.
3. **Scoped Metadata**: Hierarchical metadata (titles for verse, chapter, canto, work) rather than flat file-scoped variables.
4. **Structural URNs**: Constructing URIs based on the document hierarchy (`book.canto.chapter`) rather than ad-hoc context variables.

### 1. Views ("Reference/Chanting" Mode)

#### Body Projection Directive
A view template defines a `body` directive that acts as a **whitelist and sequencer** for document content.

-   **Whitelist**: Only commands listed in `body` appear in output. Everything else is implicitly excluded.
-   **Sequencer**: Commands appear in the order specified in `body`, regardless of source document order.
-   **Inheritance**: Child templates (e.g., `devanagari` inside `verse`) render normally using base templates from `context.vy`.

**reference.vy** (entire file — verses only):
```text
`body [ `verse ]
```

**study.vy** (reordered — translation before verse):
```text
`body [
    `translation
    `verse
    `synonyms
]
```

#### Sibling Convention
A `.vy` file paired with a `.html` file of the same name forms a view:
-   `reference.html` — the HTML shell (styles, `{{ body }}`)
-   `reference.vy` — the body projection (which commands, in what order)
-   `context.vy` — shared base templates (loaded for all views)

### 2. Structural Templates (Implicit Layouts)

The default view (`default.vy` or `context.vy`) defines how all content types are rendered.
Without a `body` directive, all commands render in document order.

```text
// context.vy — base templates for all views
`verse [
    `div { class="verse-box" } [
        `div { class="verse-ref" } [ Verse $.argument ]
        `div { class="verse" } [ $.text ]
    ]
]

`translation [
    `div { class="translation-box" } [ $.text ]
]
```

### 3. Whole-Work Processing ("Collections")

*   **Definition**: A **Collection** refers to the aggregated set of all compilation units (individual `.vy` files) that make up a single "Work" (Book). Currently, Vyasa compiles files in isolation. A "Collection Pass" is a post-compilation step that gathers all these compiled nodes into a single structure (The Work) for generating indices, TOCs, or single-page editions.

**Proposed Solution: The `Collection` Object**
The compiler performs a second pass where it exposes a `work` object to a master template (`index.vy` or `work.vy`).

### 4. Scoped Metadata & Flow Commands

#### Problem
User feedback highlights that using block-based commands for chapters (`chapter { ... } [ ... ]`) is tedious.

#### Revised Proposal: Flow-based State
We retain the "LaTeX-style" flow commands but improve their state management. Instead of loose variables, `chapter` updates a dedicated **Structural Registry**.
*   **Location**: Often placed in `context.vy` at the folder root.
*   **Mandatory Fields**: `id` and `title` are required. Missing them is a **Compiler Error**.
*   **Reset Logic**: When a new Flow Command (like `chapter` or `canto`) is encountered, subordinate counters (like `verse`) are automatically reset.

```text
# This sets the interaction state.
`chapter { title="Yoga of Despondency" id="1" }

# Notes:
# 1. Pushes new Chapter to Registry.
# 2. Resets Verse counter.
# 3. Validates mandatory 'id' and 'title'.
```

### 5. Structural URNs

#### Problem
Nested structures are tedious. Explicit URNs are error-prone.

#### Revised Proposal: Prescriptive URN Scheme
We define the URN semantics *once* in configuration.
We simplify the placeholders to key names, implying the `.id` property.

**vyasac.toml**:
```toml
[urn]
# Tokens like :work, :canto imply {work.id}, {canto.id}
scheme = "urn:vyasa:work:canto:chapter:verse"
```

**Content (`1.vy`)**:
```text
`chapter { id="1" } 
`verse { id="1" }   # -> urn:vyasa:bg:1:1:1
```

#### Ad-hoc Markers & Segments
For addressing content *within* a compilation unit (e.g., a specific line or anchor):

*   **Path vs. Fragment**: The Structural URN forms the **Path** (`urn:vyasa:bg:1:1:1`). Markers and Segments form the **Fragment** (`#...`).
*   **Collision Avoidance**:
    *   **Verse ID**: Part of the URN Path (`...:1`).
    *   **Marker ID**: Part of the URN Fragment (`...:1#foo`). They live in different namespaces and cannot clobber each other.
*   **Disambiguation**:
    *   **Segments**: Automatically indexed integers (`#1`, `#2`).
    *   **Markers**: Explicit string IDs (`#foo`). If a marker ID is numeric, it shadows the segment index.

### 6. Multi-Verse Logic

When a single compilation unit represents a range of verses (e.g., `13-14.vy`):
*   **URN Path**: The file generates multiple URNs for the verses (`...:13`, `...:14`).
*   **URN Fragments**: Any Markers or Segments within the content are semantically attached to the **last verse** in the range (`...:14#foo`).
    *   *Rationale*: Purports often reference the entire block, and the "anchor" is effectively the end of the sequence.

### 7. Command Context & Validity

To maintain strict separation of concerns, the compiler enforces **Contextual Validity** for commands.

1.  **Source Context** (`book.vy`):
    *   **Allowed**: Semantic Commands (`verse`, `h1`, `p`), Flow Commands (`chapter`), Ad-hoc Markers (`mark`, `|`).
    *   **Forbidden**: Presentation Commands (`div`, `span`, css classes). Using `div` in a source file is a **Compiler Error**.

2.  **View Context** (`template.vy`, `reference.vy`):
    *   **Allowed**: Presentation Commands (`div`, `span`), Logic (`if`, `each`), Content Accessors (`$.text`).
    *   **Purpose**: Defining how the semantic nodes are rendered.

### 7. Template Convention: Sibling Pairing

We establish a flat convention for HTML generation:

*   **The Shell**: `reference.html` (Contains `<html>`, `<head>`, scripts, and `{{ body }}`).
*   **The View**: `reference.vy` (Defines the `body` projection — which commands to include and in what order).
*   **Shared Logic**: `context.vy` (Base templates for all views. Loaded automatically; `.vy` files without a matching `.html` sibling are base templates).

The compiler automatically pairs them:
1.  Loads `context.vy` (and any other unpaired `.vy` files) as base templates.
2.  When `reference.html` is selected, loads `reference.vy` as view overrides.
3.  Applies the `body` projection to filter/reorder document content.
4.  Injects the rendered body into `reference.html`.

### 8. Collection Templates ("Whole Work" Processing)

To generate indices, tables of contents, or glossaries, we introduce **Collection Templates**.
*   **Concept**: Instead of processing a single content file, the compiler aggregates *all* compiled documents into a `Work` object.
*   **Usage**: `vyasac build --collection toc` (looks for `templates/html/toc.vy`).
*   **Context**: The template receives a global `work` object containing a flat list or hierarchical tree of all compilation units.

### 9. Future Work: Segment Recitation Patterns (Ghana/Jata)

Oral traditions often require reciting segments in complex combinatorial patterns for memorization (e.g., *Jata-patha*, *Ghana-patha*).

*   **Requirement**: Generate output where segments (identified by `|`) are permuted according to a pattern.
*   **Example**: If a verse has segments `1 | 2 | 3`:
    *   *Jata*: `1-2-2-1`, `2-3-3-2`.
*   **Design Implication**: This will likely require a dedicated `transform` pass or a specialized view helper (e.g., `{{#each (permute segments "1-2-2-1") }} ... {{/each}}`) rather than simple static templates.
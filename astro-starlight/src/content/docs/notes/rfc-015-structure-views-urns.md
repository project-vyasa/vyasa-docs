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

#### Feedback Integration
*   **Relationship to HTML**: View templates (`reference.vy`) are **Vyasa View Definitions**, not raw HTML.
    *   They define the *content structure* for a specific view.
    *   They can be referenced by the build system to generate any output (HTML, PDF, etc.).
    *   Keeping them in `.vy` maintains a unified templating language, rather than mixing logic into `.html` files (which should remain "dumb" shells).

**reference.vy** (in `templates/html/`):
```text
`body [
    `div { class="reference-view" } [
        `verse  # Only include the verse component
    ]
]
```

### 2. Structural Templates (Implicit Layouts)

*   **Syntax Note**: Per language standard, we use the command-based comment style ` ` [ comment ] ` for block comments, or potentially ` # ` if we formalize it. For this RFC, we'll use ` ` [ ... ] ` to align with existing documentation.

```text
`body [
    `div { class="verse-container" } [
        ` [ The template explicitly lists these elements in this order ]
        `verse
        `synonyms
        `translation
        `purport
    ]
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
-   **Segments**: `|` creates an addressable segment. `urn:vyasa:bg:1:1:1#2` (2nd segment).
-   **Ad-hoc Markers**: `mark { id="foo" }` creates an explicit anchor. `urn:vyasa:bg:1:1:1#foo`.
These append a fragment identifier to the structural URN.

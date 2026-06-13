---
title: RFC 018 Embedded Viewer & Studio Components
description: Proposal for portable, framework-agnostic Vyasa Viewer and IDE components for publishers and developers.
---

# RFC 018: Embedded Components (Viewer & Studio)

**Status**: Proposed  
**Date**: 2026-06-01  
**Topics**: UI Components, Web Components, Distribution, Publishing

## 1. Summary
While the current `PlayArea` serves as an interactive IDE for authors to write and compile Vyasa markup, there is a distinct need for two standalone, distributable components:
1. **Viewer**: A consumer-facing component designed for publishers to embed beautifully rendered, interactive reading experiences into their websites or mobile apps.
2. **Studio (IDE)**: A linguist/author-facing editor component (extracted from the current `PlayArea`) that can be embedded in content management systems.

## 2. Core Architecture & Distribution

> [!IMPORTANT]
> **Framework Agnostic & Package Consolidation**
> Both the Viewer and the Studio will be compiled as standard **Web Components** (`<vyasa-viewer>` and `<vyasa-studio>`). 
> 
> To prevent polluting the lightweight `vyasa-ui` design system, these complex, data-heavy components (requiring `wa-sqlite` and `vyasac-wasm`) will be housed in a new unified package.
> 
> **Proposed Package Name:** `vyasa-elements` (or `@vyasa/elements`).
> *Note: The current `PlayArea` in the documentation site will simply become a thin wrapper that imports and mounts the `<vyasa-studio>` Web Component.*

### Data Source Abstraction
The Viewer natively consumes compiled **Vyasa SQLite Packages** (`.sqlite`). 
- *Future-proofing*: The data ingestion layer will be abstracted via interfaces (e.g., `interface VyasaDataProvider`). While SQLite is the implemented provider today, this prevents architectural lock-in, allowing JSON or server API providers to be written later.

## 3. The "Federated Directory" Starting Point
Instead of hardcoding a specific `.sqlite` package, the `<vyasa-viewer>` embraces the aspiration of a **Federated Directory**. 

The entry point for the component will accept a directory manifest (e.g., a catalog URL). The Viewer will render a "Library View" displaying available works. When a user selects a work, the Viewer dynamically fetches and mounts that specific SQLite package.

**Demonstration Goal:**
We will demonstrate this using a directory containing our 3 distinct samples:
1. Bhagavad Gita (Interlinear, highly structured, multiple streams)
2. Bible (Classic prose, chapter/verse flow)
3. Intimate Note (Unstructured, organic)

```html
<!-- Example Integration by a Host Website -->
<script type="module" src="https://cdn.vyasa.io/elements.js"></script>

<vyasa-viewer 
  directory="https://cdn.vyasa.io/sample-directory.json"
  theme="dark">
</vyasa-viewer>
```

## 4. Disambiguating Publisher vs. Host Responsibilities

When externalizing layouts and styles, we must clearly separate the concerns of the **Content Publisher** (who creates the `.sqlite` package) and the **Hosting Website/App** (which embeds the component).

### A. The Content Publisher's Role
The publisher is responsible for the **Structural Rendering**.
- They compile the original `.vy` files.
- They provide the **HTML Templates** embedded inside the SQLite package. These templates convert semantic Vyasa commands into structural HTML (e.g., converting `` `uvacha `` into `<div class="speaker-action">`).
- They define the internal logical structure of the text streams.

### B. The Host Website's Role
The host property (website or native app wrapper) is responsible for the **Aesthetic Presentation**.
- The Web Component will be entirely "headless" in terms of strict visual design, deferring entirely to the HTML structure provided by the Publisher's templates.
- The Host Website can deeply customize the appearance using exposed **CSS Custom Properties (Variables)** for typography, colors, and layout constraints.
- The Host controls the environment (e.g., injecting the overarching site's font-family, setting Max-Widths, toggling Dark Mode).

## 5. Extensibility & Mobile Contexts

### Mobile WebViews
Native mobile SDKs (Swift/Kotlin) are planned for the distant future. Until then, the Web Component will serve native apps via WebView embeddings.
To factor this in, the Viewer will implement a **Message Bridge** (`window.postMessage`). This allows the Web Component to:
- Broadcast events to the native app shell (e.g., `onVerseClick`, `onChapterComplete`).
- Receive commands from the native app shell (e.g., `setTheme('dark')`, `setFontSize(18)`).

## 6. Client-Side Assembly & Viewer Layouts

Currently, a View projection (e.g., `reading.vy`) defines the layout for the entire experience in a single file. This conflates two distinct layout needs:
1. **The Shell Layout**: The overarching page aesthetics (Fonts, CSS, Site Title). It should be rendered **exactly once**.
2. **The Item Layout**: The arrangement of streams for a single semantic unit (e.g., aligning Sanskrit, IAST, and English horizontally for one verse). It should be rendered **repeatedly** (once per unit).

If we attempt to concatenate 700 verses directly into a single massive document, the payload becomes bloated, interactive structural navigation (e.g., TOC anchor links) becomes unwieldy, and client-side filtering (like "Show only Chapter 1") becomes a fragile string-parsing nightmare.

To fully empower the viewer to act as a dynamic assembly engine (similar to the Reporting Engine proposed in RFC A001), we must adopt a multi-template approach that separates the outer shell from the iterative inner items.

### 6.1 Layout Separation
To fully empower the viewer to assemble the parts at runtime based on the requested "structure", the package must provide the Viewer with distinct layout components.

#### 1. `shell` (The Collection Layout)
The overall layout of the reading experience. It contains CSS, overall headers, and exactly one mount point.

#### 2. `item` (The Assembly Layout)
The structural blueprint for a single semantic unit (e.g. a verse). It contains stream placeholders. 
> *Note: Syntactic sugar like `` `stream { ref="primary" } `` relies on the compiler's native HTML backend standard library to resolve the `ref` directly to the `streams.primary` path defined in `vyasac.toml`. Non-programmers do not need to write complex macros.*

#### 3. `group` (Optional Interstitial Layouts)
If a user filters for Chapters 1-3, the engine first groups the URNs by chapter. The `group` template allows authors to define Chapter headers or footers, acting much like the `report` group headers defined in RFC A001. It can interpolate metadata regarding the grouping dimension.

### 6.2 Single-File Layout Definition

Rather than splitting these components into three distinct files (`layout.vy`, `item.vy`, `group.vy`), we consolidate them into a single projection file (e.g., `templates/html/reading.vy`) using Vyasa-native command syntax to demarcate the layout boundaries. This vastly simplifies the authoring experience.

```vyasa
`layout [
    `html [
        `head [ `title [ Bhagavad Gita ] ]
        `body [
            `h1 [ Bhagavad Gita ]
            `vyasa-mount [] 
        ]
    ]
]

`group [
    `div { class="chapter-header" } [
        `h2 [ Chapter ${group.chapter_number} ]
        `vyasa-mount []
    ]
]

`item [
    `div { class="verse-container" } [
        `stream { ref="primary" }
        `stream { ref="translation" }
    ]
]
```

## 7. Viewer Runtime Behavior

When the Svelte Viewer mounts, it follows a federated loading model:

1. **Load Catalog:** The starting point is the Publisher Catalog (`index.json`), which lists the available works and the URL/path to their respective `.sqlite` packages.
2. **Fetch Package:** Once a work is selected, the Viewer mounts the SQLite package.
3. **Initialize Shell**: It reads `reading.vy`, parses the `` `layout `` section, and injects it into the DOM.
4. **Evaluate Filters**: It evaluates user constraints. E.g., "User clicked Chapter 1." `filteredNodes` evaluates to verses 1/1 through 1/47.
5. **Assemble Items**: For each verse in `filteredNodes`:
    - It clones the `` `item `` layout.
    - It fetches `mula/1/1.html` and `translation/en/1/1.html` from the database.
    - It injects those raw fragments into the `[data-vyasa-stream]` slots.
6. **Mount**: It attaches all assembled items into the `<vyasa-mount>` slot inside the Shell (nesting them within `group` mounts if interstitial groups are present).

## 8. The Storage Layer: Return to SQLite

In the initial design phase (RFC 018), we envisioned the Viewer consuming compiled **Vyasa SQLite Packages (`.sqlite`)** using `wa-sqlite` over HTTP Range Requests. We temporarily pivoted to the `.vyview` JSON package to avoid SQLite turning into a massive, inefficient "blob store" full of pre-rendered, repetitive HTML.

However, now that the **Dual-Template (Shell + Item)** architecture inherently prevents repetitive content and drastically shrinks the data footprint (storing only raw, unstyled HTML fragments per stream), **SQLite becomes the definitive choice.** 

### Why SQLite is superior:
1. **Lazy Loading:** A JSON package requires downloading the entire dataset (e.g. all 700 verses of the BG) into memory. With SQLite and HTTP Range Requests, the Viewer only downloads the exact bytes needed for the requested Chapter/Canto.
2. **Relational Filtering:** Svelte can simply execute: `SELECT path FROM structure WHERE chapter = 1;`
3. **No Blob Bloat:** The DB only stores the `shell.html`, `item.html`, and atomic fragments (`mula/1/1.html`), resolving the storage bloat concern entirely.

**Decision:** The JSON `.vyview` option should be fully deprecated in favor of SQLite. If a fallback viewer is needed in the future for compatibility/size reasons, JSON can be reconsidered, but SQLite will be the standard.

## 9. Viewer UI & Diagnostics

1. **Filtering Bar:** The `VyasaViewer` will implement a horizontal bar at the top with a text field for each component of the URN path. These expressions become the filter expression (e.g. `chapter: 1-3; > 12`). For verses, it will allow fully qualified IDs (e.g., `12:1 - 14:5` when chapter is blank).
2. **Diagnostics Pane:** A diagnostic link will be added to the viewer to expose the contents of the SQLite package for debugging and introspection.
3. **Template Format:** We will consolidate layouts into single `.vy` files (e.g. `reading.vy`) separated by `--- [type] ---` demarcations.

## 10. Highlighting and Annotations (Comments)

A major requirement for a semantic viewer is the ability for users or external authors to highlight words or sentences and attach comments or annotations.

### Internal (Vyasa) Comments vs External (Markdown) Comments
Annotations do **not** need to be stored inside the original `.vy` source code of the work. Because Vyasa implements a robust URN system (`urn:vyasa:bg:1:1`), comments can exist entirely outside the original work.

An author can create a completely separate `comments.md` or `notes.vy` file in a different project. They can use standard Markdown to write their commentary, and use Vyasa's semantic links to anchor their comments to the source text:

```md
# My Thoughts on the Bhagavad Gita
The opening verse sets a fascinating stage. 
[My comment on the first verse](urn:vyasa:bg:1:1) - This signifies the beginning of the battle.
```

When the Svelte Viewer mounts the text, it can cross-reference multiple SQLite packages (e.g., the `vedabase-bg.sqlite` package and the `my-notes.sqlite` package). It queries the `urns` table, identifies any incoming annotations for a specific verse or word, and dynamically injects highlighting spans (e.g., `<mark class="vyasa-annotation">`) over the corresponding HTML fragments at runtime.

This federated approach means external linguists or students can maintain their own Markdown notes repositories, compile them with `vyasac`, and overlay them onto the official publisher's text in the Web Component without ever modifying the publisher's original Vyasa files.

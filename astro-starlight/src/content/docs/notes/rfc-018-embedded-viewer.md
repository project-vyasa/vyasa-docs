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

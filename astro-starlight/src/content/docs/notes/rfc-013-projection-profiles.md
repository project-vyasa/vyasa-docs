---
title: RFC 013 Output Projection Profiles & Scoped Context
description: Proposal for flexible output projection configuration and template organization.
---

# RFC 013: Projection Profiles

**Status**: Implemented

## Summary
Vyasa currently supports a single output target: HTML. This proposal introduces "Projection Profiles" to allow:
1.  Defining multiple output targets in `vyasac.toml`.
2.  Organizing templates and context per target.
3.  Keeping the global `context.vy` clean from target-specific configuration.

## Motivation
Currently, all configuration lives in a single `context.vy`. This leads to pollution when you have commands specific to HTML (e.g., `span { class="..." }`) vs Voice or JSON.
We need a way to scope context and templates to a specific output projection.

## Proposal

### 1. `vyasac.toml` Configuration
Define projection targets in the project manifest:

```toml
[projections]
html = { path = "view/html" }
voice = { path = "view/voice" }
json = { path = "data/json" }
```

### 2. File Organization
Instead of a flat `templates/` folder, use scoped directories:

```
workspace/
├── vyasac.toml
├── content/ ...
└── view/
    ├── html/
    │   ├── templates/ ... (HTML templates)
    │   └── context.vy (HTML-only commands)
    └── voice/
        ├── templates/ ... (Voice templates)
        └── context.vy (Voice-only commands)
```

### 3. Build Command syntax
Allow users to select a projection at build time:

```bash
vyasac build --projection html  # Uses view/html/context.vy + templates
vyasac build --projection voice # Uses view/voice/context.vy + templates
```

### 4. Scoped Context Loading
When building for `html`:
1.  Load Global `context.vy`.
2.  Load `view/html/context.vy` (This overrides or adds to global).
3.  Templates in `view/html/templates` override default templates.

## 5. Update (2026-07): Stream Vocabulary Localization

To support localized, domain-accurate terminology across interlinear streams, each stream's scoped `context.vy` can declare a `vocabulary` block. This dictionary maps structural container labels, entity display names (`graph_nodes`), and relational action/role labels (`graph_edges`) for viewer UI rendering:

```vyasa
// content/mula-deva/context.vy
`vocabulary {
    structure = [ "skandha" = "स्कन्ध", "adhyaya" = "अध्याय", "shloka" = "श्लोक" ]
    leaf_default = "shloka"
    
    entities = {
        "arjuna" = "अर्जुन"
        "dhritarashtra" = "धृतराष्ट्र"
    }
    
    actions = {
        "uvacha" = "उवाच"
        "speaker" = "वक्ता"
        "note" = "टिप्पणी"
        "variant" = "पाठान्तर"
    }
}
```
During compilation (`vyasac pack`), these vocabulary maps are serialized into the publication `manifest` (under `stream_vocabularies`) and `graph_dict`, allowing breadcrumb navigation and graph badges to display localized labels without hardcoding.


---
title: User Roles & Touchpoints
description: A matrix of user roles and their interaction with Vyasa.
---

# User Roles & Touchpoints

This matrix maps key user personas to their primary interactions with the Vyasa ecosystem. We use this to verify that our features address the needs of all stakeholders.

| Role | Description | Key Touchpoints | Needs / Pain Points |
| :--- | :--- | :--- | :--- |
| **Source Editor** | Digitizes primary texts (Works). | `vyasac.toml` (Schema), `.vy` (Structure), `context.vy` (Metadata) | - Ergonomic typing (minimal shifts)<br>- Stable URNs<br>- Validation of structure (Chapters/Verses) |
| **Translator** | Translates texts into other languages. | `context.vy` (Dependency declaration), `translation` command, `.vy` (Semantic text) | - Alignment with source URNs<br>- "Focus Mode" (seeing source while typing)<br>- Handling multiple verses (13-14) |
| **Commentator** | Writes explanations/purports. | `commentary` command, `ref` (Linking to words), `media` embedding | - Rich text support (styles)<br>- Deep linking to specific words/segments<br>- embedding audio/video references |
| **Publisher** | Packages and distributes content. | `vyasa pack` (CLI), `vyasa.toml` (Manifest), Registry | - Versioning<br>- Dependency management (Translation X needs Work Y)<br>- Verify integrity/signatures |
| **Consumer (Reader)** | Reads/Chants the text. | Reader App (WASM/HTML), Player (Audio alignment) | - Fast search<br>- Offline access<br>- Seamless switching (Sanskrit -> English -> French) |
| **Consumer (Chanter)** | Recites the text. | Audio Player, Transliteration Switcher | - Karaoke-style highlighting (Segment level)<br>- Script toggling (Devanagari <-> Roman) |

## Priority Mapping

1.  **Source Editor**: Addressed by RFC 015 (Structure) and RFC 017 (Naming).
2.  **Translator**: Addressed by RFC 017 (Graph Linking). **Next**: Tooling for "Side-by-side" translation experience.
3.  **Publisher**: Addressed by RFC 017 (Packaging). **Next**: `vyasa pack` implementation.
4.  **Consumer**: Addressed by `html`/`wasm` targets. **Next**: Search/Indexing (SQLite).

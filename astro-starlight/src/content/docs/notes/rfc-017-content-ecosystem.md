---
title: RFC 017 - Content Ecosystem & Naming
description: Naming conventions and structure for an interconnected graph of works, translations, and commentaries.
---

# RFC 017: Content Ecosystem & Naming

## Summary

This RFC addresses the need for a standardized naming scheme to facilitate an interconnected graph of literary content. It defines the relationships between a primary `Work` and its derivative or associated content, such as `Secondary Work`, `Transliteration`, `Commentary`, and `Translation`.

This is critical for a vibrant ecosystem where publishers, researchers, and users can seamlessly navigate between a source text and its various interpretations and renditions.

## 1. Domain Definitions

We define the following core artifacts in the Vyasa ecosystem:

1.  **Work** (Primary Text)
    *   The authoritative source content (e.g., *Bhagavad-gita*, *Rig Veda*).
    *   Often referred to as just "text" in Sanskrit (*mula*) or Hebrew lineages.
    *   **Granularity**: A hierarchical grouping of verses (e.g., `[canto, chapter, verse]`).
    *   **Addressability**: The `verse` is the smallest unit of addressable text.

2.  **Secondary Work**
    *   Variations of the Primary Work (e.g., *Padma Purana* variations, recensions).
    *   May include minor textual differences or additional verses.
    *   **Relation**: Links back to the Primary Work's URN structure but may introduce new nodes.

3.  **Transliteration**
    *   A phonetic representation of the `Work` or `Secondary Work` in a different script.
    *   **Examples**: ISO-15919 (Romanized Sanskrit), IAST, IPA.
    *   **Purpose**: Critical for oral rendition (chanting) and accessibility for those who cannot read the original script.
    *   **Relation**: 1:1 mapping with the source tokens of the Work.

4.  **Commentary** (*Bhashya* / *Tika*)
    *   Explanations or elaborations on the `Work`.
    *   **Authorship**: Attributed to a specific person (e.g., *Shankara*, *Ramanuja*) or lineage/organization.
    *   **Language**: May be in the same language as the Work (Sanskrit on Sanskrit) or different.
    *   **Relation**: Targets specific URNs (Verse, Chapter, or specific words) of the Work.

5.  **Translation** (*Anuvada*)
    *   Rendition of the `Work`, `Secondary Work`, or `Commentary` in a different language.
    *   **Relation**: Semantic mapping to the source unit (Verse or Block).

6.  **Media Types**
    *   Audio, Video, Animation, Images.
    *   Can represent any of the above (e.g., audio of a chant, video of a lecture).
    *   **Relation**: Time-aligned or structural alignment to the Work's URNs.

## 2. Naming & Addressing Scheme (Graph Linking)

Instead of a monolithic URN that grows (Suffix approach), we propose a **Graph Linking** approach. Each artifact has its own authoritative URN and explicitly declares its dependencies.

### 2.1 Artifact URNs

Each published artifact has a unique URN.

*   **Primary Work**: `urn:vyasa:work:bg`
*   **Translation**: `urn:vyasa:trans:en:prabhupada:bg`
*   **Commentary**: `urn:vyasa:comm:shankara:bg`

### 2.2 Structural Linking

Inside the derivative work, the connection is made via **Structural Alignment**.

**Translation File (`bg_trans_en.vy`)**:
```vy
`set context {
    type = "translation"
    language = "en"
    source_work = "urn:vyasa:work:bg" // Declares dependency
}

// The structure mirrors the source.
// The compiler aligns `chapter 1, verse 1` here with `chapter 1, verse 1` of source_work.
`chapter { id="1" }
`verse { id="1" } [ ... translation text ... ]
```

This decoupling allow the Translation to exist independently. A "Player" or "Reader" application loads both the Source and Translation and joins them on the fly based on the `id` hierarchy.

## 3. Discovery & Packaging

To facilitate a vibrant ecosystem, we need a standard interchange format and discovery mechanism.

### 3.1 Vyasa Packages (`.vypkg`)

A package is a versioned archive containing:
1.  **Manifest** (`vyasa.toml`): Declares Type, URN, Dependencies (Source Work), and License.
2.  **Content**: Compiled artifacts (HTML/JSON/SQLite) or Source `.vy` files.
3.  **Assets**: Media files.

### 3.2 Federated Registry

We propose a decentralized registry system:
*   **Registry Index**: A JSON file listing available packages and their metadata.
*   **Backups/Mirrors**: Publishers can host their own registries.
*   **CLI Usage**: `vyasa install urn:vyasa:trans:en:prabhupada` resolves the package from configured registries.

## 4. Goals

*   **Interconnected Graph**: Enable a user to click a verse and see all linked commentaries, translations, and media.
*   **Vibrant Ecosystem**: Allow independent publishers to release a "Commentary Pack" that seamlessly overlays onto an existing "Work" installed by the user.

---
title: RFC-005 Segment Addressing Scheme
description: Design for segment addressing scheme
---
# RFC 005: Segment Addressing Scheme

**Status**: Implemented
**Date**: 2026-01-30
**Topics**: URN, Linking, Interlinear Alignment

## 1. Summary
This RFC defines the standard syntax for addressing sub-segments within a Vyasa Marker. It extends the Base URN scheme (e.g., `urn:vyasa:bg:1:1`) with a path component to allow granular linking to specific commands and text segments, enabling robust interlinear alignment and precise citations.

## 2. Motivation
Currently, we can address a "Whole Marker" (like a Verse), but we cannot address:
1.  **Specific Layers**: e.g., "The Sanskrit transliteration of Verse 1".
2.  **Specific Segments**: e.g., "The second distinct phrase in the verse".

Granular addressing is required for:
*   **Interlinear Alignment**: Mapping specific words in the source to the translation.
*   **Fine-grained Commentary**: Commenting on a specific word or phrase.
*   **Audio Sync**: Mapping timecodes to text segments.

## 3. Design Specification

### 3.1 Syntax
The Segment URN is constructed by appending a path to the Base Marker URN.

```
{BaseURN}/{ComponentPath}
```

*   **Separator**: `/` (Forward Slash)
*   **BaseURN**: The URN defined by the `marker` command (e.g., `urn:vyasa:bg:6:5`).
*   **ComponentPath**: One or more path segments describing the target node.

### 3.2 Resolution Logic: Descendant Search
To ensure stability against layout refactoring (e.g., wrapping content in `<div>` or `textstream`), the resolution algorithm uses a **Descendant Search** strategy (similar to CSS selectors or XPath `//`).

**Algorithm**:
1.  Start at the **Marker Node**.
2.  Parse the first path component (e.g., `d`).
3.  Perform a **Breadth-First Search (BFS)** of the marker's subtree.
4.  Return the *first* descendant command that matches the alias/name.
    *   *Note*: Structural wrappers (`textstream`, `interlinear-streams`) are implicitly skipped unless explicitly targeted.

### 3.3 Path Component Types

#### A. Command Selector (`/name`)
Targets a descendant command by its name or alias.

*   **Syntax**: `/command`
*   **Example**: `.../d`
    *   Finds the first `d` (Devanagari) command inside the marker.

#### B. Ordinal Selector (`/name:N`)
Targets the Nth instance of a command (0-indexed) found during the BFS traversal.

*   **Syntax**: `/command:N`
*   **Example**: `.../p:1`
    *   Finds the *second* paragraph (`p`) inside the marker.

#### C. Interlinear Segment Selector (`/name/s:N`)
Targets a specific text segment within a command. This is used for split blocks where content is separated by pipes (`|`).

*   **Syntax**: `/command/s:N`
*   **Virtual Node**: `s` (Segment) is a virtual selector.
*   **Logic**:
    1.  Resolve the parent command (e.g., `d`).
    2.  Collect all `Text` children, split by `SegmentBreak` nodes.
    3.  Return the Nth logical text chunk.
*   **Example**: `.../d/s:1`
    *   Given `d[ A | B ]`: Targets string "B".

## 4. Examples

**Source**:
```text
`marker 1.1
  `textstream [
     `d [ धर्मक्षेत्रे कुरुक्षेत्रे | समवेता युयुत्सव: ... ]
     `i [ dharmakṣētrē | kurukṣētrē ... ]
  ]
```

**Addressable URNs**:
| Target | URN | Note |
| :--- | :--- | :--- |
| **Marker** | `urn:vyasa:bg:1:1` | The root anchor. |
| **Devanagari** | `urn:vyasa:bg:1:1/d` | Finds nested `d`, skipping `textstream`. |
| **Transliteration** | `urn:vyasa:bg:1:1/i` | Finds nested `i`. |
| **Word 1 (San)** | `urn:vyasa:bg:1:1/d/s:0` | "धर्मक्षेत्रे कुरुक्षेत्रे" |
| **Word 2 (San)** | `urn:vyasa:bg:1:1/d/s:1` | "समवेता युयुत्सव:" |

## 5. Implementation Plan
1.  **Resolver**: Implement `resolve_segment(root: &Node, path: &str) -> Option<&Node>` in `vyasac::models`.
2.  **Enricher**: During compilation, optionally pre-calculate these URNs for leaf nodes if `strict_addressing` is enabled.
3.  **Packer**: Ensure these URNs are valid targets for external tooling.

---
title: Flow State & Addressing
description: Managing context across files and addressing specific segments.
sidebar:
  order: 10
---

# Flow State & Segment Addressing

Vyasa is designed for long-form content like epic poetry, plays, and technical manuals. Real-world projects often span multiple files. This guide explains how Vyasa maintains **Narrative Flow** across these files and how to target specific content with **Segment Addressing**.

## 1. Multi-File Compilation

When you build or pack a Vyasa workspace, the compiler treats your `.vy` files as a single continuous stream.

### Natural Sorting
To ensure the narrative flows correctly, Vyasa calculates the order of your files using **Natural Sorting** (Numeric-Aware).

*   **Correct**: `1.vy` → `2.vy` → `10.vy`
*   **Incorrect (Standard Sort)**: `1.vy` → `10.vy` → `2.vy`

This means you can number your chapters (`1.vy`, `2.vy`) without needing padding (`01.vy`), and Vyasa will compile them in the logical order designated by the numbers.

### Context Persistence (Speaker & Action)
State defined in one file persists to the next. This allows you to carry over both the **Actor** (Speaker) and **Action** (Verb) to subsequent files, effectively "keeping the speech open".

**Example**:
*   `1.vy` (Chapter 1):
    ```text
    `entity { type="person" speaker="Dhritarashtra" action="uvacha" }
    `uvacha [ O Sanjaya... ]
    ```
    *(Here, we explicitly set the state. The `uvacha` command inherits it.)*

*   `2.vy` (Chapter 2):
    ```text
    `verse [
        What happened next?
    ]
    ```
    *(The `verse` in Chapter 2 inherits `speaker="Dhritarashtra"` and `action="uvacha"` automatically.)*

**Rendering**:
Your HTML templates can check these attributes to render the "said" label even for plain verses:
```html
{% if node.attributes.action == "uvacha" %}
  <span class="speaker">{{ node.attributes.speaker }} said:</span>
{% endif %}
{{ node.children }}
```

> **Note**: Standard content commands (like `uvacha` itself) do *not* automatically update the global state. You must use the `entity` (or `state`) command to effectively "open" a persistent context.

---

## 2. Segment Addressing (RFC 005)

Vyasa supports fine-grained addressing of content using URNs with path components. This allows you to link not just to a Verse, but to a specific word or command *inside* that verse.

### Syntax
`{BaseURN}/{Path}`

*   **Base URN**: The ID of the Marker/Verse (e.g., `urn:vyasa:bg:1:1`).
*   **Path**: `/` followed by selectors.

### Selectors

| Selector | Description | Example |
| :--- | :--- | :--- |
| `/cmd` | Finds the first command named `cmd` (Breadth-First). | `/d` (Finds Devanagari) |
| `/cmd:N` | Finds the Nth instance (0-indexed) of `cmd`. | `/p:1` (2nd Paragraph) |
| `/s:N` | **Virtual**: Finds the Nth text segment within a command. | `/d/s:1` (2nd Word) |

### Use Cases
*   **Interlinear Linking**: Mapping a word in the translation to the source word.
*   **Precise Commentary**: Linking a footnote to a specific phrase.
*   **Audio Alignment**: Mapping a timestamp to a text segment.

### Example
Given:
```text
`marker 1.1
  `d [ WordA | WordB ]
```

*   `urn:vyasa:bg:1:1` → The whole verse.
*   `urn:vyasa:bg:1:1/d` → The Devanagari block.
*   `urn:vyasa:bg:1:1/d/s:1` → "WordB".

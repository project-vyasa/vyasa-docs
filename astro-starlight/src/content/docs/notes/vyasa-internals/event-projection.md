---
title: Hyperedge Nodes & Event Projection
description: Design notes on using EventHeader nodes for multi-lingual projection.
---

# Hyperedge Nodes & Event Projection

## Problem Statement

In narrative texts like the Mahabharata, speaker attribution is often repetitive and needs to be rendered differently based on the target audience or language.

**Source**:
```vy
`sanjaya `uvacha
```

**Target (English)**:
> Sanjaya said:

**Target (Sanskrit)**:
> सञ्जय उवाच

Currently, we model this as two separate commands: a speaker entity (`sanjaya`) and an action (`uvacha`). However, this relies on linear processing and doesn't capture the *event* effectively.

## Proposed Solution: EventHeader

The Vyasa syntax supports **Event Headers**, which act as hyperedge nodes connecting multiple entities in an event tuple.

**Syntax**:
```vy
( sanjaya uvacha )
```

This parses into a `Node::EventHeader` containing a tuple of commands.

### Semantic Meaning

This node represents a **Hyperedge** connecting:
*   **Subject**: `sanjaya` (Entity)
*   **Verb/Action**: `uvacha` (Action)
*   **Context**: The simpler linear stream implies this event applies to the following block.

### Projection Strategy

To support multi-lingual output, the `Projector` can be updated to handle `EventHeader` nodes by matching them against a template, similar to standard commands.

#### 1. Template Definition

We can define a template for the `event` concept, or speculatively, for the specific tuple signature.

A more flexible approach is to map the **Action** to a template that accepts the **Subject**.

**Template (`uvacha`):**
```vy
`template { target="html" name="uvacha" } [
    `div { class="speaker-attribution" } [
        `span { class="en" } [ $.subject.label_en said: ]
        `span { class="sa" } [ $.subject.label_dev ]
    ]
]
```

#### 2. Compiler Logic

When the compiler encounters `( sanjaya uvacha )`:
1.  **Resolve Entities**: It resolves `sanjaya` to the entity defined in the registry.
2.  **Resolve Action**: It identifies `uvacha` as the action.
3.  **Apply Template**: It looks for a template matching the action (`uvacha`).
4.  **Inject Context**: It injects the subject's properties (`$.subject.*`) into the template.

 This allows the source text to remain minimal and semantic (`( sanjaya uvacha )` or just `sanjaya uvacha` if we infer the tuple), while the output can be rich and localized.

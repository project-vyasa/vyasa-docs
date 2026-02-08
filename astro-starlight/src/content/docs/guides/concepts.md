---
title: Conceptual Model
description: Understanding the semantic modeling capabilities of Vyasa.
sidebar:
  order: 1
---

# Vyasa Conceptual Model

Vyasa is not just a markup language for formatting text; it is a semantic modeling tool for **Narrative Graphs**. This guide explains the core concepts used to model relationships, context, and flow, independent of specific syntax.

## 1. The Narrative Graph

Traditional typesetting focuses on *Layout* (Paragraphs, Pages, Fonts).  
Vyasa focuses on *Semantics* (Who is doing what? What is the relationship between this text and that one?).

Conceptually, a Vyasa document forms a graph where:
*   **Nodes** are Entities (People, Places, Concepts) or Content (Verses, Prose).
*   **Edges** are Actions or Relationships (Speaking, Referencing, Containing).

## 2. Entities (Actors)
An **Entity** is any distinct agent or object within the narrative.

*   **Role**: Entities are the "Subjects" of the text.
*   **Types**:
    *   **Person**: Real humans (e.g., *Arjuna*).
    *   **Deity/Supernatural**: (e.g., *Krishna*).
    *   **Group**: Collections of beings (e.g., *The Pandavas*).
    *   **Abstract**: Concepts that can "act" (e.g., *The Divine Voice*).
*   **Identity**: Entities have stable URNs (Unique Resource Names) that exist independently of how they are referred to in text (e.g., "Partha" and "Dhananjaya" both resolve to `urn:entity:arjuna`).

## 3. Actions (Verbs)
An **Action** describes the relationship between an Entity and a block of Content.

Instead of hardcoding "Speaker" as a text label, we model it as an Action.
*   **Speaking** (`uvacha`): The Entity is vocalizing the content.
*   **Thinking**: The Entity is internalizing the content.
*   **Narrating**: The Entity is describing an event.

### Dynamic Binding
The relationship isn't static.
*   **Actor**: Who is performing?
*   **Action**: What are they doing?
*   **Scope**: How long does this action persist?

## 4. Flow State (Context)
Narratives are sequential. Context established in Chapter 1 often applies to Chapter 2.

Vyasa models this as **Flow State**:
1.  **Persistence**: Once an Actor takes the stage (becomes the active Subject), they remain the Subject until explicitly replaced.
2.  **Action Persistence**: If an Actor starts "Speaking", they continue speaking across file boundaries until the narrative shifts.
3.  **Implicit Attribution**: Content that appears without an explicit label attracts the attributes of the current Flow State.

## 5. Segment Addressing
Content is addressable at infinite granularity.
*   **Macro**: The Work (The Gita).
*   **Meso**: The Verse (Verse 1.1).
*   **Micro**: The Phrase (The first line).
*   **Atomic**: The Word (The Sanskrit term *Dharma*).

### Overlay Graphs (Commentary/Translation)
Segment addressing empowers you to "overlay" additional graphs onto the Source graph without modifying the source files.

**Example**:
*   `source.vy`: Defines the text.
    ```text
    `marker 1.1 `d [ Dharma-kshetre ]
    ```
*   `commentary.vy`: References specific nodes to add meaning.
    ```text
    `ref "urn:vyasa:bg:1:1/d/s:1" { note="Field of Dharma" }
    ```
This keeps your source text pure while allowing infinite layers of interpretation (Commentary, Translation, linguistic analysis) to point effectively to the exact segment they discuss.

### Syntax Patterns
While the underlying model is "Entity with Attributes", Vyasa supports defining aliases to create natural Subject-Verb syntax.

### Syntax Patterns
While the underlying model is "Entity with Attributes", Vyasa supports defining aliases to create natural Subject-Verb syntax.

*   **Define Alias**: `` `alias-def { name="sanjaya" target="entity" params="{speaker='Sanjaya'}" } ``
*   **Define Action**: `` `alias-def { name="spoken" target="entity" params="{action='uvacha'}" } ``
*   **Usage**: `` `sanjaya `spoken ``

This updates the Flow State just like the verbose `` `entity { speaker="Sanjaya" ... } `` command.

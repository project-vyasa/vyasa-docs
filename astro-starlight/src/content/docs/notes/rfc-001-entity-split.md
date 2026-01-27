---
title: "RFC 001: Entity Command Split"
description: Proposal to disambiguate the entity command into set-state and entity.
created: "2026-01-25"
---

## RFC 001: Disambiguating Entity Commands
2026-01-25

## Context
The `entity` command currently serves two distinct purposes:
1.  **State Setting**: `entity { speaker="name" }` updates the global flow state.
2.  **Inline Reference**: `entity Krishna` creates a specific node referencing an entity.

This overloading causes confusion. This RFC proposes splitting these responsibilities into distinct commands.

## Proposal

### 1. New Command: `set-state` (alias `state`)
Used exclusively for **State Setting**.
*   **Purpose**: To update the contextual state (speaker, scene, etc.) for subsequent nodes.
*   **Syntax**: `` `state { key=val ... } ``
*   **Example**: `` `state { speaker="Sanjaya" } ``

### 2. Refined Command: `entity`
Retained for **Inline References/Tagging**.
*   **Change**: It will **no longer** have the side effect of updating global state. It strictly creates a node (semantic tag).
*   **Syntax**: `` `entity <Name> { ...attributes } ``
*   **Example**: `` `entity Krishna ``
*   **Note**: Users can define aliases like `mention` -> `entity` in their config if preferred:
    ```text
    `set aliases { mention = "entity" }
    ```

### 3. Migration (No Deprecation)
*   Since the project is in alpha with no external users, we will strictly separate the behaviors immediately.
*   Docs and examples will be updated to use `state` for state changes.

## Usage Comparison

| Intent | Old Syntax | New Syntax |
| :--- | :--- | :--- |
| **Inline Reference** | `` `entity Krishna `` | `` `entity Krishna `` |
| **Change Speaker** | `` `entity{speaker="Sanjaya"} `` | `` `state{speaker="Sanjaya"} `` |
| **Reset State** | `` `entity{speaker=""} `` | `` `state{speaker=""} `` |

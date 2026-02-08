---
title: RFC-007 Speaker Patterns
description: Analysis of Generic vs. Explicit syntax for defining speakers.
---
# RFC 007: Speaker Patterns

**Status**: Draft
**Date**: 2026-02-01
**Topics**: Entities, DSL Design, Developer Experience

## 1. Summary
This RFC compares two competing patterns for defining speakers in Vyasa: the **Generic Pattern** (`speaker[Name]`) and the **Explicit Entity Pattern** (`Name` as a command). It analyzes the trade-offs and proposes a recommendation for different workspace types.

## 2. The Contenders

### A. Generic Pattern
Used in `intimate-note`. The speaker is an argument to a generic command.

```text
`speaker[Dhritarashtra] `uvacha [ ... ]
```

*   **Pros**:
    *   **Zero Auto-Configuration**: No need to pre-define "Dhritarashtra" in `context.vy`.
    *   **Namespace Cleanliness**: Does not pollute the global command namespace.
    *   **Extensible**: Authors can introduce new speakers on the fly.
*   **Cons**:
    *   **Verbosity**: High friction for scripts with frequent dialogue (e.g., plays, Gita).
    *   **Validation**: Harder to catch typos (`speaker[Dritarashtra]`) at compile time unless an enum constraint is individually applied.

### B. Explicit Entity Pattern
Used in `bhagavad-gita`. The speaker is a first-class command.

```text
`Dhritarashtra `uvacha [ ... ]
```

*   **Pros**:
    *   **Conciseness**: extremely low friction for dialogue-heavy texts.
    *   **Readability**: Reads like a natural script.
    *   **Validation**: Typos (`Dritarashtra`) are compile-time errors (Unknown Command).
*   **Cons**:
    *   **Configuration Heavy**: Every speaker MUST be defined in `context.vy` (`command-def { name="Dhritarashtra" ... }`).
    *   **Namespace Pollution**: Large casts can crowd the command space.

## 3. Analysis

### Contextual Suitability

| Feature | Generic Pattern | Explicit Entity Pattern |
| :--- | :--- | :--- |
| **Use Case** | Narratives, infrequent quotes, one-off speakers. | Plays, Scripts, Dialogues (Gita, Shakespeare). |
| **Setup Cost** | Low | High |
| **Authoring Speed** | Medium | High |
| **Validation** | Loose (unless validated against list) | Strict (Schema-driven) |

### The "Uvacha" Interaction
Both patterns interact with the `uvacha` (action) command.

1.  **Generic**: The template must inspect the `speaker` command's *argument* to determine the specific header (e.g., "dhṛtarāṣṭra uvāca").
2.  **Explicit**: The template inspects the `node.cmd` itself.

## 4. Recommendation

Vyasa should support **both**, but recommend them for different domains.

### Recommendation A: The "Script" Profile
For workspaces that are primarily dialogue (Gita, Upanishads, Plays):
*   Use **Explicit Entity Pattern**.
*   Define all characters in `context.vy` or distinct `.vy` definitions.
*   **Reason**: The friction reduction for the author outweighs the setup cost.

### Recommendation B: The "Prose" Profile
For workspaces that are primarily narrative (Bible, Novels, Articles):
*   Use **Generic Pattern** (`speaker` or `q` alias).
*   **Reason**: Speakers appear ad-hoc; defining them all is overkill.

## 5. Implementation Impact
No compiler changes are required to support either. This is purely a pattern choice for `context.vy` configuration and Template logic.

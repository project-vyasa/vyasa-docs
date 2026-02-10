# Vyasa Sample Workspaces

This directory contains reference implementations of Vyasa projects.

## Goals

1.  **Feature Demonstration**: Collectively, these samples should demonstrate every feature of the Vyasa compiler and language.
2.  **Design Rationale**: When the language offers multiple ways to achieve a goal (e.g., Stream vs. Container), the samples should explicitly document *why* a specific approach was chosen for that context.


[See Feature Matrix](FEATURE_MATRIX.md) for a detailed breakdown of language features used in each sample.

## Current Samples

| Workspace | Focus | Key Concepts |
| :--- | :--- | :--- |
| **minimal** | "Hello World" | Basic structure, default templates. |
| **bible** | Continuous Narrative | **Stream-based architecture**. Using `alias-def` for verses (`v`) for continuous prose where structure is secondary to flow. |
| **intimate-note** | Freeform Notes | **Whitespace preservation**. Custom formatting templates (`center`, `right`) and semantic tagging (`knowledge-sheet`). |
| **bhagavad-gita** | Structured Verse | **Container/Pattern-based architecture**. Complex internal structure per verse (Sanskrit, Transliteration, Word-for-word, Translation, Purport) using state management (`set entities`) and context. |

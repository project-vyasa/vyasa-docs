# Vyasa Sample Workspaces

This directory contains reference implementations of Vyasa projects.

## Goals

1.  **Feature Demonstration**: Collectively, these samples should demonstrate every feature of the Vyasa compiler and language.
2.  **Design Rationale**: When the language offers multiple ways to achieve a goal (e.g., Stream vs. Container), the samples should explicitly document *why* a specific approach was chosen for that context.

## Current Samples

| Workspace | Focus | Key Concepts |
| :--- | :--- | :--- |
| **minimal** | "Hello World" | Basic structure, `set file`, default templates. |
| **bible** | Continuous Narrative | **Stream-based architecture**. Using `reference` aliases (`r`) for continuous prose where structure is secondary to flow. |
| **bhagavad-gita** | Structured Verse | **Container/Pattern-based architecture**. Complex internal structure per verse (Sanskrit, Transliteration, Word-for-word, Translation, Purport) using `interlinear-streams`. |

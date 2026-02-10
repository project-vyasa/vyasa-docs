# Bhagavad Gita Sample

This workspace demonstrates Vyasa's capability to handle **highly structured, multi-lingual, and deeply annotated content**. It is the marquee example of using Vyasa for complex literary or scriptural data.

## Key Features

### 1. Rigorous Structure (Schema Enforcement)
Unlike the loose structure of the *Intimate Note* sample, this workspace enforces a strict schema for every verse.
-   **Mandatory Fields**: Every verse must have `sanskrit`, `transliteration`, `synonyms`, `translation`, and `purport`.
-   **Type Checking**: The compiler ensures that all required components are present and correctly nested.

### 2. Multi-Part Data Model
Each file represents a single verse but contains distinct data streams:
-   **Original Text**: Devanagari script.
-   **Romanization**: IAST transliteration.
-   **Word-for-Word**: Precision synonyms mapping.
-   **Translation**: A prose translation.
-   **Purport**: Detailed commentary (often with nested formatting).

### 3. Native Templates for Complex Layouts
The `context.vy` defines a sophisticated HTML template that:
-   Renders the Sanskrit and Transliteration in a centered, poetic block.
-   Formats the Synonyms as a flowing paragraph with bolded keys.
-   distinctly styles the Translation and Purport sections.
-   **Trade-off**: This requires more upfront template setup than a simple Markdown file, but ensures 100% consistency across 700+ verses.

### 4. Domain-Specific Commands
-   `sanskrit`: Applies specific font styling for Devanagari.
-   `synonyms`: Handles key-value pairs for word definitions.
-   `purport`: Supports rich text (bold, italic, links) within the commentary.

## Content Structure
-   **`context.vy`**: The "schema" and "view" definition. It defines the `verse` command and its rendering template.
-   **`content/X/Y.vy`**: Individual files for Chapter X, Verse Y (e.g., `content/1/1.vy`). This granular file structure allows for:
    -   Easy version control of specific verses.
    -   Parallel editing.
    -   Fast partial compilation.

## Why Vyasa for this?
Standard Markdown struggles with this level of density. You would need endless HTML `<div>` tags or complex shortcodes. Vyasa treats the verse as a **data object** first, then projects it into a view, keeping the content clean and semantic.

---
title: Linguist's Q&A
description: Answers to common questions about Vyasa language design decisions.
---

This guide addresses common questions from linguists and authors regarding the design choices in the Vyasa language.

## Structure & Headings

### Q: Why do we use `h1`, `h2`, etc., instead of `section`, `subsection`?

**A:** This was a pragmatic choice to align with the most common output format: HTML.
*   `h1` corresponds directly to a Level 1 Heading.
*   `section` often implies a *container* that wraps content (start/end), whereas Vyasa headings are currently *markers* (they sit at a point in the stream).
*   However, we recognize that `h1` is generic. To address the confusion between the "Title of the Work" and "Chapter 1", we have introduced the **`title`** command.

### Q: Can I use `h4`, `h5`, or `h6`?

**A:** **No.** We have explicitly removed support for these generic deep-heading levels.
*   **Reason**: These deeply nested levels are artifacts of legacy HTML design and rarely map well to other projections like Voice (TTS), eBooks, or Semantic Data.
*   **Recommendation**: If you need that much nesting, consider whether your document structure should be flattened or if you should use other organizational tools like Lists.

## Output & Projections

### Q: How do I control the output for different formats?

**A:** Vyasa allows you to define flexible output rules.
*   We use specific **Templates** (in `templates/`) to control how commands render to HTML.
*   We are currently designing a "Projection Profile" system (RFC-013) to allow you to define completely different rules for PDF, JSON, or other targets.

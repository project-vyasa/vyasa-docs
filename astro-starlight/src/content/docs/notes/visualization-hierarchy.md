---
title: Visualization Hierarchy
description: Architectural note on rendering deep container hierarchies using a hybrid DOM + SVG approach.
---

# Visualization Hierarchy

Visualizing the Vyasa package structure presents a unique challenge due to its deeply nested nature (Publications -> Books -> Cantos -> Chapters -> Blocks). 

Traditional visualization libraries often struggle when tasked with rendering an entire deep hierarchy within a single SVG coordinate space. Faceting (e.g., repeating a chart for every Book) usually enforces shared axis domains, resulting in massive empty matrices and overlapping labels. 

## The Hybrid Approach

To achieve a dense, "calendar-like" matrix visualization that accurately reflects the nested structure without visual clutter, we use a hybrid **DOM + SVG** architecture.

### 1. Ancestral Scaffolding (DOM)
Non-leaf containers (like Books, Cantos, or Years) are structurally rendered using standard HTML elements (e.g., `<div>`, `<h3>`). 
- **Benefits**: This allows the browser's CSS Flexbox/Grid engine to handle the high-level layout. Ancestral headers can span the full page width, flow naturally, and wrap onto new lines responsively without complex coordinate math.

### 2. Leaf Matrix (Observable Plot / SVG)
The lowest-level containers (like Chapters or Months) are treated fundamentally differently. Each leaf container instantiates its own isolated, axis-less `Observable Plot` SVG.
- **Benefits**: Within this isolated SVG, the leaf blocks (verses) are mathematically mapped onto a 2D matrix (e.g., $x = index \pmod{10}$, $y = \lfloor index / 10 \rfloor$). 
- **Visual Impact**: By wrapping the blocks into a matrix, users can immediately estimate data density (e.g., full rows of 10 blocks) without relying on axis ticks or labels.

### Summary
This hybrid approach delegates macro-layout responsibilities to the browser (DOM/CSS) while leveraging the power of grammar-of-graphics libraries (Observable Plot) strictly for rendering the dense, data-rich micro-matrices at the leaf level.

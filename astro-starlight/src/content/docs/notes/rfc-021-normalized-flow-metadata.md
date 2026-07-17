---
title: RFC 021 - Normalized Flow Metadata
description: Proposal to optimize publication sizes and eliminate bloat by representing container and entity context via references instead of value copies.
---

# RFC 021: Normalized Flow Metadata

**Status**: Draft (Refined)  
**Date**: 2026-07-17  
**Topics**: Compiler Performance, Size Optimization, Normalized Schema, Semantic Graph, Localization  

---

## 1. Problem Statement

In the current Vyasa compilation pipeline:
1. **Container Attributes**: Structural flow commands (like `` `chapter { title="Yoga of Despondency" id="1" } ``) update the active `flow_state` (stored in `env.context`). During node enrichment, the compiler copies all key-value pairs from the flow state (e.g., `chapter.title`, `chapter.id`) into the `attributes` of **every single child AST node** (like `verse`) that is compiled under that context. This duplicates large strings across hundreds of records in the database.
2. **Entity Properties**: When an entity alias (like `` `arjuna-uvaca ``) is resolved, its properties (defined in `alias-def` or `command-def`) are merged into the block's local attributes. When these attributes are stored in the flow state, they are copied by value to subsequent blocks, duplicating entity details (such as names, lineage, or description) across every verse spoken by that entity.

This duplication breaches our **Zero Bloat** and **Publication Size Optimization** invariants, inflating the size of the final SQLite databases.

---

## 2. Proposed Design: Reference-Based Graph Normalization

To eliminate duplicate values on individual blocks, we propose migrating to a normalized reference model.

### A. Normalized Container Nodes
Instead of copying container attributes (like `title`) into subordinate blocks, we treat the container itself as a first-class node in the publication database.

1. **Bitwise Hierarchy Encoding (u64 Sequence IDs & SQLite Storage)**:
   * The internal AST only references the `relative-path` of a content block (e.g. `chapter:verse`), and these components are strongly-typed numeric values.
   * **Variable-Width Efficiency**: SQLite's `INTEGER` type is stored dynamically on disk using variable-width encoding (taking between 1 to 8 bytes depending on the value magnitude). A value that fits in 32 bits (or fewer) takes only 1, 2, or 4 bytes of disk space.
   * **Upgrading to u64 Encoder**: We will upgrade `UrnEncoder` to use `u64` (up to 60 bits, leaving 4 bits for segment modifiers like `pre`/`post` or fractional indices).
     * **Backward-Compatible TOML config**: If `bit_layout` is defined in `vyasac.toml` (e.g., `bit_layout = [4, 6, 12]`), it is fully backward-compatible and encodes into the lower bits of the `u64`.
     * **No 32-bit Constraint**: This upgrade removes the strict 32-bit limit for the sum of bit allocations, allowing deeper/wider hierarchies (e.g., `[8, 12, 16]`) for larger corpora with zero disk space penalty for simpler works.
   * **Container Addressability**: We represent parent container nodes (e.g. a chapter node) by setting the leaf components (e.g. verse) to `0` or a reserved sentinel value. This ensures parent containers have deterministic, collision-free numeric keys in the database.
   * The container's properties (like `title`, `author`) live **exclusively** on this container node in the `graph_nodes` table.

2. **Graph Hierarchy Representation**:
   * Every child node (e.g., `urn:vyasa:bg:1:1` for Verse 1) links to its parent container node (`urn:vyasa:bg:1`) via a parent-child edge in the `graph_edges` table (e.g., `CONTAINED_BY` or `PARTICIPATES_IN`).
   * To retrieve the chapter title or canton metadata, the rendering engine or viewer traverses the edge to the parent container node.

### B. Reference-only Flow State
* The compiler's `flow_state` keeps track of active container IDs and entity IDs (e.g., `chapter = "1"`, `speaker = "arjuna"`).
* It does **not** store or propagate parent container attributes (like `chapter.title`) or entity attributes (like `speaker.name`) in the block-level state.
* The local block's attributes map remains lightweight, containing only block-specific metadata.

### C. Entity Registry and Reference Edges
Instead of hashing local alias strings (which can vary, e.g., `arjuna-uvaca`, `arjuna-uvacha`), node IDs are resolved directly from the **central entity registry**.

#### Unified Rust/WASM Deterministic Hashing
* **No Database Hashing Functions**: Node and entity ID hashing is performed on the compiler-side via a deterministic Rust hasher (using `std::collections::hash_map::DefaultHasher` on the lower 63 bits of the string key).
* **Parity on Client**: Because the browser utilizes a **Unified WASM Runtime** compiled from the exact same Rust source code, the viewer hashes the string key (e.g. `"arjuna"`) using the same implementation, resulting in identical deterministic integer IDs for direct index lookups without custom SQLite functions.

#### Deterministic Entity & Action Graph Modeling
To understand how relations are modeled deterministically, consider the following example:

If an author defines:
```vyasa
`alias-def { name="arjuna-uvaca" target="uvaca" params="speaker=arjuna" }
`alias-def { name="arjuna-namaskara" target="namaskara" params="subject=arjuna" }
```
Here, `arjuna` is registered as an `Entity` and `uvaca`/`namaskara` are registered as `Actions`. When these aliases are resolved:
1. The block itself (e.g., `sequence_id` for verse `1:1`) represents the **Event Node**.
2. The block attributes store only the reference ID of the entity: `speaker = "arjuna"` or `subject = "arjuna"`.
3. The compiler performs a lookup in the Entity Registry to get the entity's unique ID, and hashes it to a deterministic integer ID: `hash_id("arjuna")`.
4. The compiler automatically inserts a relation edge in `graph_edges` from the Event block to the Entity node, using the parameter key as the role (edge type):
   * For `arjuna-uvaca`: An edge from block `1:1` to entity `hash_id("arjuna")` with role `speaker` (or `SPOKEN_BY`).
   * For `arjuna-namaskara`: An edge from block `1:2` to entity `hash_id("arjuna")` with role `subject` (or `ACTED_BY`).
5. An edge is also drawn from the block to the Action node (e.g., `uvaca` or `namaskara`) with role `action`.

This allows different actions taken by the same entity to be modeled deterministically and without terminology hardcoding.

---

## 3. Localized Stream folder Context & Build-Time Rendering

To avoid complicating the database schema or introducing performance-degrading queries in the viewer, we localize variations to the stream folders and resolve them at build time.

### A. Stream-Specific Definitions in `context.vy`
Entity and container metadata variations are kept entirely separate and declared locally in each stream's folder context (e.g., `context.vy`). This keeps content ownership clean (for instance, a translation stream that enriches a base text is managed independently).

* **`content/mula/context.vy`**:
  ```vyasa
  `entity { id="arjuna" name="अर्जुन" }
  ```
* **`content/translation/context.vy`**:
  ```vyasa
  `entity { id="arjuna" name="Arjuna" }
  ```

### B. Build-Time Container Boundaries (Group Headers, Footers, and Matter)
Containers (like `chapter` or `book`) generate their own renderable blocks in the `html_blocks`/`ir_blocks` tables **at build time**.
* The compiler evaluates templates (including RFC-018's group layouts) using the local stream folder context and bakes the localized titles directly into HTML blocks representing boundaries.
* **Viewer Impact**: The viewer loads and displays container header and footer blocks sequentially like any other block. It requires **no runtime translation lookup** or parent attribute resolution.

#### Sibling Sequence Example:
Verses are **not** nested inside the chapter block in the database. Instead, they are stored as independent sibling rows in a flat sequence. We utilize sequence ID boundary markers (lowest index for header/frontmatter, highest index for footer/backmatter):

* `sequence_id = 1:0:0` (Chapter 1 **Header/Frontmatter** block) -> content: `<h2>Chapter 1: The Yoga of Dejection</h2>`
* `sequence_id = 1:1:0` (Verse 1.1 block) -> content: `<div class="verse">...</div>`
* `sequence_id = 1:2:0` (Verse 1.2 block) -> content: `<div class="verse">...</div>`
* `sequence_id = 1:63:15` (Chapter 1 **Footer/Backmatter** block) -> content: `<div class="chapter-footer">End of Chapter 1</div>`

When loading Chapter 1, the viewer fetches all blocks where `sequence_id` matches the prefix `1:*` and renders them in order. The Chapter 1 Header is naturally rendered first, followed by the verses, and ending with the Chapter 1 Footer.

### C. Database Schema Stability & Safety

1. **Schema Structure Unchanged**:
   The physical schema of `graph_nodes` and `graph_edges` remains identical to the current implementation. The optimization is entirely in **how we populate them** (referencing rather than copying by value).
   
2. **Referential Integrity Constraints Retained**:
   While the viewer is read-only, we **retain** the `FOREIGN KEY` constraints in `view_schema.sql` for two reasons:
   * **Compiler Safety**: It serves as a build-time safety net; if `vyasac pack` makes an insertion bug (e.g. orphans), SQLite will immediately abort, catching bugs during local testing.
   * **Query Optimization**: Modern database engines (including SQLite) use foreign key definitions to perform **Join Elimination** optimizations, speeding up queries.

```sql
CREATE TABLE graph_nodes (
    id INTEGER PRIMARY KEY,
    label_id INTEGER NOT NULL,
    attributes JSON NOT NULL,
    FOREIGN KEY(label_id) REFERENCES graph_dict(id)
);

CREATE TABLE graph_edges (
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    FOREIGN KEY(type_id) REFERENCES graph_dict(id)
);
```

### D. Semantic Graph Resolution
For semantic graph queries (e.g., listing all chapters or verses spoken by an entity), the query uses the unique ID (e.g., `"arjuna"`). Localized display names of active entities are loaded once on startup from the registry, avoiding query doubling.

---

## 4. Scope-Aware Template Context (Approved)

We adopt the **Scope-Aware Template Context** model for rendering layouts:
* **How it works**: The template engine tracks active parent containers in a scope stack during rendering. Templates access parent metadata via stack lookups (e.g., `$.context.chapter.title`).
* **Why**: It guarantees **O(1) memory rendering times**, keeping viewer code synchronous and simple, while maintaining zero database bloat.

---

## 5. Build-Time Layout Validation

By processing layout specifications (such as view templates and groupings) at build time, `vyasac` validates all template variable references, hierarchy constraints, and command categories during compilation. 

This ensures that any layout specification errors (like referencing a non-existent parent variable or mismatching hierarchy levels) are caught immediately as **compiler errors/warnings at build time**, resulting in **zero runtime errors** on the client.

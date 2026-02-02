---
title: RFC 008 Graph Syntax
description: Exploring the "Graph-Native" nature of Vyasa syntax.
---

# RFC 008: From Graph to Syntax

If we assume the **Labelled Property Graph (LPG)** is the canonical source of truth, the file format becomes merely a **Serialization Format** for that graph.

## 1. The Target Graph Model (Bhagavad Gita)

We want to represent:
*   **Nodes**: `Work`, `Chapter`, `Verse`, `Speaker` (Entity).
*   **Edges**: `CONTAINS`, `SPEAKS`, `MENTIONS`.
*   **Properties**: `text`, `translation`, `index`.

### Cypher Representation
```cypher
MATCH (w:Work {id: "bg"})
MATCH (c:Chapter {id: 1})
MATCH (v:Verse {id: 1})
MATCH (s:Speaker {id: "dhritarashtra"})

CREATE (w)-[:CONTAINS]->(c)
CREATE (c)-[:CONTAINS]->(v)
CREATE (s)-[:SPEAKS]->(v)
SET v.text = "dharma-kshetre..."
```

## 2. Deriving the Syntax (The "Graph-Native" Format)

If we want a linear text format that maps 1:1 to this structure, we need:
1.  **Node Definition**: Declaring existence.
2.  **Context (Edge Implicit)**: Placing a node "inside" another implies `CONTAINS`.
3.  **Active Edge**: Declaring a relationship for subsequent nodes.

### Concept 1: The "Context Graph" (Hierarchy)
Most formatting languages handle the `CONTAINS` tree well via nesting.
```vyasa
`work bg [
  `chapter 1 [
    `verse 1 [ ... ]
  ]
]
```
*Graph Mapping*: `(Work)-[:CONTAINS]->(Chapter)-[:CONTAINS]->(Verse)`

### Concept 2: The "Interaction Graph" (Speaker)
This is where Vyasa's "Flow State" comes in. The `SPEAKS` edge is orthogonal to the `CONTAINS` hierarchy (a Verse is *in* a Chapter, but *spoken by* a generic Entity).

**Graph-Native Syntax**:
We need to "attach" an edge from an external node (Speaker) to the current stream of nodes (Verses).

```vyasa
// Declare Node
`entity dhritarashtra

// Declare Active Edge (The "Flow State")
// "From now on, (Dhritarashtra)-[:SPEAKS]->(NextNodes)"
`dhritarashtra `speaks:

`verse 1 [ ... ]
```

### Concept 3: Property Projection
The text inside the block is just a property (`text` or `content`).

```vyasa
`verse 1 {
  text="dharma-kshetre..."
  translation="On the field of dharma..."
}
```

## 3. The "Unified" Syntax

If we merge these, we get:

```vyasa
`work bg {
  `chapter 1 {
    // Edge: (Dhritarashtra)-[SPEAKS]->(...)
    `dhritarashtra `uvacha->

    `verse 1 {
      `text [ dharma-kshetre... ]
    }
    
    // Edge Shift: (Sanjaya)-[SPEAKS]->(...)
    `sanjaya `uvacha->
    
    `verse 2 { ... }
  }
}
```

## 4. Comparison with Vyasa Today

Current Vyasa is remarkably close to this "Graph-First" derivation:

1.  **Attributes** (`{ k=v }`) map directly to **Node Properties**.
2.  **Blocks** (`[ ... ]`) map directly to **Containment Edges**.
3.  **Flow State** (`entity actions`) maps directly to **Incoming Edges** for new nodes.

### The Missing Piece: Explicit Edge Types
Vyasa assumes `CONTAINS` for nesting.
It assumes `SPEAKS` (or generic `ATTRIBUTE`) for Flow State.

If we wanted to be fully graph-native, we might make the Edge Type explicit:

```vyasa
// Current
`sanjaya `uvacha `verse 1 [...]

// Explicit Graph Syntax?
`sanjaya -[uvacha]-> `verse 1 [...]
```

**Conclusion**: The current `Subject Verb Object` pattern (`sanjaya uvacha verse`) is just a syntax sugar for the graph triplet `(Sanjaya)-[:UVACHA]->(Verse)`.

### Complex Relationships (N-ary / Hyperedges)
Sometimes an interaction involves more than just Subject and Object.
*   **Example**: "Arjuna spoke to Krishna in the presence of Sanjaya at Kurukshetra".

In a graph, this is either a **Hyperedge** or a **Reified Event Node**:
`(SpeechEvent)-[:SPEAKER]->(Arjuna), -[:ADDRESSED_TO]->(Krishna), -[:WITNESS]->(Sanjaya)`

**Vyasa Syntax**:
We handle this via **Action Attributes** (equivalent to Edge Properties):
```vyasa
`arjuna `uvacha { addressed_to="Krishna" witness="Sanjaya" location="Kurukshetra" }
```
This effectively "reifies" the `uvacha` action into a rich edge that carries all the contextual metadata to the target Verse nodes.

---
title: RFC 010 Rich Context
description: Proposals for expressing people, place, and event context beyond simple speaker state.
---

# RFC 010: Rich Context (People, Place, Event)

**Status**: Implemented
**Date**: 2026-02-03
**Topics**: Context, Semantic Graph, Event Modeling

## 1. Problem Statement

Current Vyasa syntax excels at simple dialogue flow (`speaker` -> `text`), modeled as:
`(Speaker)-[:SPEAKS]->(Text)`

However, narrative often requires richer context:
1.  **Place**: Where is this happening? (e.g., "Kurukshetra", "Under the Bodhi Tree").
2.  **Time**: When is this happening? (e.g., "Day 1", "Dvapara Yuga", Absolute Timestamp).
3.  **Participants**: Who is present? (Not just the speaker and key persons, but other listeners, audience, bystanders).

Relying solely on `entity` state (`uvacha`) is insufficient because it treats the interaction as a binary Speaker-to-Text relation, ignoring the **Event** context.


> @AG: how about a distinct syntax to express subgraphs? As this augments the primary text, 
> it does not have to strictly appear like plain text in that language, but still needs to be lnguist friendly.
> Obvious candidates: `context { ... }` or `scene { ... }` or `event { ... }`. 
> Alternatively,
>  `(`krisna `uvacha `arjuna `event{ ... } `bheeshma sages warriors )`
> `(`moderator `spoke audience | mike | joan | sally)` Moderator spoke to audience and other panelists(mike, joan, ...)
> where moderator is a symbol (entity defined elsewhere) while sally is just a string.

## 2. Prior Art (RFC 008)

[RFC 008](./rfc-008-graph-syntax) (Section 4) briefly touched on this by proposing **Action Attributes**:

```text
`arjuna `uvacha { 
  addressed_to="Krishna" 
  witness="Sanjaya" 
  location="Kurukshetra" 
}
```

This effectively "reifies" the action into a Hyperedge. This RFC iterates on that concept to standardize the vocabulary and mechanics.

## 3. Proposal: The "Scene" and "Interaction" Models

We propose separating **Static Context** (Scene) from **Dynamic Interaction** (Speech/Action).

### A. The `scene` Command (Place & Time)

The `scene` command sets the stage. It persists until changed (Stateful).

```text
`scene {
  location = "Hastinapura"
  time = "Night of Day 10"
  // potentially coordinates or ISO timestamps
}
```

**Graph Model**:
`(SceneNode) <-[:HAPPENS_IN]- (AllSubsequentEvents)`

### B. Rich Interactions (People)

Instead of overloading `speaker`, we treat the communication as an **Event** where the speaker is just one role.

#### Scenario 1: Targeted Speech (Diadic)
One speaker, one listener.

```text
`uvacha {
  speaker = "Krishna"
  listener = "Arjuna"
}
```

#### Scenario 2: Group Discussion (Polyadic)
One speaker, specific group of active listeners.

```text
`uvacha {
  speaker = "Suta"
  listeners = ["Shaunaka", "Sages"]
}
```

#### Scenario 3: The "Presence" Context (Audience)
"Not all stars" (Active participants vs Passive bystanders).

```text
`state {
  active = ["Krishna", "Arjuna"]
  presence = ["Sanjaya", "Hanuman (on flag)"] 
   // 'presence' denotes people who are there but not speaking/listening primarily
}

`Krishna `uvacha -> ...
```

## 4. Proposed Syntax Options

### Option 1: Verbose Event Definition
Explicitly defining the event node.

```text
`event {
  who = ["Ram", "Lakshman"]
  where = "Forest"
  when = "Exile Year 14"
}
```

### Option 2: Flow State Attributes (Recommended)
Piggybacking on the existing flow state commands (`set-state` or specialized aliases).

```text
// Set the Scene (Persists)
`scene "Kurukshetra"

// Define the Interaction (Transient or Persistent?)
`dialogue {
  from = "Arjuna"
  to = "Krishna"
  witness = "Sanjaya"
}

`verse 1 [ ... ]
```

## 5. Iteration Areas

1.  **Inheritance**: Does changing `scene` clear the `participants`? (Likely yes, or explicit reset).
2.  **Vocabulary**: Should we standardize keys? (`geo`, `timestamp`, `audience` vs `witness`).
3.  **Visualization**: How does the PlayArea visualize "Listeners" vs "Speaker"?

## 6. Schema/Validation
We need to update `context.vy` to allow defining these attributes globally so generic validators don't warn about "unknown attribute 'location'".

```text
`schema {
  attribute `location
  attribute `time
  attribute `witness
}
```

## 5. The Subgraph Tuple Proposal (User Feedback)

A proposed alternative to "Stateful Commands" is the **Subgraph Tuple**—a distinct syntax to express the event graph explicitly.

### Syntax Concept
Using parentheses `( ... )` to define a scoped event/interaction subgraph.

```text
// Example 1: Complex Scene
( `krisna `uvacha `arjuna `event{ time="just now" } `bheeshma `sages `warriors )

// Example 2: Group Address
( `moderator `spoke `audience | `mike | `joan )
```

### Modified Proposal: The Event Header
User clarification: "This should just be a header that 'applies' to one or more text-streams".

If we treat the **Tuple** as a Command itself, we avoid ambiguity.

```text
// Syntax: `( ... ) acts as a "Structured State Setter"
`( `Krishna `uvacha `Arjuna `as "Gita-Acharya" )

`verse 1 [ ... ]
`verse 2 [ ... ]
```

**Pros**:
*   **Unambiguous**: The backtick prefix `` `( `` signals "This is a Graph Tuple", distinct from text parentheses `( ... )`.
*   **Header Semantics**: It clearly sits *above* the content blocks, governing them.
*   **Flexible**: Inside the tuple, we can mix commands (Nodes) and literals (Properties).

### Semantic Parsing Rule
When the parser encounters `` `( ... ) ``:
1.  It creates a transient **Event Node**.
2.  It parses the contents as a subgraph:
    *   `Krishna`: Subject
    *   `uvacha`: Predicate
    *   `Arjuna`: Object
    *   `as "..."`: Property/Context
3.  It sets this Event Node as the **Active Flow State** for subsequent Content Nodes.

**Update (2026-05): Native Command Enrichment**
While tuples `` `( ... ) `` offer a robust subgraph for complex interaction, the compiler's `enricher` pass has been updated to automatically derive flow state even from *standalone* commands. 
If the parser encounters `` `Krishna `uvacha `` (without the tuple):
1. It looks up the definitions of `Krishna` and `uvacha` in `context.vy`.
2. Finding `category="entity"`, it injects `speaker: "Krishna"` into the active flow state.
3. Finding `category="action"`, it injects `action: "uvacha"` into the flow state.

This makes authoring highly repetitive sequences (like the Bhagavad Gita) extremely lightweight while still producing the same rich semantic output as a tuple header.

## 6. Update (2026-07): Standalone Annotations, Notes, & Layered Frames

To allow scholars and domain experts to annotate corpora with semantic metadata (e.g., speaker attributions over verse ranges, spatial/temporal coordinates, or complex Vedic ritual frames) without modifying textual `.vy` stream files, we introduce **Standalone Annotation Overlays**.

### A. Top-Level `annotations/` Directory
Enrichments and commentaries are placed in a top-level `annotations/` directory, acting as a peer to `content/` and `templates/`:

```
workspace/
├── vyasac.toml
├── context.vy
├── content/           <-- Textual interlinear streams (mula, translation)
├── templates/         <-- HTML/View presentation templates
└── annotations/       <-- Standalone semantic graph overlays & critical notes
    ├── speakers/
    │   └── dialogue.vy
    ├── rituals/
    │   └── agnicayana.vy
    └── critical/
        └── manuscript_notes.vy
```
This cleanly separates textual content generation from semantic graph construction (`graph_nodes`/`graph_edges`).

### B. Semantic Annotations vs. Critical Manuscript Notes (`annotate` vs. `note`)

We distinguish between asserting external graph relationships and documenting textual/philological commentary:

1. **`` `annotate `` (Semantic Graph Relations)**:
   A polymorphic command used for structural, relational, or environmental assertions that map to nodes and edges in `graph_nodes` / `graph_edges`. It accepts single local targets (`"1:1"`), contiguous ranges (`"1:2..1:20"`), or arrays of targets (`["1:21", "1:24"]`):
   ```vyasa
   // Single target
   `annotate "1:1" [ `( `dhritarashtra `uvacha `sanjaya ) ]
   
   // Range target (evaluates across sequence IDs with zero bloat)
   `annotate "1:2..1:20" [ `( `sanjaya `uvacha `dhritarashtra ) ]
   ```
   *Note*: In accordance with Invariant #5 (URN Relative Paths), local workspace annotations use relative sequence tuples (`"1:1"`), never global prefixed URNs (`"urn:vyasa:bg:1:1"`).

2. **`` `note `` (Philological & Manuscript Commentary)**:
   Used for critical apparatus, manuscript damage, variant readings, and alternative interpretations. A `note` is an editorial gloss that renders directly into the reading UI (e.g., as a clickable superscript badge, footnote, or marginalia in the viewer). It can be used inline in stream files or in standalone `annotations/critical/*.vy` overlays:
   ```vyasa
   `note "4:1:12#phrase-2" { type="manuscript-damage" severity="high" } [
       Water damage obscures two syllables; two plausible interpretations exist:
       1. Ritual invocation to Agni (Sayanacharya commentary).
       2. Adhvaryu instruction to the assistant (Bhattabhaskara commentary).
   ]
   ```

### C. Layered Frames for Nested Events (`frame`)
For hierarchical rituals (such as the Yajur Veda Agnicayana altar construction), we use scoped `frame` blocks that attach parent-child or situational edges (`PARTICIPATES_IN_FRAME`, `HAPPENS_IN`) to sequence IDs:

```vyasa
`frame { id="yv-agnicayana-day-1" type="ritual-context" name="Agnicayana (Fire Altar)" } [
    `annotate "4:1:1..4:1:15" { role="invocation" priest="adhvaryu" }
    `frame { id="yv-sub-rite-ashadha" type="sub-rite" name="Ashadha Brick Oblation" } [
        `annotate "4:1:16..4:1:30" { role="oblation" deity="agni" }
    ]
]
```


# Bible Sample: Stream-based Architecture

This sample demonstrates a **Stream-based** approach to structuring content, using `reference` markers (aliased as `r`) rather than explicit containers.

## Design Rationale: Stream vs. Structure

### Why Stream-based?
The Bible is primarily a continuous narrative. While we cite it by "verse", the text often flows across verse boundaries (sentences spanning multiple verses).

**The Stream-based approach (`reference` command) is chosen here because:**
1.  **Natural Flow**: It models the document as a continuous stream of text nodes where markers (verse numbers) act as anchors, not boxes.
2.  **Authoring Efficiency**: Writing `` `r 1 `` is significantly faster and less noisy than wrapping every segment in `` `verse[ ... ] `` brackets.
3.  **Flexible Boundaries**: It easily handles prose that doesn't respect strict hierarchical structural boundaries.

### Alternative: Container-based
A **Container-based** approach (using the `verse` command) would look like:

```vyasa
`verse[
  "Do not let your hearts be troubled..."
]
```

This is better suited for data-heavy structures (like dictionaries or aphorisms) where each unit is semantically independent and might carry its own distinct metadata (e.g., meter, speaker). Use the container approach when you need to style or process each unit as a strictly isolated block.

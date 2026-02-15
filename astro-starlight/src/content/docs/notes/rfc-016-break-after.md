---
title: RFC 016 - Break-After Setting
description: A configurable setting that automatically inserts line breaks after specified Unicode characters, enabling natural rendering of Sanskrit verse punctuation and other script-specific conventions.
---

# RFC 016: Break-After Setting

## Summary

This RFC proposes a **post-parse transformer** that automatically inserts `SegmentBreak` nodes after configurable Unicode characters. The primary motivation is supporting the **Devanagari Danda** (`।`) and **Double Danda** (`॥`) as natural line-break points in Sanskrit verse content — without violating the Vyasa grammar rule that all commands begin with a backtick (`` ` ``).

## Motivation

### The Problem

Sanskrit verses (ślokas) are traditionally structured around Danda punctuation:

```
धृतराष्ट्र उवाच ।
धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।
मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥
```

- **`।`** (U+0964, Devanagari Danda) — marks the end of a half-verse (pāda)
- **`॥`** (U+0965, Devanagari Double Danda) — marks the end of a full verse

Currently, authors must use the pipe `|` character to create line breaks, which is foreign to the script and requires manual intervention. Ideally, authors should be able to write natural Devanagari text, and the compiler should understand that these punctuation marks imply line breaks.

### Design Constraint

The Vyasa grammar maintains a clean rule: **all commands begin with `` ` ``**. The pipe `|` is the sole exception as a structural break character. Adding more special characters to the parser would erode this consistency. Instead, we handle this at the **transformer** level — after parsing, before projection.

## Proposed Solution

### Configuration

A new `break_after` setting accepts a string of characters. Each character in the string will trigger a `SegmentBreak` node to be inserted after it in text content.

```vy
'set settings { break_after = "।॥" }
```

This is typically placed in the workspace's root `context.vy` or a folder-level `context.vy`.

### Transformer Behavior

A post-parse pass scans all `Text` nodes. When a character from `break_after` is found:

1. The text is split at that character
2. The character itself is **preserved** in the preceding text fragment
3. A `SegmentBreak` node is inserted after it

**Example**: Given `break_after = "।॥"` and input text:

```
धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः । मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥
```

The transformer produces:

```
Text("धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः । ")
SegmentBreak
Text("मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥")
SegmentBreak
```

### Rendering

Backends render `SegmentBreak` as they already do:
- **HTML**: `<br />`
- **JSON**: Preserved as a structural node
- **SQLite**: Segment boundary marker

The Danda characters appear in the output text as normal punctuation. The `SegmentBreak` simply adds the visual line break.

## Applicability Beyond Sanskrit

The setting is intentionally **script-neutral**. Examples for other traditions:

| Script | Characters | Unicode | Use Case |
|--------|-----------|---------|----------|
| Devanagari | `।` `॥` | U+0964, U+0965 | Sanskrit/Hindi verse endings |
| CJK | `。` | U+3002 | Chinese/Japanese sentence endings |
| Tibetan | `།` | U+0F0D | Tibetan shad (verse marker) |
| Thai | `ฯ` | U+0E2F | Thai abbreviation/pause mark |

## Implementation Plan

### Files to Modify

1. **`config.rs`** — Parse the `break_after` setting from `'set settings { ... }` and store it in `VyasaEnvironment`
2. **`models.rs`** — Add `break_after: Option<String>` to `VyasaEnvironment`
3. **`transformer.rs`** (or new module) — Implement the text-splitting pass that runs after parsing and config processing
4. **Pipeline integration** — Insert the transformer into the compilation pipeline between parsing and projection

### Execution Order

```
Parse → Config (set commands) → Break-After Transform → Projection → Backend
```

The transformer must run **after** config processing (so `break_after` is available) and **before** projection (so templates see the `SegmentBreak` nodes).

## Edge Cases

1. **Consecutive break characters**: `॥।` → Two breaks emitted, one after each character
2. **Break character at end of text**: Still emits a `SegmentBreak` after it (the backend handles trailing breaks gracefully)
3. **Break character inside commands**: Only `Text` nodes are scanned; command names, attributes, and arguments are untouched
4. **Interaction with `|`**: The pipe remains a pure structural break (consumed, invisible in output). `break_after` characters are preserved in output. Both produce `SegmentBreak` nodes

## Status

**Draft** — Approved for implementation.

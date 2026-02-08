---
title: Vyasa Grammar
description: Formal specification of the Vyasa language syntax.
---

This document describes the formal grammar of the Vyasa language. It serves as the authoritative reference for parser implementation and tooling.

## Notation
The grammar is specified using Extended Backus-Naur Form (EBNF).

## Lexical Structure

```ebnf
/* Basic Character Sets */
Digit          ::= [0-9]
Alpha          ::= [a-zA-Z]
Alphanumeric   ::= Alpha | Digit

/* Identifiers */
/* Used for command names, attribute keys */
Identifier     ::= Alpha ( Alphanumeric | "_" | "-" )*

/* Values */
/* Used for command arguments, unquoted attribute values */
ValueString    ::= ( Alphanumeric | "_" | "." | ":" | "-" | "/" )+
```

## Syntax

```ebnf
Document       ::= Node*

Node           ::= Comment 
                 | Command 
                 | SegmentBreak 
                 | Text

/* Comments */
Comment        ::= LineComment | BlockComment
LineComment    ::= "`" (" " | "\t") [^\n]*
BlockComment   ::= "`[" .*? "]"

/* Commands */
Command        ::= "`" Identifier 
                   (Space Argument)? 
                   Space? Delimiter? 
                   Space? Attributes? 
                   Space? Children?

Argument       ::= ValueString
Delimiter      ::= ";" Identifier

/* Attributes */
Attributes     ::= "{" AttributeMap "}"
AttributeMap   ::= (Pair (","? Space? Pair)*)? ","?
Pair           ::= Identifier Space? "=" Space? Value
Value          ::= QuotedString | NestedValue | ValueString

QuotedString   ::= '"' ( [^"\\] | "\\" . )* '"'
NestedValue    ::= "{" [^}]* "}"

/* Children Block */
Children       ::= "[" Node* Terminator? "]"
Terminator     ::= "]" Identifier  /* Must match the Delimiter Identifier */

/* Structural Elements */
SegmentBreak   ::= "|"

/* Text */
Text           ::= ( [^`|\[\]\\] | EscapedChar )+
EscapedChar    ::= "\\" .
```

## Special Characters & Escaping

Vyasa reserves the characters `` ` ``, `|`, `[`, `]`, `\`, `{`, `}` for syntax.

- **Escaping**: Any character can be treated as literal text by prefixing it with a backslash `\`.
  - Example: `` \` `` becomes a literal backtick.
  - Example: `` \| `` becomes a literal pipe.

- **Robustness**: The parser attempts to be robust. If a special character (like `` ` `` or `]`) is encountered in a context where it does not form a valid command or structure, it is treated as literal text.
  - Example: `` `( `` parses as a literal backtick followed by `(`.
  - **Note**: A backtick followed by a space or tab is parsed as a **Comment**.
  - Example: `` ` This is a comment ``

## Examples

### Basic Command
```text
`preface { title="Foreword" } [
  This is the preface text.
]
```

### Command with Argument
```text
`chapter 1 { title="Obsfervation" }
```

### Delimited Blocks (Polymorphic closing)
```text
`div;mybox [
  Content inside the box.
]mybox
```

### Nested Attributes
```text
`set entities { 
  krishna={ type="person", bio="The Supreme Personality of Godhead" } 
}
```

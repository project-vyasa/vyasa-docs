---
title: "RFC A001: Database Applications Domain"
description: Proposal to introduce a new domain for defining database applications using existing language constructs.
created: "2025-12-25"
---

## RFC A001: Database Applications Domain

**Status**: Proposed
**Date**: 2025-12-25
**Topics**: Syntax, Domains, Database, UI, Reporting

## Context
Initially, the Vyasa language will focus on annotating scriptural content and managing related data structures (like graphs and projections). In future, we will expand its capabilities to **Database Application** domain, to define custom applications e.g. directory of scriptural content.

This domain will allow users to define:
1.  **Schema**: Data structures - tables, fields, relationships (defined using `ref` and `contain` directives).
2.  **UI Layout**: How data is presented and interacted with - forms, grid definitions, ...
3.  **Report**: How data is extracted, aggregated, and presented in various formats - tabular, cards, document etc.
4. **Application**: Used to manage a subset of schema, UI, reports and so on.
5. **AppSpace**: A collection of applications and shared resources.
6. **Partitions**: Federate curation of data by independent teams while conforming to shared schema, UI and reports.

**Core tenet**: Use the **same language constructs** as for scriptural content to provide familiarity for users and reuse capabilities.

## Proposal

This document only proposes the high-level structure and concepts, loosely using a medley of languages. 


### 1. Schema Definition

```typescript
// BaseItem is an illustration of a record in a table.

type BaseItem = { 
  _id: string; // synthetic primary key, UUID
  key: string; // natural key, unique identifier of the record inthe table
  phrase: string; // used in heading where space is limited
  sentence: string; // e.g. item header in a report may have room for a line or two
  paragraph: string; // narrative text about the item.
};

enum FieldType {
  string;
  int;
  float;
  boolean;
  date;
  time;
  datetime;
  duration;
  json;
  map;
}

enum EntityRelationship {
  contains; // contained-entity shares same lifecyle, no independent identity, 
  reference; // referenced-entity has independent identity and lifecycle, maybe referenced by other entities.
}

type SystemFields = {
  _id: string // synthetic primary key, UUID
  _partition_id: string // partition id, assigned to an organization-unit for an appspace
  _created_at: datetime // timestamp when the record was created
  _updated_at: datetime // timestamp when the record was last updated
}

enum SystemTables {
  _partitions; // Partition definition - who curates what data
  _schemas; // entity(table), form, grid, report, etc.
  _enums; // enum definitions for in-memory lookup
  _meta;  // Appspace metadata, build metadata per partition 
  _assets; // Default style sheets, default theme and so on
}

enum EntityFieldAnnotations {
  key; // field is primary key for the entity, thus required
  required; // field is required when creating or updating a record
  phrase;
  sentence;
  paragraph;
  // Relationships
  reference; //
  contains;
  // Display
  format;
  display;
  // UI hints
  label;
  tooltip;
  placeholder;
  // Validations and transforms TODO guard vs ensure vs validate vs..?
  validate; // pipeline of validations to run on the field value
}
```

```rust
// Rustic illustration of DSL for entity (table) definition

entity Country {
  code: string @key // natural key e.g. 'US', 'IN'
  name: string @phrase // "United States", "India"
  population: int @required
  summary: string @sentence
  description: string @paragraph
  
  @contains: State

}
entity State {
  abbr: string @key @validation[length(2) | uppercase] // e.g. 'CA', 'TX'
  name: string @phrase // "California", "Texas"
  summary: string @sentence // e.g. ""
  description: string @paragraph @format[markdown] @display[lines(4)]// e.g. ""
  @reference: Country
}

// Additional syntax to avoid repetitiion

entity Planet {
  name: string @key @label[Planet Name] 
  diameter: int @label[Diameter (km)]
  rotation_period: int @label[Rotation Period (hours)]
  orbital_period: int @label[Orbital Period (days)] @placeholder[days] @tip[Time it takes for the planet to complete one orbit around the sun]
  
  @reference: Moon
}

entity Moon {
  name: string @key
  diameter: int
  orbital_period: int
  
  @reference: Planet
}

enum status @label[Execution Status]{
  notstarted = 0 [label: "Not Started", color: "gray", icon: "circle"]
  in_progress = 1 [label: "In Progress", color: "blue", icon: "circle-dashed"]
  completed = 2 [label: "Completed", color: "green", icon: "check"]
  failed = 3 [label: "Failed", color: "red", icon: "x-red"]
  cancelled = 4 [label: "Cancelled", color: "red", icon: "circle-x"]
  on_hold = 5 [label: "On Hold", color: "yellow", icon: "pause"]
}

```

### 2. UI Layout Definition
A grid to efficiently show rows in a table, usually stacked on top of a form view. A list is a variant of grid suitable when the form needs the full height of the window. A form-view is used to view or update the details of one row selected in the grid or list.

#### 3.1 Layout components
*   `form`: used for data entry and updating.
*   `grid`: used for efficiently showing rows in a table
*   `list`: used for showing items in a vertical list


```rust

// Grid with the same name as the entity is the default grid for the entity!
grid EntitySummaryGrid {
  entity: EntityName
  sort: fieldname asc
  
  field1 [width: "10%", header: "Column 1"]
  field2 [format: "percentage"]
  field3 [width: "auto"]
}

// 
form FormName {
  entity: EntityName
  width: 3 // abstract unit mapped to a 12 column grid
  label: "Form Name" // optional

  section[Section1] {
    field1, field2, field3
    field4(span: 2), field5
    field6 // spans entire row, equivalent to span:3 since the form width is 3
  }
  section[System Fields] {
    _id, _created_at, _updated_at // All in one row.
  }
  
}

```

### 3. Report Definition

#### 3.1 Report layout options
*   `grid`: Traditional, tabular format.
*   `card`: A view of a single record or summarized data in a card format, with 1-few cards per row
*   `doc`: Presents a document like visual treatment flow of content, may be pasted to Word or Google Docs for further collaboration.

```rust

report ReportName {
  entity: EntityName
  layout: grid // or card or doc 
  record: layout {
    field1, field2, field3 // field row 1
    field4 // field row 2
  } header { // Item header e.g. sentence field. or interpolated from multiple fields
    `${field1}: ${field2}`
  }
  label: "Report Name" // optional
  sort: field0 asc
  filter: [field0 == "value"]
  group[field1] {
    sort: desc
    header: "Outer Group Header with interpolation, aggregation and more "
    group [field2] {
      sort: asc
      header: "Inner Group Header with interpolation, aggregation and more "
      footer: "Inner Group Footer with interpolation, aggregation and more "
    }
    footer: "Outer Group Footer with interpolation, aggregation and more "
  }
  style: sheetname // for doc layouts
}

```


## Next Steps
This RFC serves as the foundation for the "Database Applications" domain. We need to iteratively refine the exact syntax and how these concepts map to our internal AST and projection systems.

1.  Flesh out the exact syntax for schema, layout, and report definitions.
2.  Determine how these definitions are compiled and projected (e.g., into SQL schema definitions, JSON schemas, UI component configurations).
3.  Create example use cases to validate the proposed language constructs against real-world database application requirements.

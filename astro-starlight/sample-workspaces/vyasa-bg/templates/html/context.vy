// Simplified View Body Projection — devanagari and iast only
`set meta { stream="mula" }
`body [ 
    `dhritarashtra `sanjaya `arjuna `krishna `uvacha 
    `verse 
]

// Generic Entity Templates
`dhritarashtra [
    `div { class="entity-header" } [ $.entities.dhritarashtra.label ]
]
`sanjaya [
    `div { class="entity-header" } [ $.entities.sanjaya.label ]
]
`arjuna [
    `div { class="entity-header" } [ $.entities.arjuna.label ]
]
`krishna [
    `div { class="entity-header" } [ $.entities.krishna.label ]
]

// Uvacha Wrapper
`uvacha [
    `div { class="uvacha-label" } [ $.labels.uvacha ]
    $.body
]

// Verse Container
`verse [
    `div { class="verse-content" } [
        `div { class="$.stream" } [ $.body ]
    ]
]

// Devanagari block
`devanagari [
    `div { class="devanagari" } [ $.body ]
]

// IAST block
`iast [
    `div { class="iast" } [ $.body ]
]

// Formatting helpers
`ref [ `a { href="$.argument" } [ $.body ] ]
`e1 [ `strong [ $.body ] ]
`e2 [ `em [ $.body ] ]

`stream [
    `div { "data-vyasa-stream"=$.ref class="stream-slot" } []
]

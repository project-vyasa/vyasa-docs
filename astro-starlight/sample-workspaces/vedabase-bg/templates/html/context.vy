// Default View Body Projection (Order of rendering)
`body [ 
    `dhritarashtra `sanjaya `arjuna `krishna `uvacha 
    `verse 
    `synonyms 
    `translation 
    `purport 
]

`verse [
    `div { class="verse-box" } [
        `div { class="verse-ref" } [ Verse $.argument ]
        `div { class="verse" } [ $.text ]
    ]
]



`synonyms [
    `div { class="synonyms-box" } [
        `div { class="section-title" } [ Synonyms ]
        $.text
    ]
]

`term [
    `div { class="synonym-term" } [ $.text ]
]

`meaning [
    `div { class="synonym-meaning" } [ $.text ]
]

`translation [
    `div { class="translation-box" } [
        `div { class="section-title" } [ Translation ]
        `p [ $.text ]
    ]
]

`command-def { name="purport" whitespace="preserve" category="content" }
`purport [
    `div { class="purport-box" } [
        `div { class="section-title" } [ Purport ]
        `p [ $.text ]
    ]
]

`devanagari [
    `div { class="devanagari" } [ $.text ]
]

`iast [
    `div { class="iast" } [ $.text ]
]

// Speakers
`dhritarashtra [
    `div { class="entity-header" } [
        `div { class="entity-name-dev" } [ $.entities.dhritarashtra.label_dev ]
        `div { class="entity-name-iast" } [ $.entities.dhritarashtra.label_iast ]
    ]
]
`sanjaya [
    `div { class="entity-header" } [
        `div { class="entity-name-dev" } [ $.entities.sanjaya.label_dev ]
        `div { class="entity-name-iast" } [ $.entities.sanjaya.label_iast ]
    ]
]
`arjuna [
    `div { class="entity-header" } [
        `div { class="entity-name-dev" } [ $.entities.arjuna.label_dev ]
        `div { class="entity-name-iast" } [ $.entities.arjuna.label_iast ]
    ]
]
`krishna [
    `div { class="entity-header" } [
        `div { class="entity-name-dev" } [ $.entities.krishna.label_dev ]
        `div { class="entity-name-iast" } [ $.entities.krishna.label_iast ]
    ]
]

// Pass-through structural commands
`uvacha [
    $.text
]

`e1 [
   `strong [ $.text ]
]
`e2 [
   `em [ $.text ]
]
`ref [
    `a { href="$.argument" } [ $.text ]
]

`verse [
    `div { class="verse-box" } [
        `div { class="verse-ref" } [ Verse $.argument ]
        `div { class="verse" } [ $.text ]
    ]
]

`v [
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
    `span { class="entity-name" } [ Dhṛtarāṣṭra ]
]
`sanjaya [
    `span { class="entity-name" } [ Sañjaya ]
]
`arjuna [
    `span { class="entity-name" } [ Arjuna ]
]
`krishna [
    `span { class="entity-name" } [ Kṛṣṇa ]
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

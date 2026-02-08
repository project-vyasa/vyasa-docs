// Domain Definitions for Bhagavad Gita
`command-def { name="devanagari" category="content" }
`command-def { name="iast" category="content" }
`command-def { name="synonyms" category="content" }
`command-def { name="term" category="content" }
`command-def { name="meaning" category="content" }
`command-def { name="translation" category="content" }
`command-def { name="purport" whitespace="preserve" category="content" }

`alias-def { name="v" target="verse" }


// Entities with display labels
`command-def { name="dhritarashtra" category="entity" }
`command-def { name="sanjaya" category="entity" }
`command-def { name="arjuna" category="entity" }
`command-def { name="krishna" category="entity" }

// Entity Registry: Speaker display labels
`set entities {
    dhritarashtra = { label_dev = "धृतराष्ट्र उवाच" label_iast = "dhṛtarāṣṭra uvāca" }
    sanjaya = { label_dev = "सञ्जय उवाच" label_iast = "sañjaya uvāca" }
    arjuna = { label_dev = "अर्जुन उवाच" label_iast = "arjuna uvāca" }
    krishna = { label_dev = "श्रीभगवानुवाच" label_iast = "śrī-bhagavān uvāca" }
}

// Actions
`command-def { name="uvacha" category="action" }

`set context { 
    urn_scheme = "work:bg:{chapter}:{id}"
    verse_scheme = "verse:bg:{chapter}:{id}"
}

// --- Native Templates for HTML (Replicating gita.hbs) ---

`template `verse `for "html" {
    `div { class="header" } [
        `div { class="verse-ref" } [ Verse $.argument ]
    ]
    `div { class="verse" } [ $.text ]
}

`template `synonyms `for "html" {
    `div { class="synonyms-box" } [
        `div { class="section-title" } [ Synonyms ]
        $.text
    ]
}

`template `term `for "html" {
    `div { class="synonym-term" } [ $.text ]
}

`template `meaning `for "html" {
    `div { class="synonym-meaning" } [ $.text ]
}

`template `translation `for "html" {
    `div { class="translation-box" } [
        `div { class="section-title" } [ Translation ]
        `p [ $.text ]
    ]
}

`template `purport `for "html" {
    `div { class="purport-box" } [
        `div { class="section-title" } [ Purport ]
        `p [ $.text ]
    ]
}

`template `devanagari `for "html" {
    `div { class="devanagari" } [ $.text ]
}

`template `iast `for "html" {
    `div { class="iast" } [ $.text ]
}

// Speakers
`template `dhritarashtra `for "html" {
    `span { class="entity-name" } [ Dhṛtarāṣṭra ]
}
`template `sanjaya `for "html" {
    `span { class="entity-name" } [ Sañjaya ]
}
`template `arjuna `for "html" {
    `span { class="entity-name" } [ Arjuna ]
}
`template `krishna `for "html" {
    `span { class="entity-name" } [ Kṛṣṇa ]
}

// Pass-through structural commands
// uvacha just wraps verses/speakers. We unwrap it to flatten into parent.
`template `uvacha `for "html" {
    $.text
}

`template `e1 `for "html" {
   `strong [ $.text ]
}
`template `e2 `for "html" {
   `em [ $.text ]
}

`title [Bhagavad Gita]

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

// URN scheme is now defined in vyasac.toml [urn] section
// Legacy context-based scheme kept for reference:
// `set context { urn_scheme = "work:bg:{chapter}:{id}" }

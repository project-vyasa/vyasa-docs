
`title [Bhagavad Gita]

`set settings {
    default_whitespace = "single"
    break_after = "।॥"
}

// Common Semantic Definitions
// TODO: We must support a reference to another publication in the corpus text which manifests as a HTML link. In this case, a full URN path is required.`command-def { name="ref" category="content" args="urn" }`command-def { name="devanagari" category="content" }
`command-def { name="iast" category="content" }
`command-def { name="synonyms" category="content" }
`command-def { name="term" category="content" args="iast" }
`command-def { name="meaning" category="content" }
`command-def { name="translation" category="content" }
`command-def { name="purport" whitespace="preserve" category="content" }

`alias-def { name="v" target="verse" }

// Common Entities (Generic)
`command-def { name="e1" category="content" }
`command-def { name="e2" category="content" }
`command-def { name="sanjaya" category="entity" }
`command-def { name="arjuna" category="entity" }
`command-def { name="krishna" category="entity" }
`command-def { name="dhritarashtra" category="entity" }

// Action
`command-def { name="uvacha" category="action" }

`set entities {
  "arjuna" = "{ type=\"person\" }"
  "dhṛtarāṣṭra" = "{ type=\"person\" }"
  "mahī-kṣitām" = "{ type=\"person\" }"
  "sañjaya" = "{ type=\"person\" }"
  "śrī-bhagavān" = "{ type=\"person\" }"
  "Kurukṣetra" = "{ type=\"place\" }"
}

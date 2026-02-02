// Domain Definitions for Bhagavad Gita
`command-def { name="devanagari" category="content" }
`command-def { name="iast" category="content" }
`command-def { name="synonyms" category="content" }
`command-def { name="term" category="content" }
`command-def { name="meaning" category="content" }
`command-def { name="translation" category="content" }
`command-def { name="purport" category="content" }

`alias-def { name="v" target="verse" }


// Entities
`command-def { name="dhritarashtra" category="entity" }
`command-def { name="sanjaya" category="entity" }
`command-def { name="arjuna" category="entity" }
`command-def { name="krishna" category="entity" }

// Actions
`command-def { name="uvacha" category="action" }

`set context { 
    urn_scheme = "work:bg:{chapter}:{id}"
    verse_scheme = "verse:bg:{chapter}:{id}"
}

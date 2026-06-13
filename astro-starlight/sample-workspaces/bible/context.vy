// Domain Definitions for Bible
// v is an inline verse-number marker (NOT a URN; bible chapters are the URN unit)
`command-def { name="v" args="id" category="content" }
`command-def { name="wj" category="content" }
`command-def { name="chapter-title" category="structure" }

// Native Templates

// Verse number: superscript in muted color, inline with text
`template `v `for "html" {
   `span { class="verse" } [
       `span { class="verse-num" } [
          $.argument
       ]
       $.body
   ]
}

`template `wj `for "html" {
   `span { class="wj" } [ $.body ]
}

`template `break `for "html" {
   `br
}

`template `chapter-title `for "html" {
   `h2 { class="chapter-title" } [ $.body ]
}


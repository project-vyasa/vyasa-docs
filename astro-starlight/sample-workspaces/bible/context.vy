// Domain Definitions for Bible
`command-def { name="wj" category="content" }
`alias-def { name="v" target="verse" }

// Native Templates
`template `verse `for "html" {
   `span { class="verse-num" } [
      `strong [ $.argument ]
   ]
   $.text
}

`template `wj `for "html" {
   `span { class="wj" } [ $.text ]
}

`template `break `for "html" {
   `br
}

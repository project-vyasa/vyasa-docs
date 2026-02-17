
`html { lang="en" } [
    `head [
        `meta { charset="UTF-8" }
        `meta { name="viewport" content="width=device-width, initial-scale=1.0" }
        `title [ Bhagavad Gita - Reading View ]
        `link { href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" }
        `link { href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@100..900&display=swap" rel="stylesheet" }
        `style [
            body { font-family: 'Noto Serif', serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #fdfdfd; color: #333; }
            h1 { text-align: center; color: #d35400; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
            .verse-container { border-bottom: 1px solid #eee; padding: 40px 0; }
            .verse-header { margin-bottom: 20px; }
            .verse-id { font-size: 1.2rem; font-weight: bold; color: #7f8c8d; }
            
            .verse-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr 1fr; 
                gap: 40px; 
            }
            
            @media (max-width: 900px) {
                .verse-grid { grid-template-columns: 1fr; gap: 20px; }
            }

            .column-header { 
                font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; 
                color: #999; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;
            }

            .mula { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 1.2rem; line-height: 1.8; }
            .transliteration { font-style: italic; color: #555; }
            .translation { line-height: 1.6; }
            
            /* Hide internals if leaked */
            .entity-header, .uvacha-label { display: inline-block; font-weight: bold; margin-right: 5px; }
            .entity-header::after { content: " "; }
        ]
    ]
    `div { class="reading-body" } [
        `h1 [ Bhagavad Gita As It Is ]
        
        `div { class="verse-list" } [
            `each urns [
                `div { class="verse-container" } [
                     `div { class="verse-header" } [
                        `div { class="verse-id" } [ Verse $.id ]
                     ]
                     `div { class="verse-grid" } [
                         `div { class="column mula-col" } [
                             `div { class="column-header" } [ Sanskrit ]
                             `div { class="mula" } [ $.mula.body ]
                         ]
                         `div { class="column iast-col" } [
                             `div { class="column-header" } [ Transliteration ]
                             `div { class="transliteration" } [ $.iast.body ]
                         ]
                         `div { class="column en-col" } [
                             `div { class="column-header" } [ Translation ]
                             `div { class="translation" } [ $.en.body ]
                         ]
                     ]
                ]
            ]
        ]
    ]
]

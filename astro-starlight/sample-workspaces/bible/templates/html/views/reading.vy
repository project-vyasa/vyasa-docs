`layout [
`title [The Holy Bible]

`link { href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" }

`style [
    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .reading-body {
        margin: 2rem auto;
        max-width: 650px;
        padding: 0 1rem;
        line-height: 1.75;
        font-size: 1.05rem;
        color: #1a1a1a;
    }
    .chapter-title {
        font-size: 2.2rem;
        margin-bottom: 1.5rem;
        color: #2c3e50;
        font-weight: 700;
        display: block;
    }
    h1 {
        font-size: 1.05rem;
        font-weight: bold;
        color: #333;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
    }
    .verse-num {
        font-size: 0.7em;
        vertical-align: super;
        color: #999;
        margin-right: 0.2em;
        font-weight: bold;
        line-height: 0;
    }
    .verse {
        margin-right: 0.35em;
    }
    .wj {
        color: #c0392b;
    }
    br { display: block; margin-top: 0.75em; }
]

`div { class="reading-body" } [
    {{ body }}
]
]

`item [
`stream { ref="primary" }
]

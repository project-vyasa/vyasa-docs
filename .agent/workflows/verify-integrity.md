---
description: Verify the integrity of Vyasa projects and samples to prevent regressions.
---

1. Build and Test Compiler
   - cd /Users/anand/Projects/project-vyasa/vyasa/vyasac
// turbo
   - cargo build --release
// turbo
   - cargo test
// turbo
   - wasm-pack build --target web
   - rm -rf /Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight/src/pkg
   - cp -R pkg /Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight/src/pkg

2. Build Samples and Documentation
   - cd /Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight
   - export PATH=/Users/anand/Projects/project-vyasa/vyasa/vyasac/target/release:$PATH
// turbo
   - npm install
// turbo
   - npm run build-samples
// turbo
   - npm run build

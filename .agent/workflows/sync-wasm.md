---
description: Sync vyasac WASM build to astro-starlight docs
---
# Sync Vyasac WASM to Docs

This workflow builds the `vyasac` Rust project to WebAssembly and updates the `astro-starlight` documentation site with the new binary.

## Prerequisites
- `wasm-pack` must be installed (`cargo install wasm-pack`).

## Steps

1.  Navigate to `vyasac` directory.
    ```bash
    cd /Users/anand/Projects/project-vyasa/vyasa/vyasac
    ```

2.  Build WASM package (target: web).
    ```bash
    wasm-pack build --target web
    ```

3.  Remove old package from `astro-starlight`.
    ```bash
    rm -rf /Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight/src/pkg
    ```

4.  Copy new package to `astro-starlight`.
    ```bash
    cp -R pkg /Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight/src/pkg
    ```

5.  (Optional) Verify by running the dev server.
    ```bash
    cd /Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight
    npm run dev
    ```

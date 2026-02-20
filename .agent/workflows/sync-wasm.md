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

3.  Run the build command (from project root):
    ```bash
    cd vyasa/vyasac
    wasm-pack build --target web --out-dir ../../vyasa-docs/astro-starlight/src/vyasac-wasm
    ```

    (Note: You may need to clean first if you encounter errors)
    ```bash
    cargo clean
    ```

5.  (Optional) Verify by running the dev server.
    ```bash
    cd /Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight
    npm run dev
    ```

---
title: Monorepo Context Architecture
description: Resolving Svelte 5 context loss across workspace boundaries
---

# Monorepo Svelte 5 Context Boundary Architecture

This document summarizes the root cause of the "missing AppHeader context" issue we encountered, and outlines best practices for our build setup and component design moving forward in the `vyasa-ui` and `vyasa-apps` ecosystem.

## The Root Cause: Svelte 5 `svelte-package` Context Loss

The core issue was a combination of how Svelte 5 currently handles the Context API across package boundaries, and how Vite resolves the Svelte runtime in a monorepo workspace.

1. **Vite Runtime Duplication**: When running `bun run dev` in `vyasa-apps/apps/platform`, Vite initially spun up two separate instances of the Svelte runtime—one for the `platform` app code, and one for the pre-packaged `@project-vyasa/vyasa-ui` code in `node_modules`. 
2. **Context Map Isolation**: Because the runtimes were duplicated, `setContext('theme')` in the `platform` app's component tree saved the context to one map, while `getContext('theme')` inside the compiled `AppHeader.svelte` looked for the context in a different, isolated map. This caused `themeCtx` to silently evaluate to `undefined`.
3. **Snippet Scoping**: In Svelte 5, snippets capture context from their *declaration site* (in this case, `PlatformShell`), but when executing inside a component from a different package (`AppShell`), the context boundary could not be traversed correctly due to the runtime duplication.

## Build Setup Changes

To prevent this class of bugs permanently, the following build configuration rule must be enforced across all Svelte applications in the monorepo.

### 1. Unified Svelte Runtime via Vite Deduplication

Any Vite application (e.g. `vyasa-apps/apps/platform`) that consumes a local workspace Svelte package MUST explicitly instruct Vite to deduplicate Svelte. This forces Vite to use a single runtime tree across all workspace boundaries.

**Requirement in `vite.config.ts`**:
```typescript
export default defineConfig({
	resolve: {
		dedupe: ['svelte'] // Critical for Context API across workspace packages
	},
	optimizeDeps: {
		exclude: ['@project-vyasa/vyasa-ui']
	}
});
```

## Component Design Changes

While Vite deduplication solves the runtime split, components published via `svelte-package` should be designed to be resilient to context loss. 

### 1. Explicit Prop Fallbacks for Context (Dependency Injection)

When building core layout components in `vyasa-ui` that rely on Context API (like `AppHeader`, `ActivityBar`, etc.), always allow the consumer to pass the context explicitly via a prop as an "escape hatch". 

**Example Implementation (already applied to AppHeader)**:
```svelte
<script lang="ts">
	interface Props {
		// ...
		themeContext?: any; // Escape hatch for cross-package context loss
	}
	let { themeContext }: Props = $props();

	// Priority: Explicit Prop > Fallback Context
	const defaultThemeCtx = getContext<any>('theme');
	const themeCtx = $derived(themeContext || defaultThemeCtx);
</script>
```

### 2. Extensible Snippet Slots

Avoid hardcoding the right or left sides of foundational layout components if they contain business logic. Exposing named snippets allows consuming apps to inject custom buttons without needing to fork the component. 

**Example (already applied to AppHeader)**:
```svelte
<script lang="ts">
	interface Props {
		// ...
		headerRight?: import('svelte').Snippet;
	}
</script>

<div class="header-right">
	{@render headerRight?.()} <!-- Allows platform app to inject custom actions -->
</div>
```

## Summary

The architecture is now extremely robust. 
- `vyasa-apps/apps/platform` uses Vite deduplication and explicit prop injection (`themeContext={themeContext}`) to ensure the `AppHeader` renders perfectly. 
- `vyasa-ui`'s `AppHeader` is now safely encapsulated and resilient to monorepo dev-server edge cases. 
- All custom theme buttons were successfully removed from `ViewerAppBar.svelte`, restoring clean separation of concerns.

<script lang="ts">
    import { createEventDispatcher } from "svelte";

    // Props
    const { files = [], selectedFile = "" } = $props();

    // Dispatcher
    const dispatch = createEventDispatcher();

    function selectFile(file: string) {
        dispatch("select", file);
    }

    function getIcon(filename: string) {
        if (filename.endsWith(".vy")) return "📄";
        if (filename.endsWith(".toml")) return "⚙️";
        if (filename.endsWith(".html")) return "🌐";
        if (filename.endsWith(".css")) return "🎨";
        if (filename.endsWith(".js")) return "📜";
        return "📃";
    }

    // Sort files: vyasac.toml first, then context.vy, then others alphabetically
    let sortedFiles = $derived(
        [...files].sort((a, b) => {
            if (a === "vyasac.toml") return -1;
            if (b === "vyasac.toml") return 1;
            if (a === "context.vy") return -1;
            if (b === "context.vy") return 1;
            return a.localeCompare(b);
        }),
    );
</script>

<div class="file-explorer">
    <div class="header">FILES</div>
    <div class="list">
        {#each sortedFiles as file}
            <button
                class="file-item"
                class:selected={file === selectedFile}
                onclick={() => selectFile(file)}
            >
                <span class="icon">{getIcon(file)}</span>
                <span class="name">{file}</span>
            </button>
        {/each}
        {#if files.length === 0}
            <div class="empty">No files loaded</div>
        {/if}
    </div>
</div>

<style>
    .file-explorer {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--sl-color-gray-6);
        border-right: 1px solid var(--sl-color-hairline);
        font-size: 0.9rem;
    }

    .header {
        padding: 0.5rem 1rem;
        font-weight: bold;
        font-size: 0.75rem;
        color: var(--sl-color-gray-3);
        letter-spacing: 0.05em;
        background: var(--sl-color-gray-5);
    }

    .list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0;
    }

    .file-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.3rem 1rem;
        border: none;
        background: transparent;
        color: var(--sl-color-text);
        text-align: left;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.1s;
    }

    .file-item:hover {
        background: var(--sl-color-gray-5);
    }

    .file-item.selected {
        background: var(--sl-color-accent-low);
        color: var(--sl-color-white);
        border-left: 3px solid var(--sl-color-accent);
        padding-left: calc(1rem - 3px); /* Adjust for border */
    }

    .icon {
        opacity: 0.8;
        font-size: 1rem;
    }

    .empty {
        padding: 1rem;
        color: var(--sl-color-gray-4);
        font-style: italic;
        text-align: center;
    }
</style>

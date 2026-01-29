<script lang="ts">
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    // Props with bindings where appropriate
    let {
        iframeSrc = "",
        outputFiles = [] as string[],
        debugJson = "",
        logs = "",
        selectedOutputFile = "",
    } = $props();

    let activeTab = $state("preview"); // preview | debug | logs

    function handleFileChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        dispatch("selectFile", target.value);
    }
</script>

<div class="preview-pane">
    <div class="header">
        <div class="tabs">
            <button
                class="tab"
                class:active={activeTab === "preview"}
                onclick={() => (activeTab = "preview")}
            >
                Preview
            </button>
            <button
                class="tab"
                class:active={activeTab === "debug"}
                onclick={() => (activeTab = "debug")}
            >
                JSON
            </button>
            <button
                class="tab"
                class:active={activeTab === "logs"}
                onclick={() => (activeTab = "logs")}
            >
                Logs
            </button>
        </div>

        {#if activeTab === "preview"}
            <div class="file-selector">
                <select
                    value={selectedOutputFile}
                    onchange={handleFileChange}
                    disabled={outputFiles.length === 0}
                >
                    {#if outputFiles.length === 0}
                        <option value="">(No Output)</option>
                    {:else}
                        {#each outputFiles as file}
                            <option value={file}
                                >{file.replace("output/", "")}</option
                            >
                        {/each}
                    {/if}
                </select>
            </div>
        {/if}
    </div>

    <div class="content">
        {#if activeTab === "preview"}
            <div class="frame-container">
                {#if iframeSrc}
                    <iframe
                        srcdoc={iframeSrc}
                        title="Preview"
                        sandbox="allow-scripts allow-same-origin"
                    ></iframe>
                {:else}
                    <div class="empty-state">
                        <div class="msg">No content to preview</div>
                        <div class="sub">
                            Compile the workspace to see results
                        </div>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "debug"}
            <div class="scroll-view code-view">
                <pre>{debugJson || "No debug data available"}</pre>
            </div>
        {:else if activeTab === "logs"}
            <div class="scroll-view log-view">
                <pre>{logs}</pre>
            </div>
        {/if}
    </div>
</div>

<style>
    .preview-pane {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--sl-color-bg);
        border-left: 1px solid var(--sl-color-hairline);
    }

    .header {
        height: 2.5rem;
        background: var(--sl-color-gray-6);
        border-bottom: 1px solid var(--sl-color-hairline);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 1rem;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        height: 100%;
    }

    .tab {
        background: transparent;
        border: none;
        height: 100%;
        padding: 0 0.8rem;
        font-size: 0.85rem;
        color: var(--sl-color-gray-3);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
        font-weight: 500;
    }

    .tab:hover {
        color: var(--sl-color-text);
        background: var(--sl-color-gray-5);
    }

    .tab.active {
        color: var(--sl-color-text);
        border-bottom-color: var(--sl-color-accent);
        background: var(--sl-color-bg);
    }

    .file-selector select {
        background: var(--sl-color-bg);
        color: var(--sl-color-text);
        border: 1px solid var(--sl-color-gray-5);
        border-radius: 4px;
        padding: 0.2rem 0.5rem;
        font-size: 0.8rem;
        max-width: 200px;
    }

    .content {
        flex: 1;
        position: relative;
        overflow: hidden;
    }

    .frame-container {
        width: 100%;
        height: 100%;
        background: white; /* Always white for preview fidelity */
    }

    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    .empty-state {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #888;
        background: var(--sl-color-gray-6);
    }
    .empty-state .msg {
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
    .empty-state .sub {
        font-size: 0.8rem;
        opacity: 0.8;
    }

    .scroll-view {
        height: 100%;
        overflow: auto;
        padding: 1rem;
    }

    .code-view pre {
        font-size: 0.8rem;
        font-family: monospace;
        color: var(--sl-color-text);
    }

    .log-view pre {
        font-family: monospace;
        font-size: 0.8rem;
        color: #aaddaa; /* Light green for logs */
        white-space: pre-wrap;
    }
    .log-view {
        background: #1e1e1e;
    }
</style>

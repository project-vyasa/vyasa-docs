<script lang="ts">
    console.log("Initializing PlayArea.svelte");
    import { onMount } from "svelte";
    import init, { compile_workspace, init_hooks } from "../pkg/vyasac.js";
    import JSZip from "jszip";

    let outputJSON = $state("");
    let fileError = $state("");
    let iframeSrc = $state("");
    let debugOpen = $state(false);
    let outputFiles = $state<string[]>([]);
    let logs = $state("System Logs:\n");

    let files = $state<Record<string, string>>({});

    interface WorkspaceMeta {
        id: string;
        name: string;
        file: string;
        hash: string;
    }

    // Workspace State
    let availableWorkspaces = $state<WorkspaceMeta[]>([]);
    let selectedWorkspaceId = $state("");

    // Template State
    let availableTemplates = $state<string[]>([]);
    let selectedTemplate = $state("");

    // UI State
    let activeTab = $state<"preview" | "debug" | "logs">("preview");
    let maximizedFile = $state<string | null>(null);

    function toggleMaximize(path: string) {
        if (maximizedFile === path) {
            maximizedFile = null;
        } else {
            maximizedFile = path;
        }
    }

    function log(...args: any[]) {
        console.log(...args);
        logs +=
            args
                .map((a) =>
                    typeof a === "object" ? JSON.stringify(a) : String(a),
                )
                .join(" ") + "\n";
    }

    function logError(...args: any[]) {
        console.error(...args);
        logs +=
            "[ERROR] " +
            args
                .map((a) =>
                    typeof a === "object" ? JSON.stringify(a) : String(a),
                )
                .join(" ") +
            "\n";
    }

    function getBasePath() {
        // Handle base path for samples if deployed to subdirectory
        const base = import.meta.env.BASE_URL;
        return base.endsWith("/") ? base : base + "/";
    }

    // --- Workspace Loading ---

    async function loadWorkspaceList() {
        try {
            const base = getBasePath();
            const res = await fetch(
                `${base}samples/index.json?t=${Date.now()}`,
            );
            if (res.ok) {
                // Determine if new format (objects) or legacy (strings)
                const data = await res.json();
                if (data.length > 0) {
                    if (typeof data[0] === "string") {
                        // Legacy fallback
                        availableWorkspaces = data.map((s: string) => ({
                            id: s,
                            name: s,
                            file: `${s}.zip`,
                            hash: "",
                        }));
                    } else {
                        availableWorkspaces = data;
                    }

                    if (availableWorkspaces.length > 0) {
                        selectedWorkspaceId = availableWorkspaces[0].id;
                        await loadWorkspace(selectedWorkspaceId);
                    }
                }
            }
        } catch (e: any) {
            logError("Failed to fetch workspace list:", e);
        }
    }

    async function loadWorkspace(id: string) {
        try {
            const ws = availableWorkspaces.find((w) => w.id === id);
            if (!ws) return;

            log(`Loading workspace: ${ws.name}`);

            // Reset Output State
            outputFiles = [];
            outputJSON = "";
            iframeSrc = "";
            files = {};
            fileError = "";

            const base = getBasePath();
            // Append hash if available for cache busting
            const url =
                `${base}samples/${ws.file}` + (ws.hash ? `?v=${ws.hash}` : "");

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${ws.file}`);

            const blob = await res.blob();
            const zip = await JSZip.loadAsync(blob);

            const newFiles: Record<string, string> = {};
            for (const filename of Object.keys(zip.files)) {
                const entry = zip.files[filename];
                if (!entry.dir) {
                    const content = await entry.async("string");
                    // Remove leading slash if any
                    const cleanPath = filename.startsWith("/")
                        ? filename.slice(1)
                        : filename;
                    newFiles[cleanPath] = content;
                }
            }

            files = newFiles;
            scanTemplates();
            runCompiler();
        } catch (e: any) {
            logError("Error loading workspace:", e);
            fileError = e.toString();
        }
    }

    function scanTemplates() {
        // Find all .html files in templates/ dir
        const temps = new Set<string>();
        // temps.add("default"); // Built-in default removed
        temps.add("ast.html"); // Built-in AST

        for (const path of Object.keys(files)) {
            // Check if path starts with templates/ and ends with .html
            if (path.startsWith("templates/") && path.endsWith(".html")) {
                // Extract filename
                const name = path.split("/").pop();
                if (name) temps.add(name);
            }
        }
        availableTemplates = Array.from(temps).sort();

        // Smart selection logic
        if (!availableTemplates.includes(selectedTemplate)) {
            if (availableTemplates.includes("default.html")) {
                selectedTemplate = "default.html";
            } else {
                // Find first non-AST template
                const nonAst = availableTemplates.find((t) => t !== "ast.html");
                selectedTemplate =
                    nonAst ||
                    (availableTemplates.length > 0
                        ? availableTemplates[0]
                        : "");
            }
        }
    }

    async function handleFileUpload(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith(".zip")) {
            fileError = "Please select a .zip file";
            return;
        }

        try {
            const zip = await JSZip.loadAsync(file);
            const newFiles: Record<string, string> = {};

            const entries = Object.keys(zip.files);
            for (const filename of entries) {
                const zipEntry = zip.files[filename];
                if (!zipEntry.dir) {
                    const content = await zipEntry.async("string");
                    const cleanPath = filename.startsWith("/")
                        ? filename.slice(1)
                        : filename;
                    newFiles[cleanPath] = content;
                }
            }

            files = newFiles;
            fileError = "";
            scanTemplates();
            runCompiler();
        } catch (e: any) {
            logError(e);
            fileError = "Failed to load zip: " + e.message;
        }
    }

    // --- Compiler ---

    async function runCompiler() {
        try {
            fileError = "";
            log("Compiling workspace...", {
                files: Object.keys(files),
                template: selectedTemplate,
            });

            await init();
            try {
                init_hooks();
            } catch (e) {
                /* ignore hooks error */
            }

            const input = JSON.parse(JSON.stringify(files));
            let tmplArg: string | undefined = undefined;
            if (selectedTemplate !== "default") {
                tmplArg = selectedTemplate;
            }

            const jsonStr = compile_workspace(input, tmplArg);
            const result = JSON.parse(jsonStr);
            log("Compilation result keys:", Object.keys(result));

            outputJSON = JSON.stringify(result, null, 2);

            // Filter output files
            outputFiles = Object.keys(result)
                .filter((k) => k.startsWith("output/"))
                .sort();

            // Ensure iframe updates
            const htmlFile =
                outputFiles.find((k) => k.endsWith(".html")) || outputFiles[0];

            if (htmlFile) {
                iframeSrc = result[htmlFile];
                activeTab = "preview";
            } else {
                iframeSrc = ""; // Clear iframe if no output
            }
        } catch (e: any) {
            logError("Compilation Error:", e);
            fileError = e.toString();
            outputJSON = "";
            outputFiles = [];
        }
    }

    function selectOutputFile(path: string) {
        if (typeof outputJSON === "string") {
            try {
                const result = JSON.parse(outputJSON);
                if (result && result[path]) {
                    iframeSrc = result[path];
                    activeTab = "preview";
                }
            } catch (e) {}
        }
    }

    function resultContains(filename: string, src: string) {
        // Simple check if the source content likely belongs to this file
        // Since we store data: URLs or raw content, exact match is hard.
        // But for selection, we just want to know if 'filename' is currently selected.
        // Actually, logic in selectOutputFile sets iframeSrc = result[path].
        // So we can check if result[filename] === iframeSrc.
        // But we don't have 'result' easily accessible here (it's in outputJSON).
        try {
            const data = JSON.parse(outputJSON);
            return data[filename] === src;
        } catch (e) {
            return false;
        }
    }

    onMount(async () => {
        // Init loads default workspace
        await init();
        await loadWorkspaceList();
    });
</script>

<div class="playarea-container">
    <header>
        <div class="brand-group">
            <h1>Vyasa Playarea</h1>
            <div class="selector">
                <span class="label">Workspace:</span>
                <select
                    bind:value={selectedWorkspaceId}
                    onchange={() => loadWorkspace(selectedWorkspaceId)}
                >
                    {#each availableWorkspaces as ws}
                        <option value={ws.id}>{ws.name}</option>
                    {/each}
                </select>
            </div>

            <div class="selector">
                <span class="label">Template:</span>
                <select bind:value={selectedTemplate} onchange={runCompiler}>
                    <!-- <option value="default">Default (Built-in)</option> -->
                    <option value="ast.html">AST (Built-in)</option>
                    {#each availableTemplates as tmpl}
                        {#if tmpl !== "default" && tmpl !== "ast.html"}
                            <option value={tmpl}>{tmpl}</option>
                        {/if}
                    {/each}
                </select>
            </div>
        </div>

        <div class="actions">
            <label class="upload-btn">
                Upload (.zip)
                <input type="file" onchange={handleFileUpload} accept=".zip" />
            </label>
            <button onclick={runCompiler} class="primary">Recompile</button>
        </div>
    </header>

    <div class="container">
        <div class="column editor">
            <h2>Input Files</h2>
            {#if fileError}
                <div class="error">{fileError}</div>
            {/if}
            <div class="file-list">
                {#each Object.entries(files) as [path, content]}
                    <div
                        class="file-entry"
                        class:maximized={maximizedFile === path}
                    >
                        <div class="file-header">
                            <label>{path}</label>
                            <button
                                class="icon-btn"
                                onclick={() => toggleMaximize(path)}
                                title={maximizedFile === path
                                    ? "Restore"
                                    : "Maximize"}
                            >
                                {maximizedFile === path ? "↙" : "⤢"}
                            </button>
                        </div>
                        <textarea bind:value={files[path]} rows="6"></textarea>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Output Column -->
        <div class="column output">
            <div class="tabs-header">
                <div class="generated-files">
                    <span class="label">Files:</span>
                    <select
                        disabled={outputFiles.length === 0}
                        onchange={(e: Event) =>
                            selectOutputFile(
                                (e.currentTarget as HTMLSelectElement).value,
                            )}
                        value={iframeSrc
                            ? outputFiles.find((f) =>
                                  resultContains(f, iframeSrc),
                              ) || ""
                            : ""}
                    >
                        {#if outputFiles.length === 0}
                            <option value="">(No output)</option>
                        {:else}
                            {#each outputFiles as file}
                                <option value={file}
                                    >{file.replace("output/", "")}</option
                                >
                            {/each}
                        {/if}
                    </select>
                </div>

                <div class="tabs">
                    <button
                        class="tab"
                        class:active={activeTab === "preview"}
                        onclick={() => (activeTab = "preview")}>Preview</button
                    >
                    <button
                        class="tab"
                        class:active={activeTab === "debug"}
                        onclick={() => (activeTab = "debug")}>Debug JSON</button
                    >
                    <button
                        class="tab"
                        class:active={activeTab === "logs"}
                        onclick={() => (activeTab = "logs")}>System Logs</button
                    >
                </div>
            </div>

            <div class="tab-content">
                {#if activeTab === "preview"}
                    <div class="preview-frame">
                        {#if iframeSrc}
                            <iframe
                                srcdoc={iframeSrc}
                                title="Preview"
                                sandbox="allow-scripts allow-same-origin"
                            ></iframe>
                        {:else}
                            <div class="empty-state">No content to preview</div>
                        {/if}
                    </div>
                {:else if activeTab === "debug"}
                    <div class="debug-view">
                        <pre>{outputJSON || "No debug data"}</pre>
                    </div>
                {:else if activeTab === "logs"}
                    <div class="logs-view">
                        <textarea readonly>{logs}</textarea>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

```

<style>
    /* Local Component Styles */
    .playarea-container {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        font-family: var(--sl-font-system);
        border: 1px solid var(--sl-color-hairline);
        background: var(--sl-color-bg);
        color: var(--sl-color-text);
    }
    header {
        padding: 0.25rem 1rem;
        background: var(--sl-color-bg-nav);
        color: var(--sl-color-text);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--sl-color-hairline);
        min-height: 3rem; /* Keep header height fix */
    }
    .brand-group {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }
    .selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
    }
    .selector .label {
        font-size: 0.8rem;
        color: var(--sl-color-text-accent);
        white-space: nowrap;
    }
    select {
        background: var(--sl-color-gray-6);
        color: var(--sl-color-text);
        border: 1px solid var(--sl-color-gray-5);
        padding: 0 0.5rem;
        border-radius: 4px;
        font-size: 0.85rem;
        height: 1.8rem; /* Keep compact height */
        line-height: normal;
    }
    h1 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--sl-color-text);
    }
    .container {
        flex: 1;
        display: flex;
        overflow: hidden;
        width: 100%;
    }
    .column {
        flex: 1;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--sl-color-hairline);
        min-width: 0;
        margin-top: 0;
    }
    .column:last-child {
        border-right: none;
    }

    /* Unified Panel Header Styles */
    h2,
    .tabs-header {
        margin: 0;
        padding: 0 1rem;
        height: 2.5rem; /* Keep alignment fix */
        background: var(--sl-color-gray-6);
        border-bottom: 1px solid var(--sl-color-hairline);
        color: var(--sl-color-text);
        display: flex;
        justify-content: space-between; /* Ensure content spreads */
        align-items: center;
    }

    h2 {
        font-size: 0.9rem;
        font-weight: bold;
    }

    .file-list {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        background: var(--sl-color-bg);
        margin-top: 0;
    }
    .file-entry {
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--sl-color-hairline);
        background: var(--sl-color-bg);
    }
    .file-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.2rem 0.5rem;
        background: var(--sl-color-gray-6);
        border-bottom: 1px solid var(--sl-color-hairline);
        height: 1.8rem; /* Keep compact */
    }
    .file-header label {
        margin: 0;
        color: var(--sl-color-text);
        font-size: 0.85rem;
    }
    .icon-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0 0.5rem;
        color: var(--sl-color-gray-3);
        display: flex;
        align-items: center;
        font-size: 1.5rem; /* Adjust icon size */
        margin-top: 0;
    }
    .icon-btn:hover {
        background: var(--sl-color-gray-5);
        color: var(--sl-color-text);
    }
    label {
        display: block;
        font-weight: bold;
        font-size: 0.9rem;
        color: var(--sl-color-text-accent);
    }
    textarea {
        width: 100%;
        font-family: monospace;
        font-size: 0.9rem;
        padding: 0.5rem;
        box-sizing: border-box; /* This is crucial for width: 100% */
        background: var(--sl-color-bg);
        border: none;
        outline: none;
        resize: vertical;
        flex: 1;
        min-height: 100px; /* Ensure visibility */
        color: var(--sl-color-text);
    }

    /* Maximized State */
    .file-entry.maximized {
        position: fixed;
        top: 8rem;
        left: 0;
        width: 100vw;
        height: calc(100vh - 3rem);
        z-index: 2000;
        margin: 0;
        border: none;
    }
    .file-entry.maximized textarea {
        resize: none;
        font-size: 1rem;
        padding: 1rem;
    }

    .preview-frame {
        flex: 1;
        background: white;
        border-bottom: 1px solid var(--sl-color-hairline);
    }
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
    .error {
        color: white;
        background: #d32f2f;
        padding: 0.5rem;
        font-size: 0.9rem;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0;
    }

    .upload-btn {
        background: var(--sl-color-gray-5);
        color: var(--sl-color-text);
        border: 1px solid var(--sl-color-gray-4);
        padding: 0 0.6rem;
        height: 1.8rem;
        display: flex;
        align-items: center;
        cursor: pointer;
        font-weight: normal;
        border-radius: 4px;
        font-size: 0.85rem;
        margin: 0;
    }
    .upload-btn input {
        display: none;
    }
    button.primary {
        padding: 0 0.8rem;
        height: 1.8rem;
        display: flex;
        align-items: center;
        cursor: pointer;
        border-radius: 4px;
        background: var(--sl-color-accent);
        color: var(--sl-color-text-invert);
        border: none;
        font-size: 0.85rem;
        margin-top: 0;
    }
    button.primary:hover {
        opacity: 0.9;
    }
    pre {
        padding: 1rem;
        font-size: 0.8rem;
        overflow: auto;
        max-height: 100%;
        background: var(--sl-color-gray-6);
        margin: 0;
        color: var(--sl-color-text);
    }
    /* Output Layout */
    .tabs-header {
        justify-content: space-between;
    }
    .generated-files {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .generated-files .label {
        font-size: 0.8rem;
        font-weight: bold;
        color: var(--sl-color-text-accent);
    }
    .no-files {
        font-size: 0.8rem;
        color: var(--sl-color-gray-3);
        font-style: italic;
    }
    .pill {
        font-size: 0.75rem;
        padding: 0.1rem 0.5rem;
        height: 1.6rem;
        background: var(--sl-color-gray-6);
        color: var(--sl-color-text);
        border: 1px solid var(--sl-color-hairline);
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
    }
    .pill:hover {
        background: var(--sl-color-gray-5);
    }
    .pill.active {
        background: var(--sl-color-accent);
        color: var(--sl-color-text-invert);
        border-color: var(--sl-color-accent);
        font-weight: bold;
    }
    .tabs {
        display: flex;
        gap: 0.2rem;
        height: 100%;
        align-items: flex-end;
        margin-top: 0;
    }
    .tab {
        background: transparent;
        border: none;
        color: var(--sl-color-gray-3);
        font-weight: 500;
        padding: 0.1rem 0.8rem;
        height: 2rem;
        display: flex;
        align-items: center;
        border-radius: 4px 4px 0 0;
        transition: color 0.2s;
        font-size: 0.85rem;
    }
    .tab:hover {
        background: var(--sl-color-gray-5);
        color: var(--sl-color-text);
    }
    .tab.active {
        background: var(--sl-color-bg);
        color: var(--sl-color-text);
        font-weight: bold;
        border: 1px solid var(--sl-color-hairline);
        border-bottom: 2px solid var(--sl-color-accent); /* Highlight active tab instead of hiding border */
        margin-bottom: -1px; /* Overlap border */
        z-index: 10;
    }

    .tab-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--sl-color-bg);
        position: relative;
        overflow: hidden;
        margin-top: 0;
    }

    .empty-state {
        padding: 2rem;
        text-align: center;
        color: var(--sl-color-gray-3);
    }

    .debug-view,
    .logs-view {
        flex: 1;
        overflow: hidden;
        display: flex;
        height: 100%;
    }

    /* Fix for debug view scrolling */
    .debug-view {
        overflow: auto;
    }

    .logs-view textarea {
        flex: 1;
        resize: none;
        border: none;
        padding: 1rem;
        font-family: monospace;
        font-size: 0.85rem;
        background: var(--sl-color-black);
        color: #cfc;
    }
</style>

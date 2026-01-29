<script lang="ts">
    import { onMount } from "svelte";
    import init, { compile_workspace, init_hooks } from "../pkg/vyasac.js";
    import JSZip from "jszip";

    // Components
    import FileExplorer from "./ide_v2/FileExplorer.svelte";
    import CodeEditor from "./ide_v2/CodeEditor.svelte";
    import PreviewPane from "./ide_v2/PreviewPane.svelte";

    let outputJSON = $state("");
    let fileError = $state("");
    let iframeSrc = $state("");

    // State
    let files = $state<Record<string, string>>({});
    let selectedFile = $state<string>("");
    let outputFiles = $state<string[]>([]);
    let selectedOutputFile = $state<string>("");
    let logs = $state("System Logs:\n");

    interface WorkspaceMeta {
        id: string;
        name: string;
        file: string;
        hash: string;
    }

    // Workspace & Template State
    let availableWorkspaces = $state<WorkspaceMeta[]>([]);
    let selectedWorkspaceId = $state("");
    let availableTemplates = $state<string[]>([]);
    let selectedTemplate = $state("");

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
        const base = import.meta.env.BASE_URL;
        return base.endsWith("/") ? base : base + "/";
    }

    // --- Loading Logic ---

    async function loadWorkspaceList() {
        try {
            const base = getBasePath();
            const res = await fetch(
                `${base}samples/index.json?t=${Date.now()}`,
            );
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    // Normalize data
                    if (typeof data[0] === "string") {
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
            logError("Failed to fetch workspaces:", e);
        }
    }

    async function loadWorkspace(id: string) {
        try {
            const ws = availableWorkspaces.find((w) => w.id === id);
            if (!ws) return;

            log(`Loading workspace: ${ws.name}`);
            outputFiles = [];
            outputJSON = "";
            iframeSrc = "";
            files = {};
            selectedFile = "";

            const base = getBasePath();
            const url =
                `${base}samples/${ws.file}` + (ws.hash ? `?v=${ws.hash}` : "");

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${ws.file}`);

            const blob = await res.blob();
            const zip = await JSZip.loadAsync(blob);

            const newFiles: Record<string, string> = {};
            for (const filename of Object.keys(zip.files)) {
                if (!zip.files[filename].dir) {
                    const cleanPath = filename.startsWith("/")
                        ? filename.slice(1)
                        : filename;
                    newFiles[cleanPath] =
                        await zip.files[filename].async("string");
                }
            }

            files = newFiles;

            // Auto-select a file (prefer context.vy or main content)
            const keys = Object.keys(files);
            if (keys.includes("content/1.vy")) selectedFile = "content/1.vy";
            else if (keys.includes("context.vy")) selectedFile = "context.vy";
            else if (keys.length > 0) selectedFile = keys[0];

            scanTemplates();
            runCompiler();
        } catch (e: any) {
            logError("Error loading workspace:", e);
            fileError = e.toString();
        }
    }

    function scanTemplates() {
        const temps = new Set<string>();
        temps.add("ast.html");
        for (const path of Object.keys(files)) {
            if (path.startsWith("templates/") && path.endsWith(".html")) {
                const name = path.split("/").pop();
                if (name) temps.add(name);
            }
        }
        availableTemplates = Array.from(temps).sort();

        // Auto selection
        if (!availableTemplates.includes(selectedTemplate)) {
            if (availableTemplates.includes("default.html"))
                selectedTemplate = "default.html";
            else {
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
        if (!file || !file.name.endsWith(".zip")) return;

        try {
            const zip = await JSZip.loadAsync(file);
            const newFiles: Record<string, string> = {};
            for (const filename of Object.keys(zip.files)) {
                if (!zip.files[filename].dir) {
                    const cleanPath = filename.startsWith("/")
                        ? filename.slice(1)
                        : filename;
                    newFiles[cleanPath] =
                        await zip.files[filename].async("string");
                }
            }
            files = newFiles;
            if (Object.keys(files).length > 0)
                selectedFile = Object.keys(files)[0];
            scanTemplates();
            runCompiler();
        } catch (e: any) {
            logError("Upload failed:", e);
        }
    }

    // --- Compilation ---

    async function runCompiler() {
        try {
            fileError = "";
            log("Compiling...");
            await init();
            try {
                init_hooks();
            } catch (e) {
                /*ignore*/
            }

            const input = JSON.parse(JSON.stringify(files));
            const tmplArg =
                selectedTemplate !== "default.html"
                    ? selectedTemplate
                    : undefined; // Fix template arg logic if needed

            // Compiler expects either just input, or input + template name
            // If template is 'default.html', we can pass it explicitly if it exists in files.
            const resultStr = compile_workspace(input, tmplArg);
            const result = JSON.parse(resultStr);

            outputJSON = JSON.stringify(result, null, 2);
            outputFiles = Object.keys(result)
                .filter((k) => k.startsWith("output/"))
                .sort();

            // Auto-select output
            const html =
                outputFiles.find((k) => k.endsWith(".html")) || outputFiles[0];
            if (html) selectOutputFile(html);
            else iframeSrc = "";
        } catch (e: any) {
            logError("Compilation Error:", e);
            fileError = e.toString();
        }
    }

    function selectOutputFile(path: string) {
        selectedOutputFile = path;
        try {
            const res = JSON.parse(outputJSON);
            if (res && res[path]) {
                iframeSrc = res[path];
            }
        } catch (e) {}
    }

    onMount(async () => {
        await init();
        await loadWorkspaceList();
    });
</script>

<div class="ide-container">
    <header>
        <div class="brand">
            <strong>Vyasa</strong> Play
        </div>

        <div class="controls">
            <div class="control-group">
                <span class="label">Workspace</span>
                <select
                    bind:value={selectedWorkspaceId}
                    onchange={() => loadWorkspace(selectedWorkspaceId)}
                >
                    {#each availableWorkspaces as ws}
                        <option value={ws.id}>{ws.name}</option>
                    {/each}
                </select>
            </div>

            <div class="control-group">
                <span class="label">Template</span>
                <select bind:value={selectedTemplate} onchange={runCompiler}>
                    <option value="ast.html">AST (Built-in)</option>
                    {#each availableTemplates as t}
                        {#if t !== "ast.html"}
                            <option value={t}>{t}</option>
                        {/if}
                    {/each}
                </select>
            </div>

            <button class="action-btn" onclick={runCompiler}> ▶ Run </button>
            <label class="upload-btn">
                Import Zip
                <input type="file" onchange={handleFileUpload} accept=".zip" />
            </label>
        </div>
    </header>

    <div class="workspace">
        <!-- Sidebar -->
        <div class="pane sidebar">
            <FileExplorer
                files={Object.keys(files)}
                {selectedFile}
                on:select={(e) => (selectedFile = e.detail)}
            />
        </div>

        <!-- Editor -->
        <div class="pane editor">
            {#if selectedFile && files[selectedFile] !== undefined}
                <CodeEditor
                    bind:content={files[selectedFile]}
                    filename={selectedFile}
                />
            {:else}
                <div class="empty-editor">Select a file to edit</div>
            {/if}
        </div>

        <!-- Preview -->
        <div class="pane preview">
            <PreviewPane
                {iframeSrc}
                {outputFiles}
                debugJson={outputJSON}
                {logs}
                {selectedOutputFile}
                on:selectFile={(e) => selectOutputFile(e.detail)}
            />
        </div>
    </div>
</div>

<style>
    .ide-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: var(--sl-color-bg);
        color: var(--sl-color-text);
        font-family: var(--sl-font-system);
    }

    header {
        height: 3.5rem; /* Increased height */
        background: var(--sl-color-gray-6);
        border-bottom: 1px solid var(--sl-color-hairline);
        display: flex;
        align-items: center;
        padding: 0 1rem;
        justify-content: space-between;
        gap: 1rem;
    }

    .brand {
        font-size: 1.1rem;
        color: var(--sl-color-text);
        white-space: nowrap;
    }

    .controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap; /* Allow wrapping on small screens */
        justify-content: flex-end;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--sl-color-black); /* Input background wrapper */
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        border: 1px solid var(--sl-color-gray-5);
    }

    .label {
        font-size: 0.7rem;
        color: var(--sl-color-text-accent);
        text-transform: uppercase;
        font-weight: bold;
        letter-spacing: 0.05em;
        margin-right: 0.2rem;
    }

    select {
        background: transparent;
        color: var(--sl-color-text);
        border: none;
        padding: 0;
        font-size: 0.9rem;
        outline: none;
        cursor: pointer;
    }

    /* Actions Group separation */
    .actions-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-left: 1px solid var(--sl-color-gray-4);
        padding-left: 1rem;
        margin-left: 0.5rem;
    }

    .action-btn {
        background: var(--sl-color-accent);
        color: var(--sl-color-text-invert);
        border: none;
        height: 2rem;
        padding: 0 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        white-space: nowrap;
    }
    .action-btn:hover {
        opacity: 0.9;
    }

    .upload-btn {
        background: var(--sl-color-gray-5);
        border: 1px solid var(--sl-color-gray-4);
        color: var(--sl-color-text);
        height: 2rem;
        padding: 0 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        white-space: nowrap;
    }
    .upload-btn:hover {
        background: var(--sl-color-gray-4);
    }
    .upload-btn input {
        display: none;
    }

    .workspace {
        flex: 1;
        display: flex;
        overflow: hidden;
    }

    .pane {
        height: 100%;
        overflow: hidden;
    }

    .sidebar {
        flex: 0 0 220px;
        border-right: 1px solid var(--sl-color-hairline);
    }

    .editor {
        flex: 1;
        min-width: 0;
    }

    .preview {
        flex: 1;
        min-width: 350px;
        border-left: 1px solid var(--sl-color-hairline);
    }

    .empty-editor {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: var(--sl-color-gray-3);
    }
</style>

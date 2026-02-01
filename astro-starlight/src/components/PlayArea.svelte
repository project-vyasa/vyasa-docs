<script lang="ts">
    import { onMount, tick } from "svelte";
    import init, { compile_workspace, init_hooks } from "../pkg/vyasac.js";
    import JSZip from "jszip";
    import { pathsToTree } from "../lib/treeUtils";

    // Library Components
    import {
        AppShell,
        Tree,
        CodeEditor,
        Icon,
        Button,
        Select,
        Panel,
        Switch,
        type TreeNode,
    } from "@vyasa-ui/svelte";

    // Icons
    import {
        ArrowLeft,
        Play,
        Upload,
        Folder,
        Code,
        CheckCircle,
        MoreHorizontal,
        ChevronLeft,
        ChevronRight,
    } from "lucide-svelte";

    let outputJSON = $state("");
    let fileError = $state("");
    let iframeSrc = $state("");
    let lineWrapping = $state(true);

    // State
    let files = $state<Record<string, string>>({});
    let selectedFile = $state<string>("");
    let outputFiles = $state<string[]>([]);
    let selectedOutputFile = $state<string>("");
    let logs = $state("System Logs:\n");

    // Tree State
    let treeData = $state<TreeNode[]>([]);
    let outputTreeData = $state<TreeNode[]>([]);
    let expandedIds = $state(new Set<string>());

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

            // log(`Loading workspace: ${ws.name}`);
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
            treeData = pathsToTree(Object.keys(files));
            console.log("Tree Data Updated:", treeData.length, "nodes");

            // Auto-select
            const keys = Object.keys(files);
            // Expand all folders by default for now
            const allFolders = new Set<string>();
            keys.forEach((k) => {
                const parts = k.split("/");
                let p = "";
                for (let i = 0; i < parts.length - 1; i++) {
                    p = p ? `${p}/${parts[i]}` : parts[i];
                    allFolders.add(p);
                }
            });
            expandedIds = allFolders;

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
        // Log files to debug tree data
        console.log("Files loaded:", Object.keys(files));
        const temps = new Set<string>();
        temps.add("ast.html");
        for (const path of Object.keys(files)) {
            if (path.startsWith("templates/") && path.endsWith(".html")) {
                const name = path.split("/").pop();
                if (name) temps.add(name);
            }
        }
        availableTemplates = Array.from(temps).sort();

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
                    : undefined;

            const resultStr = compile_workspace(input, tmplArg);
            const result = JSON.parse(resultStr);

            console.log("Compiler Stats:", result.stats);
            log(
                `[SUCCESS] Compiled ${result.stats.file_count} files in ${Math.round(result.stats.duration_ms)}ms.`,
            );

            outputJSON = JSON.stringify(result.files, null, 2);
            outputFiles = Object.keys(result.files)
                .filter((k) => k.startsWith("output/"))
                .sort();
            outputTreeData = pathsToTree(outputFiles);
            console.log("Output Files:", outputFiles);
            console.log("Output Tree Data:", outputTreeData);

            // Auto-expand 'output' folder
            if (outputFiles.length > 0) {
                const newExpanded = new Set(expandedIds);
                newExpanded.add("output");
                // Also expand subfolders if few? For now just root.
                expandedIds = newExpanded;
            }

            const html =
                outputFiles.find((k) => k.endsWith(".html")) || outputFiles[0];
            if (html) selectOutputFile(html);
            else iframeSrc = "";
        } catch (e: any) {
            logError("Compilation Error:", e);
            fileError = e.toString();
            outputJSON = JSON.stringify({ error: e.toString() }, null, 2);
        }
    }

    function nextOutputFile() {
        if (outputFiles.length === 0) return;
        const idx = outputFiles.indexOf(selectedOutputFile);
        const nextIdx = (idx + 1) % outputFiles.length;
        selectOutputFile(outputFiles[nextIdx]);
    }

    function prevOutputFile() {
        if (outputFiles.length === 0) return;
        const idx = outputFiles.indexOf(selectedOutputFile);
        const prevIdx = (idx - 1 + outputFiles.length) % outputFiles.length;
        selectOutputFile(outputFiles[prevIdx]);
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

    // --- UI Helpers ---
    function goHome() {
        window.location.href = getBasePath();
    }

    let fileInput: HTMLInputElement;

    // Layout State
    let leftWidth = $state(240);
    let rightWidth = $state(400);

    // Compute header grid columns to match AppShell body: [Left Sidebar] [Content] [Right Sidebar]
    let headerGridCols = $derived(`${leftWidth}px 1fr ${rightWidth}px`);

    onMount(async () => {
        // Calculate initial split to be roughly 50/50 between editor and preview
        const available = window.innerWidth - leftWidth;
        rightWidth = Math.floor(available / 2);

        await init();
        await loadWorkspaceList();
    });
</script>

<div class="h-screen w-screen overflow-hidden text-sm">
    <AppShell
        bind:leftWidth
        bind:rightWidth
        bottomHeight={200}
        maximizedZone="none"
    >
        {#snippet header()}
            <div
                class="header-grid"
                style:grid-template-columns={headerGridCols}
            >
                <div class="header-cell px-2 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            icon={ArrowLeft}
                            onclick={goHome}
                            title="Back to Docs"
                        />
                        <strong class="text-lg">Vyasa</strong>
                        <span class="opacity-50">PlayArea</span>
                    </div>
                </div>

                <!-- Col 2: Editor Actions (Aligned with Editor) -->
                <div class="header-cell px-2 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        icon={Upload}
                        onclick={() => fileInput?.click()}
                        class="text-xs"
                    >
                        Import Zip
                    </Button>
                    <input
                        type="file"
                        class="hidden"
                        bind:this={fileInput}
                        onchange={handleFileUpload}
                        accept=".zip"
                    />
                    <div class="w-[1px] h-4 bg-border-base mx-1"></div>
                    <Switch
                        bind:checked={lineWrapping}
                        label="Wrap"
                        size="sm"
                    />
                    <div class="w-[1px] h-4 bg-border-base mx-1"></div>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={Play}
                        onclick={runCompiler}
                    >
                        Run
                    </Button>
                </div>

                <!-- Col 3: Preview Actions (Aligned with Sidebar Right) -->
                <div
                    class="header-cell border-l px-2 flex items-center gap-2 bg-surface-alt"
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        icon={ChevronLeft}
                        onclick={prevOutputFile}
                        title="Previous File"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        icon={ChevronRight}
                        onclick={nextOutputFile}
                        title="Next File"
                    />

                    <div class="flex-1">
                        <Select
                            options={[
                                { label: "AST (Built-in)", value: "ast.html" },
                                ...availableTemplates
                                    .filter((t) => t !== "ast.html")
                                    .map((t) => ({ label: t, value: t })),
                            ]}
                            bind:value={selectedTemplate}
                            onchange={runCompiler}
                            placeholder="Template"
                        />
                    </div>
                </div>
            </div>
        {/snippet}

        {#snippet sidebarLeft()}
            <div class="h-full flex flex-col">
                <!-- Workspace Selector (Top) -->
                <div class="p-2 border-b bg-surface-alt">
                    <Select
                        options={availableWorkspaces.map((w) => ({
                            label: w.name,
                            value: w.id,
                        }))}
                        bind:value={selectedWorkspaceId}
                        onchange={() => loadWorkspace(selectedWorkspaceId)}
                        placeholder="Select Workspace"
                    />
                </div>

                <!-- Source Explorer (Middle) -->
                <Panel
                    title="Source"
                    icon={Folder}
                    class="flex-1 min-h-0 border-b-0"
                >
                    {#snippet actions()}
                        <Button variant="ghost" size="icon" />
                    {/snippet}
                    <div class="h-full overflow-auto py-2">
                        {#key treeData}
                            <Tree
                                data={treeData}
                                bind:expandedIds
                                bind:selectedId={selectedFile}
                                onSelect={(node) => {
                                    console.log("Selected node:", node);
                                    if (!node.children) {
                                        selectedFile = node.id;
                                        console.log(
                                            "New selectedFile:",
                                            selectedFile,
                                        );
                                    }
                                }}
                            />
                        {/key}
                    </div>
                </Panel>

                <!-- Output Explorer (Bottom) -->
                <div class="h-1/2 border-t">
                    <Panel
                        title="Output"
                        icon={CheckCircle}
                        class="h-full border-0"
                    >
                        <div class="h-full overflow-auto py-2">
                            {#key outputTreeData}
                                <Tree
                                    data={outputTreeData}
                                    bind:expandedIds
                                    selectedId={selectedOutputFile}
                                    onSelect={(node: any) =>
                                        !node.children &&
                                        selectOutputFile(node.id)}
                                />
                            {/key}
                        </div>
                    </Panel>
                </div>
            </div>
        {/snippet}

        {#snippet children()}
            {#if selectedFile && files[selectedFile] !== undefined}
                <CodeEditor
                    bind:value={files[selectedFile]}
                    language={selectedFile.endsWith(".html")
                        ? "html"
                        : selectedFile.endsWith(".vy")
                          ? "vy"
                          : "markdown"}
                    class="h-full w-full"
                    {lineWrapping}
                />
            {:else}
                <div
                    class="flex items-center justify-center h-full opacity-50 bg-neutral-900"
                >
                    <div class="text-center">
                        <Icon
                            icon={Code}
                            size={48}
                            class="mb-4 text-neutral-700 mx-auto"
                        />
                        <p>Select a file to edit</p>
                    </div>
                </div>
            {/if}
        {/snippet}

        {#snippet sidebarRight()}
            <div class="h-full flex flex-col">
                <!-- Preview Iframe -->
                <div class="flex-1 bg-white relative">
                    {#if iframeSrc}
                        <iframe
                            srcdoc={iframeSrc}
                            title="Preview"
                            class="w-full h-full border-none"
                            sandbox="allow-scripts allow-same-origin"
                        ></iframe>
                    {:else}
                        <div
                            class="flex items-center justify-center h-full text-neutral-400"
                        >
                            No preview available
                        </div>
                    {/if}
                </div>
            </div>
        {/snippet}

        <!-- Output Debug -->
        {#snippet panelBottom()}
            <Panel title="Console" icon={Code}>
                <div
                    class="h-full overflow-auto p-2 font-mono text-xs bg-black text-green-400"
                >
                    <pre>{logs}</pre>
                </div>
            </Panel>
        {/snippet}

        {#snippet statusBar()}
            <div class="flex justify-between w-full opacity-70 px-2">
                <div class="flex items-center gap-4">
                    <span class="flex items-center gap-1">
                        <Icon icon={CheckCircle} size={12} /> Ready to compile
                    </span>
                </div>
                <div class="flex items-center gap-4">
                    <span>{selectedFile || "No file selected"}</span>
                    <span>Vyasa v0.1.0</span>
                </div>
            </div>
        {/snippet}
    </AppShell>
</div>

<style>
    /* Tailwind Polyfills for this component scope */
    .flex {
        display: flex;
    }
    .flex-col {
        flex-direction: column;
    }
    .items-center {
        align-items: center;
    }
    .justify-between {
        justify-content: space-between;
    }
    .justify-center {
        justify-content: center;
    }
    .h-screen {
        height: 100vh;
    }
    .w-screen {
        width: 100vw;
    }
    .h-full {
        height: 100%;
    }
    .w-full {
        width: 100%;
    }
    .flex-1 {
        flex: 1;
    }

    .px-2 {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }
    .py-2 {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }

    .gap-2 {
        gap: 0.5rem;
    }
    .gap-4 {
        gap: 1rem;
    }
    .gap-4 {
        gap: 1rem;
    }

    .text-lg {
        font-size: 1.125rem;
    }
    .text-center {
        text-align: center;
    }
    .opacity-50 {
        opacity: 0.5;
    }
    .opacity-70 {
        opacity: 0.7;
    }
    .hidden {
        display: none;
    }
    .overflow-auto {
        overflow: auto;
    }
    .overflow-hidden {
        overflow: hidden;
    }

    .bg-neutral-900 {
        background-color: #111;
    }

    /* New V4 Utilities */
    .bg-surface-alt {
        background-color: var(--bg-surface-alt);
    }
    .bg-white {
        background-color: #ffffff; /* Force actual white for preview paper look */
    }
    .p-2 {
        padding: 0.5rem;
    }
    .border-b {
        border-bottom: 1px solid var(--border-base);
    }
    .border-t {
        border-top: 1px solid var(--border-base);
    }

    .h-1\/3 {
        height: 33.333333%;
    }
    .h-1\/2 {
        height: 50%;
    }

    .relative {
        position: relative;
    }
    .header-grid {
        display: grid;
        height: 100%;
        width: 100%;
    }
    .header-cell {
        display: flex;
        align-items: center;
        overflow: visible;
        position: relative;
        z-index: 100; /* Boost z-index above sidebars */
    }
    .border-l {
        border-left: 1px solid var(--border-base);
    }
</style>

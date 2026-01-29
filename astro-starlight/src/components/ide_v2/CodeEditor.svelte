<script lang="ts">
    // Two-way binding for content
    let { content = $bindable(""), filename = "" } = $props();
</script>

<div class="code-editor">
    <div class="header">
        <span class="filename">{filename || "Untitled"}</span>
    </div>
    <div class="editor-container">
        <textarea
            bind:value={content}
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
        ></textarea>
    </div>
</div>

<style>
    .code-editor {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background: var(--sl-color-bg);
    }

    .header {
        padding: 0.5rem 1rem;
        background: var(--sl-color-gray-6);
        border-bottom: 1px solid var(--sl-color-hairline);
        font-size: 0.85rem;
        color: var(--sl-color-text-accent);
        display: flex;
        align-items: center;
        height: 2.5rem;
    }

    .filename {
        font-family: var(--sl-font-mono);
        font-weight: bold;
    }

    .editor-container {
        flex: 1;
        position: relative;
    }

    textarea {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        resize: none;
        border: none;
        outline: none;
        padding: 1rem;
        background: var(--sl-color-bg); /* Use theme bg */
        color: var(--sl-color-text);
        font-family: "Menlo", "Monaco", "Courier New", monospace;
        font-size: 14px;
        line-height: 1.5;
        box-sizing: border-box;
    }

    textarea:focus {
        background: var(--sl-color-bg); /* Maintain bg on focus */
    }
</style>

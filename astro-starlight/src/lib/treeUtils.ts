import type { TreeNode } from "@vyasa-ui/svelte";
import {
    Folder,
    FolderOpen,
    File,
    FileCode,
    FileJson,
    FileText,
    FileImage
} from "lucide-svelte";

export function pathsToTree(paths: string[]): TreeNode[] {
    const root: TreeNode[] = [];
    const map = new Map<string, TreeNode>();
    paths.sort();

    for (const path of paths) {
        const parts = path.split('/');
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!map.has(currentPath)) {
                const node: TreeNode = {
                    id: currentPath,
                    label: part,
                    icon: isFile ? getIcon(part) : Folder,
                    children: isFile ? undefined : []
                };
                map.set(currentPath, node);

                if (parentPath) {
                    const parent = map.get(parentPath);
                    if (parent && parent.children) {
                        parent.children.push(node);
                    }
                } else {
                    root.push(node);
                }
            }
        }
    }
    return root;
}

function getIcon(filename: string) {
    if (filename.endsWith('.vy')) return FileCode;
    if (filename.endsWith('.html')) return FileCode;
    if (filename.endsWith('.css')) return FileCode;
    if (filename.endsWith('.json')) return FileJson;
    if (filename.endsWith('.md')) return FileText;
    if (filename.endsWith('.png') || filename.endsWith('.jpg')) return FileImage;
    return File;
}

// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import svelte from '@astrojs/svelte';
import wasm from "vite-plugin-wasm";

// https://astro.build/config
export default defineConfig({
    site: 'https://project-vyasa.github.io',
    base: '/vyasa-docs',
    vite: {
        plugins: [wasm()]
    },
    integrations: [starlight({
        title: 'Vyasa',
        social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/project-vyasa/vyasa' }],
        sidebar: [
            {
                label: 'Guides',
                autogenerate: { directory: 'guides' },
            },
            {
                label: 'Notes',
                autogenerate: { directory: 'notes' },
            },

        ],
    }), svelte()],
});
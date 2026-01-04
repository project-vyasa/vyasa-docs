// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
    integrations: [starlight({
        title: 'Vyasa',
        social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/project-vyasa/vyasa' }],
        sidebar: [
            {
                label: 'Guides',
                items: [
                    { label: 'User Guide', slug: 'user-guide' },
                    { label: 'Developer Guide', slug: 'developer-guide' },
                ],
            },
            {
                label: 'Notes',
                autogenerate: { directory: 'notes' },
            },

        ],
    }), svelte()],
});
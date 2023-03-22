import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import purgeCSS from 'vite-plugin-purgecss';

export default defineConfig({
	// @ts-ignore
	plugins: [sveltekit(), purgeCSS({})],
	server: {
		fs: {
			allow: ["../.."],
		},
	},
});

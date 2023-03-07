import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { qrcode } from 'vite-plugin-qrcode';
import purgeCSS from 'vite-plugin-purgecss';

export default defineConfig({
	// @ts-ignore
	plugins: [sveltekit(), purgeCSS({}), qrcode()],
	server: {
		host: true,
		fs: {
			allow: ["../.."],
		},
	},
});

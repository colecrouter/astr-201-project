import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { qrcode } from 'vite-plugin-qrcode';

export default defineConfig({
	plugins: [sveltekit(), qrcode()],
	server: {
		host: true,
		fs: {
			allow: ["../.."],
		},
	},
});

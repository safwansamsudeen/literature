import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { webSocketServer } from './socket_plugin';

export default defineConfig({
	plugins: [sveltekit(), webSocketServer]
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	server: {
		port: 3003,
		host: true,
	},
	build: {
		rollupOptions: {
			input: { main: './index.html' },
			output: {
				manualChunks(id: any) {
					if (id?.includes('node_modules')) return 'vendor'
					if (id?.includes('react-dom')) return 'framework'
				},
			},
			external: ['node_modules/**'],
		},
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: true,
		minify: 'terser',
		target: 'esnext',
		commonjsOptions: { ignoreDynamicRequires: true },
		chunkSizeWarningLimit: 1024,
		terserOptions: { compress: { drop_console: true, drop_debugger: true }, format: { comments: false }, module: true },
	},
	publicDir: 'public',
	define: { global: 'window' },
	plugins: [
		react(),
		tsconfigPaths(),
	],
	optimizeDeps: { entries: ['index.html'], include: ['react', 'react-dom'], exclude: ['some-large-lib'], esbuildOptions: { target: 'esnext', supported: { 'top-level-await': true } } },
	esbuild: { jsxInject: `import React from 'react';` },
	json: { stringify: true },
	css: { preprocessorOptions: { css: { charset: false } } },
})
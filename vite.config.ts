import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import replace from '@rollup/plugin-replace'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
			preventAssignment: true
		})
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/main.tsx'),
			name: 'SamplePlugin',
			fileName: 'main',
			formats: ['umd']
		},
		rollupOptions: {
			external: ['react', 'react-dom'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM'
				},
				entryFileNames: 'main.js',
				format: 'umd'
			},
		},
	},
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      'response-ready/domain-packs/esg': path.resolve(__dirname, '../response-ready/domain-packs/esg/index.ts'),
      'response-ready': path.resolve(__dirname, '../response-ready/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})

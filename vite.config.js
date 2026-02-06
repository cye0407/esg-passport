import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['leaf.svg'],
      manifest: {
        name: 'ESG Passport',
        short_name: 'ESG Passport',
        description: 'Your sustainability data, always ready. Respond to ESG questionnaires in minutes.',
        theme_color: '#2D5016',
        background_color: '#f8faf5',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'leaf.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Skip waiting so new service worker activates immediately
        skipWaiting: true,
        clientsClaim: true,
        // Don't precache dynamically imported chunks — let them load fresh
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Cache JS/CSS assets with network-first strategy so new deploys win
            urlPattern: /\/assets\/.*\.(js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      'response-ready/domain-packs/esg': path.resolve(__dirname, '../response-ready/domain-packs/esg/index.ts'),
      'response-ready': path.resolve(__dirname, '../response-ready/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
})

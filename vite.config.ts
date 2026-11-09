import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.svg', 'icon-512.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/mayu105-cmd\.github\.io\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kumamoto-runtime',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
            }
          }
        ]
      },
      manifest: {
        name: '車中泊避難者支援システム | 熊本市',
        short_name: '車中泊支援',
        description: '熊本市 車中泊避難者支援・健康管理システム',
        theme_color: '#1d4ed8',
        background_color: '#f1f5f9',
        display: 'standalone',
        scope: './',
        start_url: './',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  }
})

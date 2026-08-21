import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // <-- IIS üzerinde asset'lerin doğru yüklenmesi için göreceli yola çevirdik
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: false,
      },
      registerType: 'autoUpdate',
      manifest: {
        name: 'SESA Arıza Takip Sistemi',
        short_name: 'SESA Takip',
        description: 'SESA Plastik makine arıza bildirim ve takip sistemi',
        theme_color: '#070B14',
        background_color: '#070B14',
        display: 'standalone',
        start_url: './', // <-- PWA başlangıç yolunu göreceli yaptk
        scope: './',     // <-- PWA kapsamını göreceli yaptık
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackDenylist: [/^\/api/],
      }
    })
  ],
})
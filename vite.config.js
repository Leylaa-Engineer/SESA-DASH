import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  // Vercel uygulamayı alan adının kökünde yayınlar; varlıklar /sesa/ altından çağrılmamalıdır.
  base: '/',
  resolve: {
    alias: {
      'firebase/app': path.resolve(process.cwd(), 'src/sql/firebase-shim.js'),
      'firebase/auth': path.resolve(process.cwd(), 'src/sql/firebase-shim.js'),
      'firebase/firestore': path.resolve(process.cwd(), 'src/sql/firebase-shim.js'),
      'firebase/storage': path.resolve(process.cwd(), 'src/sql/firebase-shim.js'),
    },
  },
  server: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SESA Arıza Takip Sistemi',
        short_name: 'SESA Takip',
        description: 'SESA Plastik makine arıza bildirim ve takip sistemi',
        theme_color: '#070B14',
        background_color: '#070B14',
        display: 'standalone',
        start_url: '/',
        scope: '/',
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
      }
    })
  ],
})

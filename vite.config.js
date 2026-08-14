import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Vercel uygulamayı alan adının kökünde yayınlar; varlıklar /sesa/ altından çağrılmamalıdır.
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SESA Arıza Takip Sistemi',
        short_name: 'SESA Takip',
        description: 'SESA Plastik makine arıza bildirim ve takip sistemi',
        theme_color: '#E8891D',
        background_color: '#F4F7F6',
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

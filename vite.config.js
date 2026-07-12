import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // El chunk de xlsx (import Excel de deudas) es pesado y de uso poco
        // frecuente — no precachearlo en la instalación de la PWA.
        globIgnores: ['**/xlsx-*.js'],
      },
      manifest: {
        name: 'Wallet Tracker',
        short_name: 'WalletTracker',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  }
})
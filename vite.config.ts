import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // New versions are downloaded in the background and activate on the next open.
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'logo-rk-bendahara.png', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Rajakas.ID — Portal Distributor',
          short_name: 'Rajakas.ID',
          description: 'ERP distributor: penjualan, pembelian, stok, keuangan. Bisa dipakai offline.',
          lang: 'id',
          start_url: '/',
          scope: '/',
          id: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#010B24',
          theme_color: '#010B24',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Cache the whole app (including lazy-loaded pages) so it opens with no internet.
          globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,woff2}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // Supabase (API/auth) is cross-origin and is intentionally NOT cached by the
          // service worker: data caching + the offline queue live in src/lib/offline.ts.
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base relativo ('./'): gli asset vengono referenziati in modo relativo, così
// l'app funziona su GitHub Pages sia su dominio root sia in sotto-cartella
// (es. https://utente.github.io/repo/) senza configurare il nome del repo.
// Il routing usa HashRouter, quindi non servono rewrite lato server.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // aggiorna il service worker senza intervento utente
      injectRegister: 'auto', // inietta la registrazione del SW nel bundle
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'BEVE COMUNQUE VADA',
        short_name: 'BCV',
        description: 'Biglietti e QR code per l\'evento BEVE COMUNQUE VADA — CFLM.',
        lang: 'it',
        // Percorsi relativi: risolvono correttamente anche nella sotto-cartella di GitHub Pages.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache di tutti gli asset buildati → l'app si apre anche offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // I font Google vengono messi in cache runtime (stale-while-revalidate).
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
  },
});

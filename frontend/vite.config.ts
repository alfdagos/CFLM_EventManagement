import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativo ('./'): gli asset vengono referenziati in modo relativo, così
// l'app funziona su GitHub Pages sia su dominio root sia in sotto-cartella
// (es. https://utente.github.io/repo/) senza configurare il nome del repo.
// Il routing usa HashRouter, quindi non servono rewrite lato server.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
  },
});

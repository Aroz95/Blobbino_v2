import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funziona sia su GitHub Pages (/Blobbino/) sia dentro Capacitor.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020', sourcemap: false }
});

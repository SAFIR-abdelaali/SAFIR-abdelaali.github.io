import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // gsap's subpath imports don't resolve under Node's ESM loader, so the prerender bundle inlines them.
  ssr: { noExternal: ['gsap', 'lenis'] },
});

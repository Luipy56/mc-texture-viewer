import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed.ts',
      name: 'McTextureViewer',
      fileName: () => 'mc-texture-viewer.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
});

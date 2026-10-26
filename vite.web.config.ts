import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: resolve('src/renderer'),
  base: './',
  publicDir: resolve('public-web'),
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
    },
  },
  plugins: [react()],
  css: {
    postcss: resolve('.'),
  },
  build: {
    outDir: resolve('out/web'),
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      mangle: true,
      compress: { drop_console: true, drop_debugger: true },
    },
  },
})

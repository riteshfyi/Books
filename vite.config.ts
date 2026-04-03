import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'src',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'renderer'),
    emptyOutDir: true,
  },
  base: './',
  server: {
    port: 5173,
  },
})

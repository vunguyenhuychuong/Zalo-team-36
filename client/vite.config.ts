import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * '/api' duoc proxy sang server Express o cong 4000.
 * Luu y: proxy chi ton tai o dev server va preview — ban `dist` khong co proxy.
 * Khi deploy, chinh server Express phuc vu luon `dist` de cung mot origin
 * (xem cuoi server/src/index.js).
 */
const proxy = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // cho phep mo tu dien thoai cung wifi de test giao dien mobile
    proxy,
  },
  preview: { proxy },
})

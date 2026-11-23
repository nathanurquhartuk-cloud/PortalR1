import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/PortalR1/',
  build: { target: 'esnext', chunkSizeWarningLimit: 1500 },
  server: { port: 3000 },
})

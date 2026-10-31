import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // reachable from other devices in the network (e.g. a phone), not only localhost
    host: true,
  },
})

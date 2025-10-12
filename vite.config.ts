import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Check if Phase 2 is enabled
const isPhase2 = process.env.VITE_PHASE2 === '1';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Bored_Ball/',
  server: {
    port: isPhase2 ? 3003 : 3000
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, isPhase2 ? 'index-phase2.html' : 'index.html')
      }
    }
  }
})



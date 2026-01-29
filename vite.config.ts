import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Check if Phase 2 is enabled
const isPhase2 = process.env.VITE_PHASE2 === '1';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Bored_Ball/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@game': resolve(__dirname, './src/game'),
      '@components': resolve(__dirname, './src/components'),
      '@config': resolve(__dirname, './src/config'),
      '@context': resolve(__dirname, './src/context'),
      '@styles': resolve(__dirname, './src/styles'),
      '@data': resolve(__dirname, './src/data'),
    },
  },
  server: {
    port: isPhase2 ? 3003 : 3000,
    open: isPhase2 ? '/Bored_Ball/index-phase2.html' : '/Bored_Ball/'
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, isPhase2 ? 'index-phase2.html' : 'index.html')
      }
    }
  },
  // NEW: Vitest Configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Will create this file
    css: true, // Enable CSS processing for tests
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', './src/main.tsx', './src/main-phase2.tsx'],
    },
  },
})
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Check if Phase 2 is enabled
const isPhase2 = process.env.VITE_PHASE2 === '1';

// Plugin to serve different HTML based on Phase 2 flag
function phase2HtmlPlugin(): Plugin {
  return {
    name: 'phase2-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '/Bored_Ball/' || req.url === '/Bored_Ball/index.html') {
          const htmlFile = isPhase2 ? 'index-phase2.html' : 'index.html';
          const html = fs.readFileSync(resolve(__dirname, htmlFile), 'utf-8');
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
          return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    phase2HtmlPlugin()
  ],
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



import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for specific globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable polyfills for these Node.js modules
      protocolImports: true,
    }),
  ],
  base: '/italian-semantic-triple-extractor/', // GitHub Pages path
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Polyfill Node.js modules for browser
      'node:process': 'process/browser',
      'node:buffer': 'buffer',
      'node:util': 'util',
    },
  },
  define: {
    // Define process.env for libraries that expect it
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      external: [
        '@chroma-core/default-embed',
        // Remove node:process from external since we're now polyfilling it
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          state: ['zustand'],
          gemini: ['@google/generative-ai'],
          utils: ['marked', 'dompurify', 'crypto-js', 'file-saver', 'papaparse'],
          visualization: ['d3']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
})

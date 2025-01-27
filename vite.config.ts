import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      'react',
      'react-dom',
      '@radix-ui/react-dialog',
      '@tanstack/react-query'
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-dialog',
      '@tanstack/react-query'
    ],
    force: true
  },
  define: {
    'process.env': {},
    'global': {},
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: [
        'http',
        'https',
        'http-proxy-agent',
        'https-proxy-agent',
        'socks-proxy-agent',
        'net',
        'tls',
        'events',
        'assert',
        'node:http',
        'node:https',
        'node:zlib',
        'node:stream',
        'node:buffer',
        'node:util',
        'node:url',
        'node:net',
        'node:events',
        'node:assert',
        'node:tls'
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog'
          ],
          'query-vendor': ['@tanstack/react-query']
        }
      }
    }
  }
}));
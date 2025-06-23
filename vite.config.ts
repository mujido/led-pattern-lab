import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173, // Changed to standard Vite dev port
    cors: true, // Enable CORS for ESP32 WebSocket connection
  },
  base: mode === 'development' ? '/' : './', // Use absolute paths in dev, relative in production
  build: {
    outDir: 'dist',
    assetsDir: '', // Empty string puts assets in root for SPIFFS compatibility
    sourcemap: false, // Disable sourcemaps to save space
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove console functions
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slider', '@radix-ui/react-tooltip'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'lucide-react'],
        },
      },
    },
  },
  plugins: [
    react(),
    nodePolyfills(),
    mode === 'development' &&
    componentTagger(),
    // Add bundle analyzer only in development
    mode === 'development' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
    // Define environment variables for hybrid mode
    __DEV_MODE__: mode === 'development',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
}));

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Only active in production builds; devOptions.enabled skipped to avoid
      // conflicts with Vite's middleware mode used in dev.
      devOptions: { enabled: false },
      // Use our existing manifest.json from publicDir
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Raise limit to accommodate the large (but gzip-small) main bundle
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Don't cache the 365scores external API — those go over the network
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // tRPC API: network-first, 10 s timeout, 5-minute cache
            urlPattern: /^\/api\/trpc\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "trpc-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 60, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Team logos / remote images: cache-first, 30-day TTL
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
            },
          },
          {
            // Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  // Point to the root public/ folder so manifest.json + icons are served
  publicDir: path.resolve(import.meta.dirname, "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-framer": ["framer-motion"],
          "vendor-trpc": ["@trpc/client", "@trpc/react-query", "@tanstack/react-query"],
          "vendor-ui": ["@radix-ui/react-tabs", "@radix-ui/react-dialog", "@radix-ui/react-select", "lucide-react"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});

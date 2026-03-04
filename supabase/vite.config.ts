import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "audio/*.mp3"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,mp3,woff2}"],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /\.mp3$/,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quran-verses-cache",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      manifest: {
        name: "جزء عم – بصوت الشيخ محمد شريف",
        short_name: "جزء عم",
        description: "تطبيق تشغيل القرآن الكريم - جزء عم بصوت الشيخ محمد شريف",
        theme_color: "#0f2518",
        background_color: "#0f2518",
        display: "standalone",
        display_override: ["standalone"],
        orientation: "portrait",
        dir: "rtl",
        lang: "ar",
        start_url: "/",
        id: "/",
        categories: ["education", "lifestyle"],
        shortcuts: [
          {
            name: "سورة الفاتحة",
            url: "/?surah=1",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
        screenshots: [
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "جزء عم - الشاشة الرئيسية",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "جزء عم - الشاشة الرئيسية",
          },
        ],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

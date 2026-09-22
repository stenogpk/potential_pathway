import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isCapacitorBuild = process.env.VITE_CAPACITOR_BUILD === "true";
const base = process.env.VITE_WEB_BUILD === "true" ? "/potential_pathway/" : "./";

export default defineConfig({
  // Keep the web build portable. The Capacitor preparation step rewrites the
  // final HTML to use a relative script URL so it also works from the native
  // WebView asset server.
  base,
  plugins: [react()],
  build: isCapacitorBuild
    ? {
        target: "es2019",
        modulePreload: false,
        rollupOptions: {
          output: {
            format: "iife",
            inlineDynamicImports: true,
            entryFileNames: "assets/app.js",
            chunkFileNames: "assets/chunk-[name]-[hash].js",
            assetFileNames: "assets/[name]-[hash][extname]",
          },
        },
      }
    : {
        target: "es2019",
      },
});

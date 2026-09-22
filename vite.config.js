import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const standalone = process.env.VITE_STANDALONE_BUILD === "true";

export default defineConfig({
  // Relative asset URLs work from GitHub Pages, the browser test branch, and
  // Capacitor's local WebView asset server.
  base: "./",
  plugins: [react()],
  build: standalone
    ? {
        target: "es2019",
        modulePreload: false,
        rollupOptions: {
          output: {
            format: "iife",
            inlineDynamicImports: true,
            entryFileNames: "assets/app.js",
            assetFileNames: "assets/[name]-[hash][extname]",
          },
        },
      }
    : {
        target: "es2019",
      },
});

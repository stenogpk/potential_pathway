import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset URLs work both from GitHub Pages and Capacitor's local WebView.
  base: "./",
  plugins: [react()],
  build: {
    target: "es2019",
    modulePreload: false,
  },
});

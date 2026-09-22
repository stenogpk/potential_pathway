import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Capacitor's local Android server serves the web bundle from the app root.
  // Use root-relative production assets instead of the GitHub Pages path.
  base: "/",
  plugins: [react()],
  build: {
    target: "es2019",
  },
});

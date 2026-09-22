import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Capacitor and the browser test branch both serve the built site from the app root.
  base: "./",
  plugins: [react()],
  build: {
    target: "es2019",
    modulePreload: false,
  },
});

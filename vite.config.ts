import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { projectsMarkdownPlugin } from "./scripts/parse-projects.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), projectsMarkdownPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

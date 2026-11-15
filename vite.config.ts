import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { projectsMarkdownPlugin } from "./scripts/parse-projects.js";

const vendorChunk = (id: string): string | undefined => {
  if (!id.includes("node_modules")) return undefined;

  // Router before React so react-router-dom doesn't fall into the React chunk.
  if (id.includes("node_modules/react-router")) return "react-router";
  if (
    id.includes("node_modules/react-dom") ||
    id.includes("node_modules/react/") ||
    id.includes("node_modules/scheduler")
  ) {
    return "react-vendor";
  }
  if (id.includes("node_modules/gsap") || id.includes("node_modules/@gsap")) {
    return "gsap";
  }
  if (id.includes("node_modules/ogl")) return "ogl";
  if (id.includes("node_modules/motion")) return "motion";

  return undefined;
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), projectsMarkdownPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    // Keep vendor groups stable between deploys so long-term caching works.
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
});

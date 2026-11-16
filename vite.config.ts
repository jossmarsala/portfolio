import fs from "node:fs";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
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

/**
 * Injects the bento poster frames into the document head.
 *
 * The works grid is lazy and mounts at idle, roughly when the intro loader
 * hands control back — exactly when a visitor can start scrolling. Preloading
 * the four stills (a few tens of KB in total, versus megabytes of video) means
 * the tiles are already painted the instant they come into view, while the
 * videos keep buffering in the background.
 *
 * URLs come from the generated CDN map, so they follow every re-upload.
 */
function bentoPosterPreloads(): Plugin {
  const mapPath = fileURLToPath(
    new URL("./src/config/cdn-assets-map.json", import.meta.url),
  );

  return {
    name: "bento-poster-preloads",
    transformIndexHtml() {
      const map = JSON.parse(fs.readFileSync(mapPath, "utf8")) as {
        assets: Record<string, string>;
      };

      const posters = Object.entries(map.assets)
        .filter(([name]) => /^BENTO__.*\.webp$/.test(name))
        .map(([, url]) => url);

      return posters.map((href) => ({
        tag: "link",
        attrs: {
          rel: "preload",
          as: "image",
          href,
        },
        injectTo: "head" as const,
      }));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), bentoPosterPreloads(), projectsMarkdownPlugin()],
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

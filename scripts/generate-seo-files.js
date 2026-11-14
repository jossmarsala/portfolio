import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Post-build SEO files. Kept out of /public so the project list stays derived
 * from the single source of truth (src/config/projects.ts).
 *
 * Usage: VITE_SITE_URL=https://example.com node scripts/generate-seo-files.js
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const configPath = path.join(root, "src", "config", "projects.ts");

const siteUrl = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  // Keep in sync with DEFAULT_SITE_URL in src/config/site.ts.
  "https://josmarsala.vercel.app"
).replace(/\/+$/, "");

if (!fs.existsSync(distDir)) {
  console.warn("[seo] dist/ not found — run vite build first.");
  process.exit(0);
}

const config = fs.readFileSync(configPath, "utf8");

// Projects that redirect to a live site are intentionally left out of the
// sitemap; their in-app case-study route is not the canonical destination.
const directLinkBlock =
  config.match(/DIRECT_LINK_SLUGS\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "";
const directLinks = new Set(
  [...directLinkBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
);

const slugs = [
  ...new Set(
    [...config.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((match) => match[1]),
  ),
].filter((slug) => !directLinks.has(slug));

const lastModified = new Date().toISOString().slice(0, 10);

const urlEntries = [
  `  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`,
  ...slugs.sort().map(
    (slug) => `  <url>
    <loc>${siteUrl}/projects/${slug}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.8</priority>
  </url>`,
  ),
].join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(distDir, "robots.txt"), robots);

console.log(
  `[seo] Wrote sitemap.xml (${slugs.length + 1} URLs) and robots.txt for ${siteUrl}`,
);

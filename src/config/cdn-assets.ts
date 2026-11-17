import map from "./cdn-assets-map.json";

/**
 * Base origin for the generated asset map.
 *
 * Empty means the media ships with the deployment and every entry is a
 * same-origin `/media/…` path. Set it (and rebuild the map with absolute URLs)
 * only when the assets are served from a separate origin.
 */
export const CDN_BASE_URL: string = map.baseUrl;

/** Standardized asset filename → public URL. */
export const CDN_ASSETS: Record<string, string> = map.assets;

/**
 * Resolves a standardized media filename (e.g. "MISU__hero-cover.mp4") to its
 * public URL. Throws during development if the name is not in the map, so a
 * typo fails fast instead of silently rendering a broken image.
 */
export function cdnAsset(name: keyof typeof CDN_ASSETS): string {
  const url = CDN_ASSETS[name];
  if (!url) {
    throw new Error(
      `Unknown media asset "${String(name)}". Run \`npm run media:build\` to refresh src/config/cdn-assets-map.json.`,
    );
  }
  return url;
}

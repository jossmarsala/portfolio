/**
 * Single switch for local media vs. a CDN.
 *
 * Set VITE_MEDIA_BASE_URL (e.g. https://cdn.example.com/portfolio) to serve
 * every relative media path from that origin. Absolute URLs are passed through
 * untouched, so individual assets can still opt out.
 */
const configuredBase = (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined)
  ?.trim()
  .replace(/\/+$/, "");

export const MEDIA_BASE_URL = configuredBase ?? "";

const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

/** Resolves a project media path against the configured media base. */
export function mediaUrl(path: string): string {
  if (!path) return path;
  if (
    ABSOLUTE_URL.test(path) ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return MEDIA_BASE_URL ? `${MEDIA_BASE_URL}${normalized}` : normalized;
}

/** True for video sources (mp4/webm/mov/ogg), including query strings. */
export function isVideoSource(src: string): boolean {
  return /\.(mp4|webm|mov|ogg)($|\?)/i.test(src);
}

/** Derives a static fallback path from a video path (defaults to .webp). */
export function posterFromVideo(src: string, extension = ".webp"): string {
  return src.replace(/\.(mp4|webm|mov|ogg)($|\?)/i, `${extension}$2`);
}

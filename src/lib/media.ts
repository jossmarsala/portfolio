import { CDN_ASSETS } from "../config/cdn-assets";

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

const CDN_ASSET_URLS = new Set(Object.values(CDN_ASSETS));

const VIDEO_MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".ogg": "video/ogg",
};

export interface VideoSource {
  src: string;
  type: string;
}

/** MIME type for a video URL, or undefined when the extension is unknown. */
export function videoMimeType(src: string): string | undefined {
  const match = /\.(mp4|webm|mov|ogg)($|\?)/i.exec(src);
  return match ? VIDEO_MIME_TYPES[`.${match[1].toLowerCase()}`] : undefined;
}

/**
 * Builds the `<source>` list for a video.
 *
 * H.264 keeps playback universal (Safari/iOS can reject VP9 WebM even when
 * `canPlayType` reports support). When the CDN map contains an MP4 sibling for
 * a WebM source it is listed first, with the WebM as the fallback.
 */
export function videoSourcesFor(src: string): VideoSource[] {
  const primary = mediaUrl(src);
  if (!isVideoSource(primary)) return [];

  const sources: VideoSource[] = [];

  if (/\.webm(\?|$)/i.test(primary)) {
    const mp4 = primary.replace(/\.webm(\?|$)/i, ".mp4$1");
    if (CDN_ASSET_URLS.has(mp4)) {
      sources.push({ src: mp4, type: "video/mp4" });
    }
  }

  sources.push({
    src: primary,
    type: videoMimeType(primary) ?? "video/mp4",
  });

  return sources;
}

/**
 * Poster for a video: its `.webp` sibling, only when that file is a known CDN
 * asset so we never point the poster at a 404.
 */
export function posterForVideoSource(src: string): string | undefined {
  const resolved = mediaUrl(src);
  if (!isVideoSource(resolved)) return undefined;

  const poster = posterFromVideo(resolved);
  return CDN_ASSET_URLS.has(poster) ? poster : undefined;
}

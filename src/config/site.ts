import { cdnAsset } from "./cdn-assets";

/**
 * Production fallback when VITE_SITE_URL is not configured. Keep this in sync
 * with the fallback in scripts/generate-seo-files.js.
 */
export const DEFAULT_SITE_URL = "https://josmarsala.vercel.app";

/**
 * Central site metadata. Override the production origin with VITE_SITE_URL so
 * canonical URLs, Open Graph tags and the generated sitemap all agree.
 */
const configuredUrl = (
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() ||
  DEFAULT_SITE_URL
).replace(/\/+$/, "");

export const SITE = {
  name: "Jos Marsala",
  title: "Jos Marsala — Designer & Developer",
  description:
    "Portfolio of Jos Marsala, a digital product designer and developer building systems and brands where design and technology work as one.",
  defaultImage: cdnAsset("ABOUT.webp"),
  locale: "en_US",
  twitterHandle: "",
  url: configuredUrl,
} as const;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  try {
    return new URL(path, `${SITE.url}/`).toString();
  } catch {
    return path;
  }
}

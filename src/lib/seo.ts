import { useEffect } from "react";
import { absoluteUrl, SITE } from "@/config/site";

export interface SeoOptions {
  title: string;
  description: string;
  /** Site-relative canonical path, e.g. "/projects/misu". */
  path?: string;
  /** Site-relative or absolute image used for social cards. */
  image?: string;
  /** Open Graph object type. */
  type?: "website" | "article";
  /** Prevent indexing (404s, redirects, private pages). */
  noindex?: boolean;
  /** Optional schema.org payload rendered as JSON-LD. */
  jsonLd?: Record<string, unknown>;
}

const JSON_LD_ID = "seo-json-ld";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Converts markdown-ish case-study copy into a clean meta description. */
export function toMetaDescription(
  raw: string,
  maxLength = 160,
): string {
  const plain = raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Keeps document.title, description, canonical and social tags in sync with the
 * active route. Safe to call from both layout and case-study pages — the last
 * mounted page wins.
 */
export function useSeo({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoOptions) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const resolvedPath =
      path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    const canonical = absoluteUrl(resolvedPath);
    const imageUrl = absoluteUrl(image ?? SITE.defaultImage);
    const metaDescription = toMetaDescription(description);

    document.title = title;

    upsertMeta("name", "description", metaDescription);
    upsertMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");

    upsertMeta("property", "og:site_name", SITE.name);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", metaDescription);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:locale", SITE.locale);

    upsertMeta("name", "twitter:card", "summary_large_image");
    if (SITE.twitterHandle) {
      upsertMeta("name", "twitter:site", SITE.twitterHandle);
      upsertMeta("name", "twitter:creator", SITE.twitterHandle);
    }
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", metaDescription);
    upsertMeta("name", "twitter:image", imageUrl);

    upsertCanonical(canonical);

    let script = document.getElementById(JSON_LD_ID) as
      | HTMLScriptElement
      | null;

    if (jsonLdKey) {
      if (!script) {
        script = document.createElement("script");
        script.id = JSON_LD_ID;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = jsonLdKey;
    } else if (script) {
      script.remove();
    }
  }, [title, description, path, image, type, noindex, jsonLdKey]);
}

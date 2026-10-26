import { useState, useEffect } from "react";
import type { Lang } from "../context/LanguageContext";
import type {
  ProjectMetric,
  ProjectAward,
  ProjectProcessStep,
} from "../config/projects";

/** Shape of every project locale JSON file */
export interface ProjectLocale {
  tags: string[];
  summary: string;
  role: string;
  galleryDescription: string;
  processSteps: ProjectProcessStep[];
  awards: ProjectAward[];
  metrics: ProjectMetric[];
}

type Status = "idle" | "loading" | "ready" | "error";

interface UseProjectContentResult {
  content: ProjectLocale | null;
  status: Status;
}

/**
 * Dynamically loads `/locales/projects/<slug>/<lang>.json` from the public
 * directory. Falls back gracefully: es → en → null.
 *
 * Vite serves everything in /public at root, so fetch paths are relative to
 * the domain root — no bundler import needed.
 */
export function useProjectContent(
  slug: string,
  lang: Lang,
): UseProjectContentResult {
  const [content, setContent] = useState<ProjectLocale | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    async function load() {
      // Try requested locale first, then fall back to "en"
      const locales: Lang[] = lang === "en" ? ["en"] : [lang, "en"];

      for (const locale of locales) {
        try {
          const url = `/locales/projects/${slug}/${locale}.json`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const data: ProjectLocale = await res.json();
          if (!cancelled) {
            setContent(data);
            setStatus("ready");
          }
          return;
        } catch {
          // try next locale
        }
      }

      if (!cancelled) {
        setContent(null);
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  return { content, status };
}

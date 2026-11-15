import { cdnAsset } from "./cdn-assets";

export interface ProjectMetric {
  value: string;
  label: string;
}

export interface ProjectAward {
  name: string;
  issuer: string;
  year: string;
}

export interface ProjectProcessStep {
  index: string; // e.g. "01"
  title: string;
  description: string;
}

export interface ProjectItem {
  slug: string;
  title: string;
  year: string;
  imageUrl: string;
  videoUrl?: string;
  url?: string;
  highlightWords?: string[];
  // Media
  galleryImages?: string[];
  processImageUrl?: string;
  galleryAspectRatio?: "3/4" | "landscape";
  /** Label used for the process/features section. Defaults to "process". */
  processLabel?: "process" | "features";
}

/**
 * Projects temporarily linking straight to their live site instead of opening
 * the in-app case study. Remove a slug from this set to restore its case study.
 */
export const DIRECT_LINK_SLUGS = new Set(["vitalia", "posdata", "ascii"]);

export const PROJECTS_DATA: Record<string, ProjectItem> = {
  vitalia: {
    slug: "vitalia",
    title: "vitalia",
    year: "2024",
    imageUrl: cdnAsset("VITALIA__hero-cover.mp4"),
    videoUrl: cdnAsset("VITALIA__hero-cover.mp4"),
    url: "https://vitalia-selfcare.vercel.app/",
    highlightWords: ["personalized", "wellness", "inclusive"],
    galleryImages: [
      cdnAsset("VITALIA_hero-cover.webm"),
      "https://assets.codepen.io/7558/bw-portrait-002.jpg",
      "https://assets.codepen.io/7558/bw-portrait-003.jpg",
      "https://assets.codepen.io/7558/bw-portrait-008.jpg",
      "https://assets.codepen.io/7558/bw-portrait-010.jpg",
    ],
    processImageUrl: "https://assets.codepen.io/7558/bw-portrait-009.jpg",
  },
  misu: {
    slug: "misu",
    title: "misu",
    year: "2026",
    imageUrl: cdnAsset("MISU__hero-video.webm"),
    videoUrl: cdnAsset("MISU__hero-video.webm"),
    url: "https://misu-os.vercel.app",
    highlightWords: ["energy", "adaptive", "focus"],
    galleryAspectRatio: "3/4",
    processLabel: "features",
    galleryImages: [
      cdnAsset("MISU__mockup-poster.webp"),
      cdnAsset("MISU__energies-show.webp"),
      cdnAsset("MISU__design-tokens.webp"),
      cdnAsset("MISU__mockup-computer.gif"),
    ],
  },
  gypsy: {
    slug: "gypsy",
    title: "gypsy joyas",
    year: "2025",
    imageUrl: cdnAsset("GYPSY_mockup-phone.webp"),
    url: "https://gypsy-joyas.vercel.app/",
    highlightWords: ["artisan", "real-time", "autonomous"],
    galleryAspectRatio: "3/4",
    processLabel: "features",
    galleryImages: [
      cdnAsset("GYPSY_mockup-phone.webp"),
      cdnAsset("GYPSY__design-tokens.webp"),
      cdnAsset("GYPSY__responsive-mockup.webp"),
    ],
    processImageUrl: "https://assets.codepen.io/7558/bw-portrait-009.jpg",
  },
  posdata: {
    slug: "posdata",
    title: "posdata studio",
    year: "2026",
    imageUrl: cdnAsset("POSDATA__hero-video.mp4"),
    videoUrl: cdnAsset("POSDATA__hero-video.mp4"),
    url: "https://posdatastudio.vercel.app",
    highlightWords: ["archive", "editorial", "obsolescence"],
    galleryImages: [
      "https://assets.codepen.io/7558/bw-portrait-009.jpg",
      "https://assets.codepen.io/7558/bw-portrait-002.jpg",
      "https://assets.codepen.io/7558/bw-portrait-003.jpg",
      "https://assets.codepen.io/7558/bw-portrait-008.jpg",
      "https://assets.codepen.io/7558/bw-portrait-010.jpg",
    ],
    processImageUrl: "https://assets.codepen.io/7558/bw-portrait-001.jpg",
  },
  ascii: {
    slug: "ascii",
    title: "lilium cyber",
    year: "2025",
    imageUrl: cdnAsset("LILIUM__hero-cover.webm"),
    videoUrl: cdnAsset("LILIUM__hero-cover.webm"),
    url: "https://lilium-cyber.vercel.app",
    highlightWords: ["real-time", "volumetric", "monospace"],
    galleryImages: [
      cdnAsset("LILIUM__app-showcase.webm"),
      cdnAsset("LILIUM__mockup-book.webp"),
      "https://assets.codepen.io/7558/bw-portrait-003.jpg",
      "https://assets.codepen.io/7558/bw-portrait-008.jpg",
      "https://assets.codepen.io/7558/bw-portrait-010.jpg",
    ],
    processImageUrl: "https://assets.codepen.io/7558/bw-portrait-009.jpg",
  },
};

/** Case-study slugs derived from the single source of truth. */
export const PROJECT_SLUGS = Object.keys(PROJECTS_DATA);

/** Case-insensitive project lookup for route params. */
export function getProject(slug: string | undefined | null): ProjectItem | undefined {
  if (!slug) return undefined;
  return PROJECTS_DATA[slug.toLowerCase()];
}

/** Live-site target for projects that temporarily bypass the case study. */
export function getDirectLinkUrl(slug: string | null | undefined): string | null {
  const project = getProject(slug);
  if (!project || !DIRECT_LINK_SLUGS.has(project.slug)) return null;
  return project.url ?? null;
}

/** Picks a non-video image suitable for Open Graph / Twitter cards. */
export function getProjectOgImage(project: ProjectItem): string {
  const isVideo = (src: string) => /\.(mp4|webm|mov|ogg)($|\?)/i.test(src);

  if (!isVideo(project.imageUrl)) return project.imageUrl;

  const galleryImage = project.galleryImages?.find((src) => !isVideo(src));
  if (galleryImage) return galleryImage;

  if (project.processImageUrl && !isVideo(project.processImageUrl)) {
    return project.processImageUrl;
  }

  return project.imageUrl;
}

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
    imageUrl: "/projects/vitalia/videos/HERO.mp4",
    videoUrl: "/projects/vitalia/videos/HERO.mp4",
    url: "https://vitalia-selfcare.vercel.app/",
    highlightWords: ["personalized", "wellness", "inclusive"],
    galleryImages: [
      "/projects/vitalia/videos/gif-reels-vitalia.mp4",
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
    imageUrl: "/projects/misu/videos/HERO.mp4",
    videoUrl: "/projects/misu/videos/HERO.mp4",
    url: "https://misu-os.vercel.app",
    highlightWords: ["energy", "adaptive", "focus"],
    galleryAspectRatio: "3/4",
    processLabel: "features",
    galleryImages: [
      "/optimized/carousel/misu__poster-carousel.png",
      "/projects/misu/images/images-portfolio-misu_catalog.png",
      "/projects/misu/images/images-portfolio-misu_designsystem.png",
      "/projects/misu/images/misu__gif.gif",
    ],
  },
  gypsy: {
    slug: "gypsy",
    title: "gypsy joyas",
    year: "2025",
    imageUrl: "/projects/gypsy/images/HERO.webp",
    url: "https://gypsy-joyas.vercel.app/",
    highlightWords: ["artisan", "real-time", "autonomous"],
    galleryAspectRatio: "3/4",
    processLabel: "features",
    galleryImages: [
      "/projects/gypsy/images/gypsy__mockupphone.webp",
      "/projects/gypsy/images/gypsy__designsystem.webp",
      "/projects/gypsy/images/gypsy__responsivemockup.webp",
    ],
    processImageUrl: "https://assets.codepen.io/7558/bw-portrait-009.jpg",
  },
  posdata: {
    slug: "posdata",
    title: "posdata studio",
    year: "2026",
    imageUrl: "/projects/posdata/videos/HERO.mp4?v=2",
    videoUrl: "/projects/posdata/videos/HERO.mp4?v=2",
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
    imageUrl: "/projects/lilium/videos/HERO.mp4",
    videoUrl: "/projects/lilium/videos/HERO.mp4",
    url: "https://lilium-cyber.vercel.app",
    highlightWords: ["real-time", "volumetric", "monospace"],
    galleryImages: [
      "/projects/lilium/images/HERO.webp",
      "https://assets.codepen.io/7558/bw-portrait-002.jpg",
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

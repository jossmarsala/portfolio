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
      "/projects/misu/images/images-portfolio-misu_catalog.png",
      "/projects/misu/images/misu__gif.gif",
      "/projects/misu/images/images-portfolio-misu_designsystem.png",
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
  faro: {
    slug: "faro",
    title: "faro stock manager",
    year: "2026",
    imageUrl: "https://assets.codepen.io/7558/bw-portrait-001.jpg",
    url: "https://faro.app",
    highlightWords: ["frictionless", "cockpit", "lightning-fast"],
    galleryImages: [
      "https://assets.codepen.io/7558/bw-portrait-001.jpg",
      "https://assets.codepen.io/7558/bw-portrait-002.jpg",
      "https://assets.codepen.io/7558/bw-portrait-003.jpg",
      "https://assets.codepen.io/7558/bw-portrait-008.jpg",
      "https://assets.codepen.io/7558/bw-portrait-010.jpg",
    ],
    processImageUrl: "https://assets.codepen.io/7558/bw-portrait-009.jpg",
  },
};

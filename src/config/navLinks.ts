/**
 * Shared navigation links — single source of truth for Navbar and Footer.
 * Add, remove, or reorder links here and both components update automatically.
 */
export const NAV_LINKS = [
  { label: "work", href: "#work" },
  { label: "about", href: "#about" },
  { label: "resume", href: "#resume" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];

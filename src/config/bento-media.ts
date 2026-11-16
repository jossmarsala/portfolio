import { cdnAsset } from "./cdn-assets";

/**
 * Media for the index-page bento tiles.
 *
 * These are deliberately *not* the 1920×1080 case-study masters: each tile is
 * at most ~450 CSS px wide, so the bentos use tiny 720–1440 px derivatives plus
 * a poster frame (see `npm run optimize:bento`). The whole set is < 2 MB, which
 * lets the grid paint a still immediately and start looping before the visitor
 * has scrolled down to it.
 *
 * Video posters follow the CDN naming convention `<video>.webp`, so
 * `SourceVideo` attaches them automatically.
 */
export type BentoMedia =
  | {
      kind: "video";
      /** Muted, looping clip sized for its tile. */
      src: string;
    }
  | { kind: "image"; src: string }
  /** Empty "new project" tile — no media, just the plus mark. */
  | { kind: "cta" };

/** The three large tiles, left to right. */
export const BENTO_MAIN_MEDIA: readonly BentoMedia[] = [
  { kind: "video", src: cdnAsset("BENTO__VITALIA.mp4") },
  { kind: "video", src: cdnAsset("BENTO__MISU.mp4") },
  { kind: "image", src: cdnAsset("BENTO__GYPSY.webp") },
];

/** Side-project tiles, in grid order; the last slot is the "new project" CTA. */
export const BENTO_SIDE_MEDIA: readonly BentoMedia[] = [
  { kind: "video", src: cdnAsset("BENTO__POSDATA.mp4") },
  { kind: "video", src: cdnAsset("BENTO__LILIUM.mp4") },
  { kind: "cta" },
];

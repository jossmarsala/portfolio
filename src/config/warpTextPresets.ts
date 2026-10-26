import type { Props as WarpTextProps } from "../WarpText";

/**
 * Shared WarpText props for the two-column typographic headline
 * used in WorksSection ("my / works." / "mi / trabajo.").
 *
 * Sizing is 100% fixed and responsive, calibrated so both columns
 * and all languages share the exact same scale without dynamic shrinking or stretching.
 */
export const WARP_HEADLINE_PROPS: Partial<WarpTextProps> = {
  color: "#ffffff",
  warpStrength: 0.18,
  warpScale: 2.8,
  speed: 0.6,
  pointerInfluence: 0.55,
  pointerStrength: 0.75,
  refraction: 0.045,
  ripple: true,
  autoFit: false,
  fontSize: "clamp(3rem, 11.2vw, 13.8rem)",
  fontWeight: 700,
  fontFamily: "var(--font-family-main)",
  letterSpacing: "-0.06em",
  lineHeight: 0.9,
  style: {
    height: "clamp(210px, 32vw, 470px)",
    width: "100%",
    filter: "invert(1)",
  },
} as const;

/**
 * WarpText props for the Footer ("let's / talk.") headline,
 * calibrated to be noticeably bigger and bolder.
 */
export const WARP_FOOTER_HEADLINE_PROPS: Partial<WarpTextProps> = {
  ...WARP_HEADLINE_PROPS,
  fontSize: "clamp(3.2rem, 11vw, 13rem)",
  style: {
    ...WARP_HEADLINE_PROPS.style,
    height: "clamp(160px, 24vw, 340px)",
  },
} as const;

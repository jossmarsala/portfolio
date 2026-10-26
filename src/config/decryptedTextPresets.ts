import type { DecryptedTextProps } from "../DecryptedText";

/**
 * Default DecryptedText props for nav-style interactive labels.
 * Spread this onto any <DecryptedText> that uses hover-decrypt navigation styling.
 *
 * Usage:
 *   <DecryptedText {...DECRYPTED_NAV} text={label} className="my-revealed" encryptedClassName="my-enc" />
 */
export const DECRYPTED_NAV: Partial<DecryptedTextProps> = {
  animateOn: "hover",
  sequential: true,
  revealDirection: "start",
  speed: 50,
  maxIterations: 10,
  characters: "abcdefghijklmnopqrstuvwxyz!@#$%^&*",
} as const;

/**
 * Variant with slightly slower speed for longer strings (e.g. email addresses).
 */
export const DECRYPTED_NAV_SLOW: Partial<DecryptedTextProps> = {
  ...DECRYPTED_NAV,
  speed: 42,
  maxIterations: 12,
  characters: "abcdefghijklmnopqrstuvwxyz.@!#$%",
} as const;

/**
 * Preset for bento image label titles (lowercase words, slightly faster).
 */
export const DECRYPTED_LABEL: Partial<DecryptedTextProps> = {
  animateOn: "hover",
  sequential: true,
  revealDirection: "start",
  speed: 45,
  maxIterations: 10,
  characters: "abcdefghijklmnopqrstuvwxyz!@#$%^&*",
} as const;

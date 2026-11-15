import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single entry point for GSAP used by the app.
 *
 * Import this module dynamically (e.g. `import("@/lib/gsap")`) from anything
 * that is allowed to run before first paint. Code in lazily-loaded chunks may
 * import it statically because those chunks are fetched after the shell paints.
 */
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
export default gsap;

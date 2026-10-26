import { useEffect, type RefObject } from "react";
import gsap from "gsap";

interface UseParallaxItemOptions {
  /** Scale applied to the image on hover. Defaults to 1.01 (subtle). */
  hoverScale?: number;
  /** Max pixel offset on the X axis. Defaults to 8. */
  maxOffsetX?: number;
  /** Max pixel offset on the Y axis. Defaults to 6. */
  maxOffsetY?: number;
}

/**
 * Attaches a parallax mouse-move effect to a set of item/image pairs.
 * When the user moves the cursor over an item the underlying image drifts
 * in the opposite direction, creating a subtle depth illusion.
 *
 * Extracted from BentoImages and BentoSideProjects (where it was copy-pasted verbatim).
 *
 * @param itemRefs - Refs to the outer card elements that listen for mouse events.
 * @param imgRefs  - Refs to the inner <img> elements that get transformed.
 * @param options  - Optional tuning values.
 * @param deps     - Additional dependency values that should re-run the effect (e.g. triggerPlay).
 */
export function useParallaxItem(
  itemRefs: RefObject<(HTMLDivElement | null)[]>,
  imgRefs: RefObject<(HTMLElement | null)[]>,
  options: UseParallaxItemOptions = {},
  deps: unknown[] = [],
) {
  const { hoverScale = 1.01, maxOffsetX = 8, maxOffsetY = 6 } = options;

  useEffect(() => {
    const items = itemRefs.current?.filter(Boolean) as HTMLDivElement[];
    const imgs = imgRefs.current?.filter(Boolean) as HTMLElement[];
    if (!items || items.length === 0) return;

    const handlers: Array<{
      el: HTMLDivElement;
      onMove: (e: MouseEvent) => void;
      onLeave: () => void;
    }> = [];

    items.forEach((item, i) => {
      const img = imgs[i];
      if (!item || !img) return;

      const onMove = (e: MouseEvent) => {
        const rect = item.getBoundingClientRect();
        // Normalised -1 → +1 from center
        const nx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const ny = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        // Image moves opposite to cursor: subtle depth illusion
        gsap.to(img, {
          x: -nx * maxOffsetX,
          y: -ny * maxOffsetY,
          scale: hoverScale,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const onLeave = () => {
        gsap.to(img, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.0,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      item.addEventListener("mousemove", onMove);
      item.addEventListener("mouseleave", onLeave);
      handlers.push({ el: item, onMove, onLeave });
    });

    return () => {
      handlers.forEach(({ el, onMove, onLeave }) => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useParallaxItem;

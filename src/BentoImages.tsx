import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BentoLabel from "./components/BentoLabel";
import SourceVideo from "./components/media/SourceVideo";
import useParallaxItem from "./hooks/useParallaxItem";
import type { BentoMedia } from "./config/bento-media";

import "./BentoImages.css";

gsap.registerPlugin(ScrollTrigger);

const WORK_TITLES = [
  { title: "vitalia", sub: "2024", slug: "vitalia" },
  { title: "misu", sub: "2026", slug: "misu" },
  { title: "gypsy", sub: "2026", slug: "gypsy" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface BentoImagesProps {
  /** Tile media, already sized for the grid; video posters derive from `<src>.webp`. */
  media: readonly BentoMedia[];
  /** When this flips true the grid columns and big images animate in. */
  triggerPlay: boolean;
  className?: string;
  onAnimComplete?: () => void;
  onProjectSelect?: (slug: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BentoImages({
  media,
  triggerPlay,
  className = "",
  onAnimComplete,
  onProjectSelect,
}: BentoImagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<HTMLDivElement[]>([]);
  const cellImgRefs = useRef<HTMLElement[]>([]);
  const itemRefs = useRef<HTMLDivElement[]>([]);
  const heroTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const setCell = (el: HTMLDivElement | null, i: number) => {
    if (el) cellRefs.current[i] = el;
  };

  const setCellImg = (el: HTMLElement | null, i: number) => {
    if (el) cellImgRefs.current[i] = el;
  };

  const setItem = (el: HTMLDivElement | null, i: number) => {
    if (el) itemRefs.current[i] = el;
  };

  // Initial state on mount
  useEffect(() => {
    const items = itemRefs.current;
    const cellImgs = cellImgRefs.current;

    gsap.set(items, {
      y: -40,
      scale: 0.95,
      opacity: 0,
      clipPath: "inset(0% 0% 100% 0%)",
    });
    gsap.set(cellImgs, { scale: 1, willChange: "transform" });
  }, []);

  useEffect(() => {
    const items = itemRefs.current;
    const cellImgs = cellImgRefs.current;
    if (items.length === 0 || !containerRef.current) return;

    // Reset properties so ScrollTrigger can control them properly
    gsap.set(items, {
      y: -40,
      scale: 0.95,
      opacity: 0,
      clipPath: "inset(0% 0% 100% 0%)",
    });
    gsap.set(cellImgs, { scale: 1 });

    // Hero section animation: sweep reveal + subtle bounce
    const heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
        end: "center 35%",
        scrub: 1.5, // Slower, smoother catch-up feel
        onLeave: () => {
          if (onAnimComplete) onAnimComplete();
        },
      },
    });
    heroTimelineRef.current = heroTimeline;

    // 1. Sweep reveal downwards (clip-path)
    heroTimeline.to(
      items,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.9,
        ease: "expo.inOut",
        stagger: 0.1,
      },
      0,
    );

    // 2. Subtle entrance (y + scale + opacity)
    heroTimeline.to(
      items,
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 1.0,
        ease: "back.out(1.2)",
        stagger: 0.1,
      },
      0,
    );

    // 3. Image zoom settling
    heroTimeline.to(
      cellImgs,
      {
        scale: 1,
        duration: 1.2,
        ease: "power2.out",
        stagger: 0.1,
      },
      0.04,
    );

    return () => {
      if (heroTimeline.scrollTrigger) heroTimeline.scrollTrigger.kill();
      heroTimeline.kill();
    };
  }, [onAnimComplete]);

  // ── Parallax depth ──────
  useParallaxItem(
    itemRefs as React.RefObject<(HTMLDivElement | null)[]>,
    cellImgRefs as React.RefObject<(HTMLImageElement | null)[]>,
    { hoverScale: 1.01 },
    [triggerPlay],
  );

  // GSAP cleanup on unmount
  useEffect(() => {
    return () => {
      heroTimelineRef.current?.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={"bento-images__wrapper " + className}
      aria-label="Selected works gallery"
    >
      {/* Asymmetric Bento Grid */}
      <div className="bento-images__grid">
        {media.slice(0, 3).map((item, i) => {
          return (
            <div
              key={i}
              ref={(el) => setItem(el, i)}
              className={`bento-images__item bento-images__item--${i + 1}`}
              data-cursor-project={onProjectSelect ? "true" : undefined}
              onClick={() => {
                if (onProjectSelect) {
                  onProjectSelect(WORK_TITLES[i].slug);
                }
              }}
              style={{ cursor: onProjectSelect ? "pointer" : "default" }}
            >
              <div
                ref={(el) => setCell(el, i)}
                className={`bento-images__cell bento-images__cell--${i + 1}`}
              >
                <div className="bento-images__cell-frame">
                  {item.kind === "video" ? (
                    <SourceVideo
                      key={item.src}
                      ref={(el) => setCellImg(el, i)}
                      src={item.src}
                      className="bento-images__cell-img"
                      /* Buffer now: the grid mounts long before it is reached. */
                      preload="auto"
                      autoPlay
                      loop
                      muted
                      playsInline
                      disablePictureInPicture
                    />
                  ) : item.kind === "image" ? (
                    <img
                      ref={(el) => setCellImg(el, i)}
                      src={item.src}
                      alt={WORK_TITLES[i]?.title ?? `Work ${i + 1}`}
                      className="bento-images__cell-img"
                      /* Eager: this tile is part of the grid's first paint. */
                      loading="eager"
                      decoding="async"
                      draggable={false}
                    />
                  ) : null}
                </div>
              </div>

              <BentoLabel
                title={WORK_TITLES[i]?.title ?? ""}
                sub={WORK_TITLES[i]?.sub ?? ""}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BentoImages;

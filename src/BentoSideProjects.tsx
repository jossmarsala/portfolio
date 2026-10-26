import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BentoLabel from "./components/BentoLabel";
import useParallaxItem from "./hooks/useParallaxItem";

import "./BentoImages.css";

gsap.registerPlugin(ScrollTrigger);

const SIDE_TITLES = [
  { title: "posdata studio", sub: "2026", slug: "posdata" },
  { title: "lilium cyber", sub: "2025", slug: "lilium" },
  { title: "faro stock manager", sub: "2026", slug: "faro" },
];

interface BentoSideProjectsProps {
  images: string[];
  className?: string;
  onProjectSelect?: (slug: string) => void;
}

export function BentoSideProjects({
  images,
  className = "",
  onProjectSelect,
}: BentoSideProjectsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLElement | null)[]>([]);
  const heroTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useParallaxItem(itemRefs, imgRefs, { hoverScale: 1.01 });

  useEffect(() => {
    const items = itemRefs.current;
    const cellImgs = imgRefs.current;
    if (items.length === 0 || !containerRef.current) return;

    // Reset properties for ScrollTrigger
    gsap.set(items, {
      y: -40,
      scale: 0.95,
      opacity: 0,
      clipPath: "inset(0% 0% 100% 0%)",
    });
    gsap.set(cellImgs, { scale: 1 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
        end: "center 35%",
        scrub: 1.5, // Slower, smoother catch-up feel
      }
    });
    heroTimelineRef.current = tl;

    // 1. Sweep reveal downwards (clip-path)
    tl.to(
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
    tl.to(
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
    tl.to(
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
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={"bento-images__wrapper bento-images--side " + className}
      aria-label="Side projects gallery"
    >
      <div className="bento-side__grid">
        {images.slice(0, 3).map((src, i) => {
          const isVideo = /\.(mp4|webm|mov|ogg)($|\?)/i.test(src);
          return (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={`bento-images__item bento-side__item--${i + 1}`}
              data-cursor-project={onProjectSelect ? "true" : undefined}
              role="link"
              tabIndex={0}
              aria-label={SIDE_TITLES[i]?.title ?? `Side Project ${i + 1}`}
              onClick={() => {
                if (onProjectSelect) {
                  onProjectSelect(SIDE_TITLES[i].slug);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onProjectSelect?.(SIDE_TITLES[i].slug);
                }
              }}
              style={{ cursor: onProjectSelect ? "pointer" : "default" }}
            >
              <div className={`bento-images__cell bento-side__cell--${i + 1}`}>
                <div className="bento-images__cell-frame">
                  {isVideo ? (
                    <video
                      key={src}
                      ref={(el) => {
                        imgRefs.current[i] = el;
                      }}
                      src={src}
                      className="bento-images__cell-img"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      ref={(el) => {
                        imgRefs.current[i] = el;
                      }}
                      src={src}
                      alt={SIDE_TITLES[i]?.title ?? `Side project ${i + 1}`}
                      className="bento-images__cell-img"
                      loading="lazy"
                      draggable={false}
                    />
                  )}
                </div>
              </div>
              
              <BentoLabel
                title={SIDE_TITLES[i]?.title ?? ""}
                sub={SIDE_TITLES[i]?.sub ?? ""}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BentoSideProjects;

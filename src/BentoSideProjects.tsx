import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BentoLabel from "./components/BentoLabel";
import useParallaxItem from "./hooks/useParallaxItem";

import "./BentoImages.css";

gsap.registerPlugin(ScrollTrigger);

const SIDE_TITLES = [
  { title: "posdata studio", sub: "2026", slug: "posdata" },
  { title: "lilium cyber", sub: "2025", slug: "ascii" },
  { title: "tu nuevo proyecto", sub: "", slug: "__cta__" },
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
      },
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
          const info = SIDE_TITLES[i];
          const isCTA = info?.slug === "__cta__";
          const isVideo = !isCTA && /\.(mp4|webm|mov|ogg)($|\?)/i.test(src);

          const handleClick = () => {
            if (isCTA) {
              const footer = document.getElementById("footer");
              if (footer) {
                footer.scrollIntoView({ behavior: "smooth" });
              }
              return;
            }
            if (onProjectSelect) {
              onProjectSelect(info.slug);
            }
          };

          return (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={`bento-images__item bento-side__item--${i + 1}${isCTA ? " bento-side__item--cta" : ""}`}
              data-cursor-project={
                !isCTA && onProjectSelect ? "true" : undefined
              }
              onClick={handleClick}
              style={{ cursor: "pointer" }}
            >
              <div className={`bento-images__cell bento-side__cell--${i + 1}`}>
                <div className="bento-images__cell-frame">
                  {isCTA ? (
                    <svg
                      ref={(el) => {
                        imgRefs.current[i] = el as HTMLElement | null;
                      }}
                      className="bento-images__cell-img bento-cta__plus"
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <line
                        x1="24"
                        y1="15"
                        x2="24"
                        y2="33"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="15"
                        y1="24"
                        x2="33"
                        y2="24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : isVideo ? (
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
                      alt={info?.title ?? `Side project ${i + 1}`}
                      className="bento-images__cell-img"
                      loading="lazy"
                      draggable={false}
                    />
                  )}
                </div>
              </div>

              <BentoLabel title={info?.title ?? ""} sub={info?.sub ?? ""} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BentoSideProjects;

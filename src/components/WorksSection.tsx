import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BentoImages from "../BentoImages";
import BentoSideProjects from "../BentoSideProjects";
import WarpHeadline from "./WarpHeadline";
import { useLang } from "../context/LanguageContext";
import { BENTO_MAIN_MEDIA, BENTO_SIDE_MEDIA } from "../config/bento-media";
import "../styles/WorksSection.css";

gsap.registerPlugin(ScrollTrigger);

export interface WorksSectionProps {
  id?: string;
  className?: string;
  triggerOnce?: boolean;
  onProjectSelect?: (slug: string) => void;
  onAboutClick?: () => void;
}

export function WorksSection({
  id = "",
  className = "",
  triggerOnce = true,
  onProjectSelect,
  onAboutClick,
}: WorksSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const [triggerPlay, setTriggerPlay] = useState(false);
  const hasTriggeredRef = useRef(false);
  const { lang, t } = useLang();

  // Trigger the big bentos sweep entrance when the works section enters view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (triggerOnce && hasTriggeredRef.current) return;
            hasTriggeredRef.current = true;
            setTriggerPlay(true);
            if (triggerOnce) observer.unobserve(el);
          } else {
            if (!triggerOnce && entry.boundingClientRect.top > 0) {
              setTriggerPlay(false);
            }
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 0px 0px" },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [triggerOnce]);

  // 3D on-scroll appear effect for headline (matching Footer headline animation)
  useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: headline,
        start: "top 95%",
        end: "top 35%",
        scrub: 1,
      },
    });

    tl.fromTo(
      headline,
      {
        opacity: 0,
        y: 60,
        rotationX: -40,
        transformPerspective: 1000,
        transformOrigin: "top center",
        filter: "blur(12px)",
      },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        filter: "blur(0px)",
        ease: "none",
      },
    );

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, []);

  return (
    <div
      id={id || undefined}
      ref={containerRef}
      className={"split-works-container" + (className ? " " + className : "")}
    >
      {/* ── Headline: my work. / mi trabajo. ── */}
      <div
        ref={headlineRef}
        className="works-section__headline"
        aria-hidden="true"
      >
        <WarpHeadline
          leftText={t("works_headline_left")}
          rightText={t("works_headline_right")}
          className="works-section__warp-headline"
        />
      </div>

      {/* ── Editorial Banner: sits just below headline ── */}
      <div className="works-editorial-banner" id="about" key={lang}>
        <button
          type="button"
          className="works-editorial-link"
          onClick={onAboutClick}
        >
          {t("works_editorial_link")}
        </button>
        <p className="works-editorial-text">
          {t("works_editorial_text")}
        </p>
      </div>

      {/* ── Big Bento Images (with sweep entrance) ── */}
      <BentoImages
        media={BENTO_MAIN_MEDIA}
        triggerPlay={triggerPlay}
        onProjectSelect={onProjectSelect}
      />

      {/* ── Small Bento Gallery (Normal flow, below the main ones) ── */}
      <BentoSideProjects
        media={BENTO_SIDE_MEDIA}
        onProjectSelect={onProjectSelect}
      />
    </div>
  );
}

export default WorksSection;


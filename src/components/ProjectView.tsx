import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ProjectItem } from "../config/projects";
import { PROJECTS_DATA } from "../config/projects";
import DecryptedText from "../DecryptedText";
import { DECRYPTED_NAV } from "../config/decryptedTextPresets";
import Footer from "../Footer";
import { useLang } from "../context/LanguageContext";
import { useProjectContent } from "../hooks/useProjectContent";
import "./ProjectView.css";

gsap.registerPlugin(ScrollTrigger);

interface ProjectViewProps {
  project: ProjectItem;
  onClose: () => void;
  onProjectSelect?: (slug: string) => void;
}

function getPortraitRows(images: string[]): string[][] {
  const rows: string[][] = [];
  let i = 0;
  let preferThree = true;
  while (i < images.length) {
    const remaining = images.length - i;
    let count = 2;
    if (remaining === 3) {
      count = 3;
    } else if (remaining === 4) {
      count = 2;
    } else if (remaining >= 5) {
      count = preferThree ? 3 : 2;
      preferThree = !preferThree;
    } else {
      count = remaining;
    }
    rows.push(images.slice(i, i + count));
    i += count;
  }
  return rows;
}

const isMediaVideo = (src: string) => /\.(mp4|webm|mov|ogg)($|\?)/i.test(src);

function renderGalleryMedia(src: string, className = "pv-separator__img") {
  if (isMediaVideo(src)) {
    return (
      <video src={src} className={className} autoPlay loop muted playsInline />
    );
  }
  return <img src={src} alt="" className={className} draggable={false} />;
}

function renderSummaryWithKeywords(summary: string, highlightWords?: string[]) {
  if (!highlightWords || highlightWords.length === 0) return summary;
  const escaped = highlightWords.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = summary.split(regex);
  return parts.map((part, idx) => {
    const isKeyword = highlightWords.some(
      (w) => w.toLowerCase() === part.toLowerCase(),
    );
    if (isKeyword) {
      return (
        <DecryptedText
          key={idx}
          text={part}
          parentClassName="about-keyword"
          encryptedClassName="about-keyword-enc"
          animateOn="inViewHover"
          speed={50}
          maxIterations={15}
          sequential={true}
        />
      );
    }
    return part;
  });
}

export function ProjectView({
  project,
  onClose,
  onProjectSelect,
}: ProjectViewProps) {
  const { lang } = useLang();
  const { content, status } = useProjectContent(project.slug, lang);

  const overlayRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLElement | null>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const seeMoreRef = useRef<HTMLDivElement>(null);
  const pvContentCardRef = useRef<HTMLDivElement>(null);
  const pvFooterWrapperRef = useRef<HTMLDivElement>(null);

  // ── Entrance animation ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(imageFrameRef.current, {
        y: -40,
        scale: 0.95,
        opacity: 0,
        clipPath: "inset(0% 0% 100% 0%)",
      });
      gsap.set(imageRef.current, {
        scale: 1.15,
        x: 0,
        y: 0,
        willChange: "transform",
      });
      gsap.set(leftColRef.current, { y: 30, opacity: 0 });
      gsap.set(closeBtnRef.current, { opacity: 0, y: -8 });

      tl.to(
        overlayRef.current,
        { opacity: 1, duration: 0.35, ease: "power2.out" },
        0,
      );
      tl.to(
        imageFrameRef.current,
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" },
        0,
      );
      tl.to(
        imageFrameRef.current,
        { y: 0, scale: 1, opacity: 1, duration: 1.0, ease: "back.out(1.2)" },
        0,
      );
      tl.to(
        imageRef.current,
        { scale: 1, duration: 1.2, ease: "power2.out" },
        0.04,
      );
      tl.to(
        leftColRef.current,
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        0.15,
      );
      tl.fromTo(
        tagsRef.current?.children ? Array.from(tagsRef.current.children) : [],
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out" },
        0.25,
      );
      tl.to(
        closeBtnRef.current,
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        0.2,
      );
    }, overlayRef);

    if (imageRef.current instanceof HTMLVideoElement) {
      imageRef.current.play().catch(() => {});
    }

    // Bento Magnetic Negative Parallax on image hover
    const frame = imageFrameRef.current;
    const img = imageRef.current;
    let removeListeners: (() => void) | undefined;
    if (frame && img) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = frame.getBoundingClientRect();
        const nx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const ny = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        gsap.to(img, {
          x: -nx * 10,
          y: -ny * 8,
          scale: 1.018,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      const handleMouseLeave = () => {
        gsap.to(img, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.0,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      frame.addEventListener("mousemove", handleMouseMove);
      frame.addEventListener("mouseleave", handleMouseLeave);
      removeListeners = () => {
        frame.removeEventListener("mousemove", handleMouseMove);
        frame.removeEventListener("mouseleave", handleMouseLeave);
      };
    }

    // ── Scroll-based reveals for lower sections ──
    const scroller = overlayRef.current;
    if (!scroller) return;

    const scrollCtx = gsap.context(() => {
      // All fade-up elements below the hero
      const fadeEls = scroller.querySelectorAll(".pv-reveal");
      fadeEls.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              scroller,
            },
          },
        );
      });

      // Full-bleed image separators: clip-path sweep
      const separators = scroller.querySelectorAll(".pv-separator");
      separators.forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 0% 100% 0%)", opacity: 0 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            duration: 1.1,
            ease: "expo.inOut",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              scroller,
            },
          },
        );
        // Subtle inner image parallax on scroll
        const inner = el.querySelector(".pv-separator__img");
        if (inner) {
          gsap.fromTo(
            inner,
            { scale: 1.12 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                scroller,
              },
            },
          );
        }
      });

      // Process steps: stagger entrance
      const steps = scroller.querySelectorAll(".pv-process__step");
      if (steps.length) {
        gsap.fromTo(
          steps,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: steps[0],
              start: "top 85%",
              scroller,
            },
          },
        );
      }

      // Metrics: stagger entrance
      const metrics = scroller.querySelectorAll(".pv-metric");
      if (metrics.length) {
        gsap.fromTo(
          metrics,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: metrics[0],
              start: "top 85%",
              scroller,
            },
          },
        );
      }

      // Awards: fade in
      const awards = scroller.querySelectorAll(".pv-award");
      if (awards.length) {
        gsap.fromTo(
          awards,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: {
              trigger: awards[0],
              start: "top 85%",
              scroller,
            },
          },
        );
      }

      // See More: reveal
      if (seeMoreRef.current) {
        gsap.fromTo(
          seeMoreRef.current,
          {
            opacity: 0,
            y: 40,
            rotationX: -20,
            transformPerspective: 1000,
            filter: "blur(8px)",
          },
          {
            opacity: 1,
            y: 0,
            rotationX: 0,
            filter: "blur(0px)",
            ease: "none",
            scrollTrigger: {
              trigger: seeMoreRef.current,
              start: "top 90%",
              end: "top 50%",
              scrub: 1,
              scroller,
            },
          },
        );
      }

      // Footer zoom-out: content card scales down as footer enters — mirrors index page effect
      if (pvContentCardRef.current && pvFooterWrapperRef.current) {
        gsap.fromTo(
          pvContentCardRef.current,
          { scaleX: 1, scaleY: 1, transformOrigin: "bottom center" },
          {
            scaleX: 0.94,
            scaleY: 1,
            transformOrigin: "bottom center",
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: pvFooterWrapperRef.current,
              start: "top bottom",
              end: "bottom bottom",
              scrub: true,
              scroller,
            },
          },
        );
      }
    }, scroller);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (removeListeners) removeListeners();
      ctx.revert();
      scrollCtx.revert();
    };
  }, []);

  const handleClose = () => {
    if (!overlayRef.current) {
      onClose();
      return;
    }
    const tl = gsap.timeline({
      onComplete: onClose,
      defaults: { ease: "power2.in" },
    });
    tl.to([tagsRef.current, leftColRef.current, closeBtnRef.current], {
      y: 15,
      opacity: 0,
      duration: 0.22,
      stagger: 0.02,
    })
      .to(
        imageFrameRef.current,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        "-=0.1",
      )
      .to(overlayRef.current, { opacity: 0, duration: 0.25 }, "-=0.15");
  };

  const galleryImages = project.galleryImages ?? [];
  const isPortrait =
    project.galleryAspectRatio === "3/4" || project.slug === "misu";
  const portraitRows = useMemo(
    () => (isPortrait ? getPortraitRows(galleryImages.slice(3)) : []),
    [isPortrait, galleryImages],
  );
  const hasProcess = (content?.processSteps?.length ?? 0) > 0;
  const hasMetrics = (content?.metrics?.length ?? 0) > 0;
  const hasAwards = content?.awards != null && content.awards.length > 0;

  return (
    <div
      id="project-view-scroller"
      ref={overlayRef}
      className="project-view-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} project details`}
    >
      {/* ── Content card: scales down when footer enters (mirrors index page effect) ── */}
      <div ref={pvContentCardRef} className="pv-content-card">
        {/* ── Close ── */}
        <button
          ref={closeBtnRef}
          className="project-view-close"
          onClick={handleClose}
          aria-label="Close project view"
        >
          <span className="project-view-close__bracket">[</span>
          <span className="project-view-close__label">
            <DecryptedText
              {...DECRYPTED_NAV}
              text="esc / close"
              className="project-view-close__revealed"
              encryptedClassName="project-view-close__encrypted"
            />
          </span>
          <span className="project-view-close__bracket">]</span>
        </button>

        {/* ── HERO GRID ── */}
        <div className="project-view-grid">
          <div ref={leftColRef} className="project-view-left">
            <div className="project-view-header">
              <h1 className="project-view-title">{project.title}</h1>
              <div className="project-view-meta-row">
                <span className="project-view-year">{project.year}</span>
                {content?.role && (
                  <span className="project-view-meta-sep">/</span>
                )}
                {content?.role && (
                  <span className="project-view-role">{content.role}</span>
                )}
              </div>
            </div>
          </div>

          <div className="project-view-right">
            <div ref={imageFrameRef} className="project-view-image-frame">
              {project.videoUrl ||
              /\.(mp4|webm|mov|ogg)($|\?)/i.test(project.imageUrl) ? (
                <video
                  key={project.videoUrl || project.imageUrl}
                  ref={imageRef as any}
                  src={project.videoUrl || project.imageUrl}
                  className="project-view-image"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  ref={imageRef as any}
                  src={project.imageUrl}
                  alt={project.title}
                  className="project-view-image"
                  loading="eager"
                />
              )}
            </div>
            <div ref={tagsRef} className="project-view-tags">
              {(content?.tags ?? []).map((tag, idx) => (
                <span key={idx} className="project-view-tag">
                  <DecryptedText
                    {...DECRYPTED_NAV}
                    text={tag}
                    speed={45}
                    maxIterations={9}
                    className="project-view-tag__revealed"
                    encryptedClassName="project-view-tag__encrypted"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── SCROLL BODY ── */}
        <div ref={scrollBodyRef} className="pv-body">
          {/* ── OVERVIEW ── */}
          <section className="pv-section">
            <div className="pv-section__inner">
              <blockquote className="pv-quote pv-reveal">
                {status === "loading" && <span className="pv-loading">—</span>}
                {status === "ready" &&
                  content &&
                  renderSummaryWithKeywords(
                    content.summary,
                    project.highlightWords,
                  )}
              </blockquote>
              {project.url && (
                <a
                  className="project-view-quote-link pv-reveal"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="project-view-quote-link__bracket">[</span>
                  <span className="project-view-quote-link__label">
                    {project.url.replace(/^https?:\/\//, "")}
                  </span>
                  <span className="project-view-quote-link__arrow">↗</span>
                  <span className="project-view-quote-link__bracket">]</span>
                </a>
              )}
            </div>
          </section>

          {/* ── GALLERY (AFTER ABOUT PROJECT TEXT) ── */}
          {galleryImages.length > 0 &&
            (isPortrait ? (
              <div className="pv-gallery-portrait">
                {/* First Image Row: 3-Images Layout */}
                <div className="pv-trio-grid">
                  {galleryImages.slice(0, 3).map((src, idx) => (
                    <div key={idx} className="pv-separator pv-trio-card">
                      {renderGalleryMedia(src)}
                    </div>
                  ))}
                </div>

                {/* Caption / Problem & Solution */}
                {content?.galleryDescription && (
                  <div className="pv-gallery-triad__caption pv-reveal">
                    <div className="pv-gallery-triad__caption-inner">
                      <span className="pv-gallery-triad__caption-index">
                        Problemática y solución
                      </span>
                      <p className="pv-gallery-triad__caption-text">
                        {content.galleryDescription}
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional 3:4 portrait rows (3-col / 2-col editorial cadence) */}
                {portraitRows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className={`pv-gallery-portrait__row pv-gallery-portrait__row--${row.length}`}
                  >
                    {row.map((src, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="pv-separator pv-gallery-portrait__item"
                      >
                        {renderGalleryMedia(src)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="pv-gallery-triad">
                <div className="pv-separator pv-gallery-triad__main">
                  {renderGalleryMedia(galleryImages[0])}
                </div>
                {galleryImages[1] && (
                  <div className="pv-gallery-triad__row">
                    <div className="pv-separator pv-gallery-triad__sub">
                      {renderGalleryMedia(galleryImages[1])}
                    </div>
                    {galleryImages[2] && (
                      <div className="pv-separator pv-gallery-triad__sub">
                        {renderGalleryMedia(galleryImages[2])}
                      </div>
                    )}
                  </div>
                )}
                {content?.galleryDescription && (
                  <div className="pv-gallery-triad__caption pv-reveal">
                    <div className="pv-gallery-triad__caption-inner">
                      <span className="pv-gallery-triad__caption-index">
                        00 - [problemática y solución]
                      </span>
                      <p className="pv-gallery-triad__caption-text">
                        {content.galleryDescription}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* ── 02  PROCESS ── */}
          {hasProcess && (
            <section className="pv-section">
              <div className="pv-section__inner">
                <div className="pv-label pv-reveal">
                  <span className="pv-label__index">02</span>
                  <span className="pv-label__text">process</span>
                </div>
                <div className="pv-process">
                  {content!.processSteps.map((step) => (
                    <div key={step.index} className="pv-process__step">
                      <span className="pv-process__step-index">
                        {step.index}
                      </span>
                      <span className="pv-process__step-title">
                        {step.title}
                      </span>
                      <p className="pv-process__step-desc">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── IMAGE SEPARATOR 2 ── */}
          {!isPortrait && (galleryImages[3] || project.processImageUrl) && (
            <div className="pv-separator pv-separator--offset">
              {renderGalleryMedia(galleryImages[3] || project.processImageUrl!)}
            </div>
          )}

          {/* ── 03  IMPACT ── */}
          {(hasMetrics || hasAwards) && (
            <section className="pv-section">
              <div className="pv-section__inner">
                <div className="pv-label pv-reveal">
                  <span className="pv-label__index">03</span>
                  <span className="pv-label__text">impact</span>
                </div>

                {/* Metrics row */}
                {hasMetrics && (
                  <div className="pv-metrics">
                    {content!.metrics.map((m, i) => (
                      <div key={i} className="pv-metric">
                        <span className="pv-metric__value">{m.value}</span>
                        <span className="pv-metric__label">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Awards */}
                {hasAwards && (
                  <div className="pv-awards pv-reveal">
                    {content!.awards.map((award, i) => (
                      <div key={i} className="pv-award">
                        <span className="pv-award__name">{award.name}</span>
                        <div className="pv-award__meta">
                          <span className="pv-award__issuer">
                            {award.issuer}
                          </span>
                          <span className="pv-award__sep">/</span>
                          <span className="pv-award__year">{award.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── IMAGE SEPARATOR 3 ── */}
          {!isPortrait &&
            (galleryImages[4] ||
              (galleryImages[3] && project.processImageUrl)) && (
              <div className="pv-separator pv-separator--full">
                {renderGalleryMedia(
                  galleryImages[4] || project.processImageUrl!,
                )}
              </div>
            )}

          {/* ── SEE MORE PROJECTS ── */}
          <div
            ref={seeMoreRef}
            className="see-more pv-reveal-block"
            aria-label="More projects"
          >
            <div className="see-more__col see-more__col--left">
              <span className="see-more__label">more work</span>
            </div>
            <div className="see-more__col see-more__col--right">
              <ul className="see-more__list" role="list">
                {Object.values(PROJECTS_DATA).map((p) => (
                  <li key={p.slug} className="see-more__item">
                    <button
                      className="see-more__link"
                      onClick={() => {
                        if (onProjectSelect) {
                          onProjectSelect(p.slug);
                          // Optional: scrollTo top
                          if (overlayRef.current)
                            overlayRef.current.scrollTo(0, 0);
                        }
                      }}
                      aria-label={`View ${p.title}`}
                    >
                      <span className="see-more__title">{p.title}</span>
                      <span className="see-more__year">{p.year}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* /pv-body */}
      </div>
      {/* /pv-content-card */}

      {/* ── Footer wrapper: grey background behind content card, mirrors index footer-section-wrapper ── */}
      <div ref={pvFooterWrapperRef} className="pv-footer-wrapper">
        <Footer scroller="#project-view-scroller" />
      </div>
    </div>
  );
}

export default ProjectView;

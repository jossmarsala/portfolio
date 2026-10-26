import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./CustomCursor.css";

const checkSupport = () => {
  if (typeof window === "undefined") return false;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  return !prefersReducedMotion && hasFinePointer;
};

// Shortest angular distance between two angles (degrees)
const angleDiff = (from: number, to: number): number => {
  let diff = ((to - from + 180) % 360) - 180;
  if (diff < -180) diff += 360;
  return diff;
};

const CustomCursor: React.FC = () => {
  const bigBallRef = useRef<HTMLDivElement>(null);
  const smallBallRef = useRef<HTMLDivElement>(null);
  const ellipseRef = useRef<SVGEllipseElement>(null);
  const ovalWrapperRef = useRef<HTMLDivElement>(null);
  const pillLayerRef = useRef<HTMLDivElement>(null);
  const [isSupported] = useState(checkSupport);

  useEffect(() => {
    if (
      !isSupported ||
      !bigBallRef.current ||
      !smallBallRef.current ||
      !ovalWrapperRef.current ||
      !pillLayerRef.current
    )
      return;

    document.body.classList.add("custom-cursor-enabled");

    const bigBall = bigBallRef.current;
    const smallBall = smallBallRef.current;
    const ovalWrapper = ovalWrapperRef.current;
    const pillLayer = pillLayerRef.current;

    // Center both cursor elements at origin
    gsap.set(bigBall, { xPercent: -50, yPercent: -50 });
    gsap.set(smallBall, { xPercent: -50, yPercent: -50 });

    // Initial state: oval visible, badge collapsed under the dot
    // Using autoAlpha instead of opacity to force visibility:hidden when 0
      gsap.set(ovalWrapper, { scale: 1, autoAlpha: 1 });
      gsap.set(pillLayer, { xPercent: -50, y: 8, scale: 0.35, autoAlpha: 0 });

    // Big ball: follows with delay for physical trailing weight feel
    // Standard delay for the oval, and extended floaty delay for the 'see more' badge
    const DEFAULT_BIG_DURATION = 0.42;
    const BADGE_BIG_DURATION = 0.88;

    let bigX = gsap.quickTo(bigBall, "x", {
      duration: DEFAULT_BIG_DURATION,
      ease: "power3.out",
    });
    let bigY = gsap.quickTo(bigBall, "y", {
      duration: DEFAULT_BIG_DURATION,
      ease: "power3.out",
    });
    // Small circle: snaps directly to mouse
    const smallX = gsap.quickTo(smallBall, "x", {
      duration: 0.08,
      ease: "power3.out",
    });
    const smallY = gsap.quickTo(smallBall, "y", {
      duration: 0.08,
      ease: "power3.out",
    });

    // Tracking state
    let isVisible = false;
    let mouseX = 0;
    let mouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let isHoveringLink = false;
    let isHoveringProject = false;
    let isHoveringImage = false;
    let activeProjectEl: HTMLElement | null = null;
    let activeLink: HTMLElement | null = null;

    // Rotation state — start at rest angle (-40 deg)
    let currentRotation = -40;
    let targetRotation = -40;
    let rotationVelocity = 0;

    // Physics constants
    const REST_ANGLE = -40;
    const LERP_SPEED = 0.06;
    const INERTIA = 0.88;
    const VELOCITY_INFLUENCE = 0.4;
    const SPEED_THRESHOLD = 0.5;

    let lastMoveTime = 0;

    // ── Morph oval into 'see more' badge positioned under the dot ───────────
    const enterProject = (el: HTMLElement) => {
      if (isHoveringLink) {
        removeUnderline();
      }
      isHoveringProject = true;
      activeProjectEl = el;
      document.body.classList.add("is-hovering-project");
      el.classList.add("cursor-project-hovered");

      // Give the badge noticeably more trailing follow delay
      bigX = gsap.quickTo(bigBall, "x", {
        duration: BADGE_BIG_DURATION,
        ease: "power3.out",
      });
      bigY = gsap.quickTo(bigBall, "y", {
        duration: BADGE_BIG_DURATION,
        ease: "power3.out",
      });
      if (mouseX && mouseY) {
        bigX(mouseX);
        bigY(mouseY);
      }

      // Morph: shrink oval out, blossom pill badge under the dot
      gsap.to(ovalWrapper, {
        scale: 0.3,
        autoAlpha: 0,
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });

      gsap.fromTo(
        pillLayer,
        { scale: 0.35, autoAlpha: 0, y: 6 },
        {
          scale: 1,
          autoAlpha: 1,
          y: 20,
          duration: 0.4,
          delay: 0.04,
          ease: "back.out(1.4)",
          overwrite: "auto",
        },
      );
    };

    const leaveProject = () => {
      if (!isHoveringProject) return;
      isHoveringProject = false;
      document.body.classList.remove("is-hovering-project");
      if (activeProjectEl) {
        activeProjectEl.classList.remove("cursor-project-hovered");
        activeProjectEl = null;
      }
      document.querySelectorAll(".cursor-project-hovered").forEach((el) => {
        el.classList.remove("cursor-project-hovered");
      });

      // Restore normal follow delay for oval
      bigX = gsap.quickTo(bigBall, "x", {
        duration: DEFAULT_BIG_DURATION,
        ease: "power3.out",
      });
      bigY = gsap.quickTo(bigBall, "y", {
        duration: DEFAULT_BIG_DURATION,
        ease: "power3.out",
      });
      if (mouseX && mouseY) {
        bigX(mouseX);
        bigY(mouseY);
      }

      // Morph back: collapse pill badge back toward dot, expand oval back in
      gsap.to(pillLayer, {
        scale: 0.35,
        autoAlpha: 0,
        y: 6,
        duration: 0.2,
        ease: "power2.in",
        overwrite: "auto",
      });

      gsap.to(ovalWrapper, {
        scale: 1,
        autoAlpha: 1,
        duration: 0.28,
        delay: 0.04,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    // ── Link underline interaction ─────────────────────────────────────────
    const addUnderline = (el: HTMLElement) => {
      if (isHoveringProject) return;
      if (activeLink && activeLink !== el) {
        activeLink.classList.remove("cursor-link-active");
      }
      isHoveringLink = true;
      activeLink = el;
      document.body.classList.add("is-hovering-link");
      el.classList.add("cursor-link-active");
    };

    const removeUnderline = () => {
      isHoveringLink = false;
      document.body.classList.remove("is-hovering-link");
      if (activeLink) {
        activeLink.classList.remove("cursor-link-active");
        activeLink = null;
      }
      document.querySelectorAll(".cursor-link-active").forEach((el) => {
        el.classList.remove("cursor-link-active");
      });
    };

    // ── Image hover interaction (hide oval so it doesn't obstruct images) ──
    const enterImage = () => {
      if (isHoveringProject) return; // Project badge takes priority
      isHoveringImage = true;
      gsap.to(ovalWrapper, {
        scale: 0.3,
        autoAlpha: 0,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const leaveImage = () => {
      if (isHoveringProject) return;
      isHoveringImage = false;
      gsap.to(ovalWrapper, {
        scale: 1,
        autoAlpha: 1,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    // ── Mouse events ───────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMoveTime = performance.now();

      if (!isVisible) {
        gsap.to([bigBall, smallBall], { autoAlpha: 1, duration: 0.3 });
        isVisible = true;
      }

      // Check current hover element on every move first
      const target = e.target as HTMLElement | null;
      const projectEl = target?.closest?.(
        "[data-cursor-project]",
      ) as HTMLElement | null;

      if (projectEl) {
        if (isHoveringImage) isHoveringImage = false; // Project takes priority, reset without anim
        if (!isHoveringProject || activeProjectEl !== projectEl) {
          enterProject(projectEl);
        }
      } else {
        if (isHoveringProject) {
          leaveProject();
        }

        const imgEl = target?.closest?.("img") as HTMLElement | null;
        if (imgEl) {
          if (!isHoveringImage) enterImage();
        } else if (isHoveringImage) {
          leaveImage();
        }

        const linkEl = target?.closest?.(
          "a, button, [data-cursor-hover]",
        ) as HTMLElement | null;
        if (linkEl) {
          if (!isHoveringLink || activeLink !== linkEl) {
            addUnderline(linkEl);
          }
        } else if (isHoveringLink) {
          removeUnderline();
        }
      }

      // Big ball (oval / morphed 'see more' badge) follows dot with delay
      bigX(e.clientX);
      bigY(e.clientY);
      // Small ball (tiny dot) snaps directly to mouse
      smallX(e.clientX);
      smallY(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const projectEl = target?.closest?.(
        "[data-cursor-project]",
      ) as HTMLElement | null;
      if (projectEl) {
        if (isHoveringImage) isHoveringImage = false;
        enterProject(projectEl);
        return;
      }

      const imgEl = target?.closest?.("img") as HTMLElement | null;
      if (imgEl) enterImage();

      const linkEl = target?.closest?.(
        "a, button, [data-cursor-hover]",
      ) as HTMLElement | null;
      if (linkEl) addUnderline(linkEl);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const fromTarget = e.target as HTMLElement | null;
      const toTarget = e.relatedTarget as HTMLElement | null;

      const fromProject = fromTarget?.closest?.(
        "[data-cursor-project]",
      ) as HTMLElement | null;
      const toProject = toTarget?.closest?.(
        "[data-cursor-project]",
      ) as HTMLElement | null;
      if (fromProject && fromProject !== toProject) {
        leaveProject();
      } else if (!toProject) {
        const fromImg = fromTarget?.closest?.("img") as HTMLElement | null;
        const toImg = toTarget?.closest?.("img") as HTMLElement | null;
        if (fromImg && fromImg !== toImg) {
          leaveImage();
        }
      }

      const fromLink = fromTarget?.closest?.(
        "a, button, [data-cursor-hover]",
      ) as HTMLElement | null;
      const toLink = toTarget?.closest?.(
        "a, button, [data-cursor-hover]",
      ) as HTMLElement | null;
      if (fromLink && fromLink !== toLink) {
        removeUnderline();
      }
    };

    // Tactile click press feedback on the morphed badge
    const onMouseDown = () => {
      if (isHoveringProject) {
        gsap.to(pillLayer, { scale: 0.92, duration: 0.12, ease: "power2.out" });
      }
    };

    const onMouseUp = () => {
      if (isHoveringProject) {
        gsap.to(pillLayer, { scale: 1, duration: 0.2, ease: "back.out(2)" });
      }
    };

    // Handle mouse leaving/entering the viewport completely
    const handleDocumentMouseLeave = () => {
      isVisible = false;
      gsap.to([bigBall, smallBall], { autoAlpha: 0, duration: 0.3 });
    };

    const handleDocumentMouseEnter = () => {
      if (!isVisible) {
        isVisible = true;
        gsap.to([bigBall, smallBall], { autoAlpha: 1, duration: 0.3 });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", handleDocumentMouseLeave);
    document.addEventListener("mouseenter", handleDocumentMouseEnter);

    // rAF loop — lerps rotation with inertia every frame for standard oval
    let rafId: number;
    const tick = () => {
      if (!isHoveringProject) {
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        const speed = Math.sqrt(dx * dx + dy * dy);

        if (speed > SPEED_THRESHOLD) {
          targetRotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        } else if (performance.now() - lastMoveTime > 150) {
          targetRotation += angleDiff(targetRotation, REST_ANGLE) * 0.04;
        }

        const gap = angleDiff(currentRotation, targetRotation);
        rotationVelocity += gap * VELOCITY_INFLUENCE * LERP_SPEED;
        rotationVelocity *= INERTIA;
        currentRotation += rotationVelocity;

        if (ellipseRef.current) {
          ellipseRef.current.setAttribute(
            "transform",
            `rotate(${currentRotation} 15 15)`,
          );
        }
      }

      prevMouseX = mouseX;
      prevMouseY = mouseY;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", handleDocumentMouseLeave);
      document.removeEventListener("mouseenter", handleDocumentMouseEnter);
      cancelAnimationFrame(rafId);
      document.body.classList.remove("custom-cursor-enabled");
      document.body.classList.remove("is-hovering-link");
      document.body.classList.remove("is-hovering-project");
      if (activeLink) activeLink.classList.remove("cursor-link-active");
      if (activeProjectEl)
        activeProjectEl.classList.remove("cursor-project-hovered");
    };
  }, [isSupported]);

  if (!isSupported) return null;

  return (
    <>
      {/* ── Morphs between the trailing oval and the 'see more' badge ── */}
      <div ref={bigBallRef} className="cursor-big-ball">
        {/* SVG Oval: visible at rest / normal state, rotating with movement physics */}
        <div ref={ovalWrapperRef} className="cursor-oval-layer">
          <svg height="30" width="30" style={{ display: "block" }}>
            <ellipse
              ref={ellipseRef}
              cx="15"
              cy="15"
              rx="13"
              ry="8.5"
              fill="#f7f8fa"
              strokeWidth="0"
              transform="rotate(-40 15 15)"
            />
          </svg>
        </div>

        {/* Badge Pill Layer: morphs/expands from the oval when hovering a project */}
        <div ref={pillLayerRef} className="cursor-pill-badge">
          <span className="cursor-badge-text">see work</span>
          <svg
            className="cursor-badge-arrow"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="2" y1="8" x2="8" y2="2" />
            <polyline points="3.5 2 8 2 8 6.5" />
          </svg>
        </div>
      </div>

      {/* ── Small dot: ALWAYS KEPT, snaps directly to mouse ── */}
      <div ref={smallBallRef} className="cursor-small-ball">
        <svg height="10" width="10" style={{ display: "block" }}>
          <circle cx="5" cy="5" r="3" fill="#f7f8fa" strokeWidth="0" />
        </svg>
      </div>
    </>
  );
};

export default CustomCursor;

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import DecryptedText from "./DecryptedText";
import { DECRYPTED_NAV } from "./config/decryptedTextPresets";
import { useLang } from "./context/LanguageContext";
import "./AboutSidebar.css";

const portraitImg = "/ABOUT.png";

interface AboutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutSidebar({ isOpen, onClose }: AboutSidebarProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const bioRef = useRef<HTMLQuoteElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  const { lang, t } = useLang();

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (!panelRef.current || !overlayRef.current) {
      onClose();
      isClosingRef.current = false;
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isClosingRef.current = false;
        onClose();
      },
    });

    tl.to(
      panelRef.current,
      {
        x: "100%",
        duration: 0.5,
        ease: "power3.inOut",
      },
      0,
    ).to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
      },
      0,
    );
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  // Prevent body scroll while sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // GSAP Entrance Animation Choreography (Bento & ProjectView signature style)
  useEffect(() => {
    if (!isOpen || !panelRef.current || !overlayRef.current) return;

    isClosingRef.current = false;
    panelRef.current.focus();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Reset initial states matching Bento / ProjectView
      gsap.set(overlayRef.current, { opacity: 0, pointerEvents: "auto" });
      gsap.set(panelRef.current, { x: "100%" });
      gsap.set(closeBtnRef.current, { opacity: 0, y: -8 });
      gsap.set(mediaRef.current, {
        y: -30,
        scale: 0.96,
        opacity: 0,
        clipPath: "inset(0% 0% 100% 0%)",
      });
      gsap.set(imgRef.current, {
        scale: 1.15,
        x: 0,
        y: 0,
        willChange: "transform",
      });
      gsap.set([bioRef.current, actionsRef.current], { y: 20, opacity: 0 });

      // 1. Overlay fade in with backdrop blur
      tl.to(
        overlayRef.current,
        {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
        },
        0,
      );

      // 2. Panel slides in from right smoothly
      tl.to(
        panelRef.current,
        {
          x: "0%",
          duration: 0.72,
          ease: "power3.out",
        },
        0,
      );

      // 3. Bento signature sweep reveal (clip-path downwards)
      tl.to(
        mediaRef.current,
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.85,
          ease: "expo.inOut",
        },
        0.12,
      );

      // 4. Subtle image entrance (y + scale + opacity)
      tl.to(
        mediaRef.current,
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.95,
          ease: "back.out(1.2)",
        },
        0.12,
      );

      // 5. Image zoom settling
      tl.to(
        imgRef.current,
        {
          scale: 1,
          duration: 1.2,
          ease: "power2.out",
        },
        0.16,
      );

      // 6. Floating close button reveals
      tl.to(
        closeBtnRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power3.out",
        },
        0.24,
      );

      // 7. Bio editorial quote and CTA staggered slide-up
      tl.to(
        bioRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: "power3.out",
        },
        0.28,
      );

      tl.to(
        actionsRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
        },
        0.36,
      );
    }, panelRef);

    // Bento Magnetic Negative Parallax on image hover
    const mediaEl = mediaRef.current;
    const imgEl = imgRef.current;
    let cleanupMouse: (() => void) | undefined;

    if (mediaEl && imgEl) {
      const maxOffsetX = 8;
      const maxOffsetY = 6;
      const hoverScale = 1.02;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = mediaEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const nx = (x - rect.width / 2) / (rect.width / 2);
        const ny = (y - rect.height / 2) / (rect.height / 2);

        gsap.to(imgEl, {
          x: -nx * maxOffsetX,
          y: -ny * maxOffsetY,
          scale: hoverScale,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(imgEl, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      mediaEl.addEventListener("mousemove", handleMouseMove);
      mediaEl.addEventListener("mouseleave", handleMouseLeave);

      cleanupMouse = () => {
        mediaEl.removeEventListener("mousemove", handleMouseMove);
        mediaEl.removeEventListener("mouseleave", handleMouseLeave);
      };
    }

    return () => {
      if (cleanupMouse) cleanupMouse();
      ctx.revert();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        ref={overlayRef}
        className="about-sidebar__overlay"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        ref={panelRef}
        className="about-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label={t("about_aria")}
        tabIndex={-1}
      >
        {/* Floating close button in the top right */}
        <button
          ref={closeBtnRef}
          className="about-sidebar__close"
          onClick={handleClose}
          aria-label={t("about_close")}
        >
          <span className="about-sidebar__bracket">[</span>
          <span className="about-sidebar__close-label">
            <DecryptedText
              {...DECRYPTED_NAV}
              text={t("about_close")}
              className="about-sidebar__revealed"
              encryptedClassName="about-sidebar__encrypted"
            />
          </span>
          <span className="about-sidebar__bracket">]</span>
        </button>

        {/* Full-width image frame at the very top of the sidebar */}
        <div ref={mediaRef} className="about-sidebar__media">
          <img
            ref={imgRef}
            src={portraitImg}
            alt="Jos Marsala"
            className="about-sidebar__img"
            draggable={false}
          />
        </div>

        {/* Main Content Area */}
        <div className="about-sidebar__body">
          {/* Bio statement — re-keyed on lang so DecryptedText re-animates with translated words */}
          <blockquote ref={bioRef} className="about-sidebar__bio" key={lang}>
            {t("about_bio_intro")}{" "}
            <DecryptedText
              text={t("about_bio_keyword_design")}
              parentClassName="about-keyword"
              encryptedClassName="about-keyword-enc"
              animateOn="inViewHover"
              speed={45}
              maxIterations={12}
              sequential={true}
            />{" "}
            {t("about_bio_and")}{" "}
            <DecryptedText
              text={t("about_bio_keyword_tech")}
              parentClassName="about-keyword"
              encryptedClassName="about-keyword-enc"
              animateOn="inViewHover"
              speed={45}
              maxIterations={12}
              sequential={true}
            />{" "}
            {t("about_bio_outro")}
          </blockquote>

          {/* Minimalist Bracketed CTA matching ProjectView & web design */}
          <div ref={actionsRef} className="about-sidebar__actions">
            <a
              href="mailto:hello@josmarsala.com"
              className="about-sidebar__cta"
              aria-label={t("about_cta")}
            >
              <span className="about-sidebar__bracket">[</span>
              <span className="about-sidebar__cta-label">
                <DecryptedText
                  {...DECRYPTED_NAV}
                  text={t("about_cta")}
                  className="about-sidebar__revealed"
                  encryptedClassName="about-sidebar__encrypted"
                />
              </span>
              <span className="about-sidebar__cta-arrow">↗</span>
              <span className="about-sidebar__bracket">]</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AboutSidebar;

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import "./App.css";
import ImageCircleCarousel from "./ImageCircleCarousel";
import Navbar from "./Navbar";
import Loader from "./Loader";
import CustomCursor from "./CustomCursor";
import WorksSection from "./components/WorksSection";
import Footer from "./Footer";
import JosMarsalaLogo from "./JosMarsalaLogo";
import AboutSidebar from "./AboutSidebar";
import { PROJECTS_DATA } from "./config/projects";
import { useLang } from "./context/LanguageContext";

const CAROUSEL_IMAGES = [
  "/carousel/gypsy__designsystem.webp",
  "/carousel/gypsy__mockupphone.webp",
  "/carousel/images-portfolio-misu_catalog.png",
  "/carousel/images-portfolio-misu_designsystem.png",
  "/carousel/images-portfolio-misu_mockupphone.png",
  "/carousel/mockuplaptopmisu.png",
  "/carousel/Asset 1.webp",
];

// Register ScrollTrigger in main.tsx per refactor plan

function getProjectSlugFromPath(path: string): string | null {
  const cleanPath = path.replace(/\/+$/, "").replace(/^\/+/, "");
  if (!cleanPath) return null;

  // Match /project/:slug or /projects/:slug
  const match = cleanPath.match(/^(?:project|projects)\/([a-zA-Z0-9_-]+)$/i);
  if (match && match[1]) {
    const slug = match[1].toLowerCase();
    if (PROJECTS_DATA[slug]) return slug;
  }

  // Match /:slug directly
  const directSlug = cleanPath.toLowerCase();
  if (PROJECTS_DATA[directSlug]) {
    return directSlug;
  }

  // If path is "project" or "projects" without slug, fallback to first project
  if (directSlug === "project" || directSlug === "projects") {
    return "vitalia";
  }

  return null;
}

function App() {
  const { lang, t } = useLang();
  const [loaderDone, setLoaderDone] = useState(false);

  const handleLoaderComplete = useCallback(() => {
    setLoaderDone(true);
  }, []);

  const [aboutOpen, setAboutOpen] = useState(false);
  const handleAboutOpen = useCallback(() => setAboutOpen(true), []);
  const handleAboutClose = useCallback(() => setAboutOpen(false), []);

  // Title for portfolio home
  useEffect(() => {
    document.title = "Jos Marsala";
  }, []);

  // If a project route is accessed directly, redirect to its live web URL
  useEffect(() => {
    const slug = getProjectSlugFromPath(window.location.pathname);
    if (slug) {
      const project = PROJECTS_DATA[slug];
      if (project?.url) {
        window.location.replace(project.url);
      }
    }
  }, []);

  // Redirect directly to the project's external website in a new tab when clicked
  const handleProjectSelect = useCallback((slug: string) => {
    const project = PROJECTS_DATA[slug];
    if (project?.url) {
      window.open(project.url, "_blank", "noopener,noreferrer");
    }
  }, []);

  // Refs for scroll-driven 3D animation
  const carouselWrapperRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const worksSectionRef = useRef<HTMLElement>(null);
  const isHeroTransitionActiveRef = useRef(true);

  // Lock scroll completely while the loader is active
  useEffect(() => {
    if (loaderDone) return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const preventScrollKeys = (e: KeyboardEvent) => {
      const keys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
        "Spacebar",
      ];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleScrollLock = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    window.addEventListener("keydown", preventScrollKeys);
    window.addEventListener("scroll", handleScrollLock);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("keydown", preventScrollKeys);
      window.removeEventListener("scroll", handleScrollLock);
    };
  }, [loaderDone]);

  // Scroll-driven animations: 3D FOV exit on carousel + hero title fade-out + works peek scale-up
  useEffect(() => {
    if (!loaderDone) return;

    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const PEEK_HEIGHT = 48;
      const heroScrollDistance = Math.max(1, heroHeight - PEEK_HEIGHT);

      // Clamp progress between 0 and 1 so overscroll (negative scrollY) never produces negative values
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / heroScrollDistance),
      );

      // ── Works Section: smoothly scale up horizontally without rounded corners ──
      if (worksSectionRef.current) {
        if (progress < 1) {
          isHeroTransitionActiveRef.current = true;
          // Smoothstep easing for a fluid, natural horizontal expansion
          const smoothProgress = progress * progress * (3 - 2 * progress);
          const worksScaleX = 0.94 + smoothProgress * (1 - 0.94);
          gsap.set(worksSectionRef.current, {
            scaleX: worksScaleX,
            scaleY: 1,
            transformOrigin: "top center",
            force3D: true,
          });
        } else if (isHeroTransitionActiveRef.current) {
          isHeroTransitionActiveRef.current = false;
          gsap.set(worksSectionRef.current, {
            scaleX: 1,
            scaleY: 1,
            transformOrigin: "top center",
          });
        }
      }

      // ── Carousel: 3D FOV exit + pronounced blur ──
      if (carouselWrapperRef.current) {
        const scale = 1 - progress * 0.12; // subtler scale-down
        const translateZ = progress * -60; // subtler push back in Z space
        const blur = progress * 14; // increased blur effect for leaving carousel images (up to 14px)

        gsap.set(carouselWrapperRef.current, {
          scale,
          z: translateZ,
          // We remove opacity fade out here so the title doesn't fade out either
          filter: blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : "none",
          transformOrigin: "center center",
        });
      }

      // ── Hero title: just subtle blur, no opacity fade out ──
      const titleBlur = progress * 6;
      const titleFilterVal = titleBlur > 0.05 ? `blur(${titleBlur}px)` : "none";

      if (heroTitleRef.current) {
        gsap.set(heroTitleRef.current, { filter: titleFilterVal, opacity: 1 });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    // Run once on mount to set initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [loaderDone]);

  // Auto-slide works overlay up when scrolling down to the middle of the viewport
  useEffect(() => {
    if (!loaderDone) return;

    let isAutoScrolling = false;
    let lastScrollY = window.scrollY;
    let hasSnapped = false;
    let wasAboveMidpoint = true;
    let scrollEndTimeout: ReturnType<typeof setTimeout>;

    const handleScrollSnap = () => {
      const workEl = document.getElementById("work");
      if (!workEl) return;

      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;

      // If currently animating, just update lastScrollY and reset the end-detection timeout
      if (isAutoScrolling) {
        clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
          isAutoScrolling = false;
        }, 150);
        return;
      }

      const workRect = workEl.getBoundingClientRect();
      const midPoint = window.innerHeight * 0.5;
      const isAboveMidpoint = workRect.top > midPoint;

      // Reset snap flag if scrolled back up above the trigger zone
      if (workRect.top > window.innerHeight * 0.6) {
        hasSnapped = false;
      }

      // Trigger automatic scroll precisely when transitioning past the middle of the viewport
      if (
        scrollingDown &&
        !hasSnapped &&
        wasAboveMidpoint &&
        !isAboveMidpoint
      ) {
        hasSnapped = true;
        isAutoScrolling = true;

        const targetY = window.scrollY + workRect.top;
        window.scrollTo({ top: targetY, behavior: "smooth" });

        // Disable overwritten scroll control completely once the animation finishes
        clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
          isAutoScrolling = false;
          window.removeEventListener("scroll", handleScrollSnap);
        }, 600);
        return;
      }

      wasAboveMidpoint = isAboveMidpoint;
    };

    window.addEventListener("scroll", handleScrollSnap, { passive: true });

    // Initialize state properly on mount in case user loads halfway down the page
    const workEl = document.getElementById("work");
    if (workEl) {
      wasAboveMidpoint =
        workEl.getBoundingClientRect().top > window.innerHeight * 0.5;
      if (!wasAboveMidpoint) {
        hasSnapped = true;
        window.removeEventListener("scroll", handleScrollSnap);
      }
    }

    return () => {
      window.removeEventListener("scroll", handleScrollSnap);
      clearTimeout(scrollEndTimeout);
    };
  }, [loaderDone]);

  // Footer transition animation: smoothly scale works section into a zoomed-out rectangle peek
  useEffect(() => {
    if (!loaderDone) return;

    const worksSection =
      worksSectionRef.current || document.getElementById("work");
    const footerWrapper = document.getElementById("footer");

    if (worksSection && footerWrapper) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerWrapper,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      });

      tl.fromTo(
        worksSection,
        {
          scaleX: 1,
          scaleY: 1,
          transformOrigin: "bottom center",
        },
        {
          scaleX: 0.94,
          scaleY: 1,
          transformOrigin: "bottom center",
          ease: "power1.inOut",
        },
        0,
      );

      return () => {
        tl.kill();
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
      };
    }
  }, [loaderDone]);

  return (
    <>
      {loaderDone && <CustomCursor />}
      {loaderDone && <Navbar onAboutClick={handleAboutOpen} />}
      {loaderDone && (
        <AboutSidebar isOpen={aboutOpen} onClose={handleAboutClose} />
      )}
      {/* ── Hero section: fixed height so About slides over it ── */}
      <section className="hero-section">
        {/* Full-screen background carousel — always mounted so it's
            already animating when the loader reveals it.
            Title is rendered as children inside the carousel's 3D context
            so cards naturally depth-sort above and below the text. */}
        <div className="carousel-wrapper" ref={carouselWrapperRef}>
          <ImageCircleCarousel images={CAROUSEL_IMAGES}>
            {/* Hero title — only mounted after loader exits so DecryptedText
                fires its "view" animation fresh when the page is revealed */}
            {loaderDone && (
              <h1 ref={heroTitleRef} className="portfolio-title">
                <JosMarsalaLogo />
              </h1>
            )}
            {loaderDone && (
              <p className="hero-tagline" key={lang}>
                {t("hero_tagline")}
              </p>
            )}
          </ImageCircleCarousel>
        </div>

        {/* Cinematic intro loader */}
        {!loaderDone && <Loader onComplete={handleLoaderComplete} />}
      </section>

      {/* ── Content Wrapper: slides over hero on scroll ── */}
      <div className="content-wrapper">
        {/* ── Works overlay section: full white, slides over about quote on scroll ── */}
        <section
          className="works-overlay-section"
          id="work"
          ref={worksSectionRef}
        >
          <WorksSection
            triggerOnce={true}
            onProjectSelect={handleProjectSelect}
            onAboutClick={handleAboutOpen}
          />
        </section>

        {/* ── Footer section ── */}
        <section className="footer-section-wrapper" id="footer">
          <Footer onAboutClick={handleAboutOpen} />
        </section>
      </div>


    </>
  );
}

export default App;

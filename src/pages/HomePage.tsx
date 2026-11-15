import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "@/App.css";
import Loader from "@/Loader";
import JosMarsalaLogo from "@/JosMarsalaLogo";
import DeferredMount from "@/components/ui/DeferredMount";
import RouteFallback from "@/components/ui/RouteFallback";
import { getDirectLinkUrl, getProject } from "@/config/projects";
import { cdnAsset } from "@/config/cdn-assets";
import { SITE } from "@/config/site";
import { useAppShell } from "@/context/AppShellContext";
import { useLang } from "@/context/LanguageContext";
import { useSeo } from "@/lib/seo";

// Heavy, route-local bundles: WebGL carousel, scroll-animated works grid and the
// WebGL footer headline. None of these block the hero paint.
const ImageCircleCarousel = lazy(() => import("@/ImageCircleCarousel"));
const WorksSection = lazy(() => import("@/components/WorksSection"));
const Footer = lazy(() => import("@/Footer"));

const CAROUSEL_IMAGES = [
  cdnAsset("GYPSY__design-tokens.webp"),
  cdnAsset("GYPSY_mockup-phone.webp"),
  cdnAsset("MISU__energies-show.webp"),
  cdnAsset("LILIUM__mockup-book.webp"),
  cdnAsset("MISU__mockup-responsive.webp"),
  cdnAsset("MISU__logo-show.webp"),
  cdnAsset("LILIUM__design-tokens.webp"),
  cdnAsset("MISU__mockup-computer.gif"),
  cdnAsset("MISU__design-tokens.webp"),
  cdnAsset("MISU__mockup-poster.webp"),
  cdnAsset("VITALIA__mascot-show.webp"),
];

interface HomeLocationState {
  scrollTo?: string;
}

function HomePage() {
  const { lang, t } = useLang();
  const { loaderDone, completeLoader, openAbout } = useAppShell();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedScroll =
    (location.state as HomeLocationState | null)?.scrollTo ?? null;

  // The loader holds its split "jos" until every carousel image has appeared
  // in the centered stack, keeping the intro reveal seamless.
  const [carouselIntroDone, setCarouselIntroDone] = useState(false);
  const [imagesAppearing, setImagesAppearing] = useState(false);
  const handleCarouselIntroComplete = useCallback(() => {
    setCarouselIntroDone(true);
  }, []);
  const handleImagesStart = useCallback(() => {
    setImagesAppearing(true);
  }, []);

  useSeo({
    title: SITE.title,
    description: SITE.description,
    path: "/",
  });

  const handleProjectSelect = useCallback(
    (slug: string) => {
      const directLink = getDirectLinkUrl(slug);
      if (directLink) {
        window.open(directLink, "_blank", "noopener,noreferrer");
        return;
      }

      const project = getProject(slug) ?? getProject("vitalia");
      if (!project) return;

      navigate(`/projects/${project.slug}`);
    },
    [navigate],
  );

  // Refs for scroll-driven 3D animation
  const carouselWrapperRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const worksSectionRef = useRef<HTMLElement>(null);
  const isHeroTransitionActiveRef = useRef(true);

  // Scroll to a section requested by a cross-route link (e.g. closing a case
  // study returns to #work).
  useEffect(() => {
    if (!requestedScroll || !loaderDone) return;

    let frame = 0;
    const startedAt = performance.now();

    const tryScroll = () => {
      const element = document.getElementById(requestedScroll);
      if (element) {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        element.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "start",
        });
        navigate(location.pathname, { replace: true, state: null });
        return;
      }

      if (performance.now() - startedAt < 3000) {
        frame = requestAnimationFrame(tryScroll);
      }
    };

    frame = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(frame);
  }, [
    requestedScroll,
    loaderDone,
    navigate,
    location.pathname,
  ]);

  // Warm the case-study chunk once the home page is idle. Navigation stays
  // instant without pulling the full ProjectView bundle into the entry chunk.
  useEffect(() => {
    if (!loaderDone) return;

    const preload = () => {
      void import("@/pages/ProjectPage");
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(preload, { timeout: 2500 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }

    const timeout = window.setTimeout(preload, 1500);
    return () => window.clearTimeout(timeout);
  }, [loaderDone]);

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

    let cancelled = false;
    let teardown: (() => void) | undefined;
    let frame = 0;

    // GSAP loads after the shell has painted; the scroll listeners are only
    // attached once the library is ready.
    void import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;

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
        const titleFilterVal =
          titleBlur > 0.05 ? `blur(${titleBlur}px)` : "none";

        if (heroTitleRef.current) {
          gsap.set(heroTitleRef.current, {
            filter: titleFilterVal,
            opacity: 1,
          });
        }
      };

      // Coalesce scroll/resize work into one frame.
      const scheduleScroll = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          handleScroll();
        });
      };

      window.addEventListener("scroll", scheduleScroll, { passive: true });
      window.addEventListener("resize", scheduleScroll, { passive: true });
      // Run once on mount to set initial state
      handleScroll();

      teardown = () => {
        window.removeEventListener("scroll", scheduleScroll);
        window.removeEventListener("resize", scheduleScroll);
        if (frame) cancelAnimationFrame(frame);
      };
    });

    return () => {
      cancelled = true;
      teardown?.();
      if (frame) cancelAnimationFrame(frame);
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

    let cancelled = false;
    let teardown: (() => void) | undefined;

    // ScrollTrigger is only pulled in with this deferred GSAP import.
    void import("@/lib/gsap").then(({ gsap }) => {
      if (cancelled) return;

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

        teardown = () => {
          tl.kill();
          if (tl.scrollTrigger) tl.scrollTrigger.kill();
        };
      }
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [loaderDone]);

  return (
    <>
      {/* ── Hero section: fixed height so About slides over it ── */}
      <section className="hero-section">
        {/* Full-screen background carousel — always mounted so it's
            already animating when the loader reveals it.
            Title is rendered as children inside the carousel's 3D context
            so cards naturally depth-sort above and below the text. */}
        <div className="carousel-wrapper" ref={carouselWrapperRef}>
          <Suspense
            fallback={
              <RouteFallback variant="hero" label="loading visual" bare />
            }
          >
            <ImageCircleCarousel
              images={CAROUSEL_IMAGES}
              onImagesStart={handleImagesStart}
              onIntroComplete={handleCarouselIntroComplete}
            >
              {/* Hero title — only mounted after loader exits so DecryptedText
                  fires its "view" animation fresh when the page is revealed */}
              {loaderDone && (
                <div className="hero-editorial">
                  <h1 ref={heroTitleRef} className="portfolio-title">
                    <JosMarsalaLogo />
                  </h1>
                  <p className="hero-tagline" key={lang}>
                    {t("hero_tagline")}
                  </p>
                </div>
              )}
            </ImageCircleCarousel>
          </Suspense>
        </div>

        {/* Cinematic intro loader */}
        {!loaderDone && (
          <Loader
            ready={carouselIntroDone}
            imagesAppearing={imagesAppearing}
            onComplete={completeLoader}
          />
        )}
      </section>

      {/* ── Content Wrapper: slides over hero on scroll ── */}
      <div className="content-wrapper">
        {/* ── Works overlay section: full white, slides over about quote on scroll ── */}
        <section
          className="works-overlay-section"
          id="work"
          ref={worksSectionRef}
        >
          <DeferredMount mode="idle" idleTimeout={1000}>
            <Suspense
              fallback={<RouteFallback variant="section" label="loading work" />}
            >
              <WorksSection
                triggerOnce={true}
                onProjectSelect={handleProjectSelect}
                onAboutClick={openAbout}
              />
            </Suspense>
          </DeferredMount>
        </section>

        {/* ── Footer section ── */}
        <section className="footer-section-wrapper" id="footer">
          <DeferredMount mode="viewport" rootMargin="50% 0px 50% 0px">
            <Suspense
              fallback={
                <RouteFallback variant="section" label="loading footer" />
              }
            >
              <Footer onAboutClick={openAbout} />
            </Suspense>
          </DeferredMount>
        </section>
      </div>
    </>
  );
}

export default HomePage;

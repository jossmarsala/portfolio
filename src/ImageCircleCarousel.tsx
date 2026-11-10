import React, { useRef, useEffect } from "react";
import gsap from "gsap";

import styles from "./ImageCircleCarousel.module.css";
import {
  mountCardGlass,
  updateCardGlass,
  unmountCardGlass,
} from "./CardGlass";

interface ImageCircleCarouselProps {
  images: string[];
  children?: React.ReactNode;
}

export const ImageCircleCarousel: React.FC<ImageCircleCarouselProps> = ({
  images,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxContainerRef = useRef<HTMLDivElement>(null);
  const rotationContainerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const hoveredCardRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !containerRef.current ||
      !parallaxContainerRef.current ||
      !rotationContainerRef.current ||
      images.length === 0
    ) {
      return;
    }

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    const totalCards = cards.length;

    if (totalCards === 0) return;

    // Apply natural aspect ratios immediately for already-cached images.
    cards.forEach((card) => {
      const img = card.querySelector("img");
      if (img?.complete && img.naturalWidth && img.naturalHeight) {
        card.style.setProperty(
          "--card-aspect",
          `${img.naturalWidth} / ${img.naturalHeight}`,
        );
      }
    });

    // ── Editorial scale system ──────────────────────────────────────────────
    // A single uniform stage scale drives the card size so every dimension of
    // the composition stays proportional across viewports. The cascade span
    // and arc are derived from the live viewport below.
    const REFERENCE_WIDTH = 1440;
    const REFERENCE_HEIGHT = 900;
    const REFERENCE_CARD_HEIGHT = 206;

    const getStageScale = () =>
      Math.max(
        0.55,
        Math.min(
          1.15,
          window.innerWidth / REFERENCE_WIDTH,
          window.innerHeight / REFERENCE_HEIGHT,
        ),
      );

    const applyStageScale = () => {
      const container = containerRef.current;
      if (!container) return;
      container.style.setProperty(
        "--card-height",
        `${Math.round(REFERENCE_CARD_HEIGHT * getStageScale())}px`,
      );
    };

    applyStageScale();

    // Reset initial state
    gsap.set(cards, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      z: 0,
      rotation: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 0,
      opacity: 0,
      filter: "blur(0px) brightness(1)",
      boxShadow: "none",
    });

    // Reset parallax and rotation containers
    gsap.set(parallaxContainerRef.current, {
      x: 0,
      y: 0,
      z: 0,
      rotationX: 0,
      rotationY: 0,
    });
    gsap.set(rotationContainerRef.current, {
      x: 0,
      y: 0,
    });

    // Mount the Flex-Carousel-style liquid-glass lens inside every card.
    // The shader stays completely dormant until a card nears a viewport edge.
    cards.forEach((card, i) => {
      mountCardGlass(card, images[i], { distort: 1.35, chroma: 0.32 });
    });

    const tl = gsap.timeline({ delay: 1 });

    // Intro animation: stack appearance
    for (let i = 0; i < totalCards; i++) {
      const card = cards[i];
      const delay = (totalCards - 1 - i) * 0.1;

      gsap.set(card, { zIndex: 100 + (totalCards - 1 - i) });

      tl.to(
        card,
        {
          opacity: 1,
          scale: 0.8,
          duration: 0.6,
          ease: "power3.out",
        },
        delay,
      );
    }

    const calculatePositions = (offsetAngle = 0) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Full-bleed diagonal: the span intentionally overshoots the viewport so
      // the outermost cards are cropped by the screen edges and read as
      // emerging from them, rather than floating with side gutters. The 4%
      // overshoot keeps a card crossing each edge at every rotation phase.
      const spanX = width * 1.04;

      // Vertical rise is an even half of the viewport, capped so very tall
      // screens don't stretch the diagonal into a ramp.
      const spanY = Math.min(height * 0.5, 480);

      // Oval belly: a quarter of the vertical rise (capped) keeps the arc
      // proportional to the cascade at every screen height.
      const arcDepth = Math.min(spanY * 0.24, 108);

      return cards.map((_, i) => {
        // t ∈ [0, 1] = position along diagonal for this card
        const raw = i / totalCards + offsetAngle / (Math.PI * 2);
        const t = ((raw % 1) + 1) % 1; // wrap to [0, 1]

        // Elliptical profile: 0 at the ends, 1 at the centre.
        const oval = Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2)));
        const arc = oval * arcDepth;

        return {
          x: -spanX / 2 + t * spanX,
          y: spanY / 2 - t * spanY + arc,
        };
      });
    };

    // Calculate rich 3D spatial properties for each card based on its diagonal position
    const get3DAttributes = (
      basePos: { x: number; y: number },
      _currentRadiusX?: number,
    ) => {
      // y ranges from +spanY/2 (bottom-left / front) to −spanY/2 (top-right / back)
      const maxEstimatedY = Math.min(window.innerHeight * 0.3, 230);
      const yRatio = Math.max(-1, Math.min(1, basePos.y / maxEstimatedY));

      // Perspective scale for diagonal layout: front 1.22x, back 0.58x
      const depthScale = 0.9 + yRatio * 0.32;
      const depthZIndex = 100 + Math.round(yRatio * 50);

      // Z-depth: front cards clearly closer to the viewer
      const baseZ = yRatio * 130;

      // Diagonal cascade tilt (shelf ramp orientation)
      const rotX = 6;   // consistent forward lean
      const rotY = -22; // fixed side lean for the cascade look

      // Atmospheric depth: front brighter, back distinctly dimmer
      const brightness = 0.84 + ((yRatio + 1) / 2) * 0.18;

      // Slight blur only for the very back cards
      const depthBlur = yRatio < -0.15 ? (-yRatio - 0.15) * 0.8 : 0;

      // Ambient shadow for resting cards
      const shadowElev = Math.max(0, (yRatio + 1) / 2);
      const shadowAlpha = (shadowElev * 0.14).toFixed(3);
      const boxShadow =
        shadowElev > 0.1
          ? `${(shadowElev * 7).toFixed(0)}px ${(shadowElev * 12).toFixed(0)}px ${(8 + shadowElev * 20).toFixed(1)}px rgba(0, 0, 0, ${shadowAlpha})`
          : "none";

      return {
        yRatio,
        depthScale,
        depthZIndex,
        baseZ,
        rotX,
        rotY,
        brightness,
        depthBlur,
        boxShadow,
      };
    };

    const positions = calculatePositions();

    // Spread to diagonal
    tl.addLabel("spread");
    // Stage-relative horizontal footing: positive = right from viewport centre.
    const getFinalCenterOffsetX = () => Math.round(48 * getStageScale());
    // Push the cascade just above centre, scaling the lift with the viewport so
    // the top-most card never clips on short screens.
    const getFinalCenterOffsetY = () =>
      -Math.min(104, window.innerHeight * 0.115);
    const carouselFinalCenterOffsetY = getFinalCenterOffsetY();

    tl.to(
      rotationContainerRef.current,
      {
        x: getFinalCenterOffsetX(),
        y: carouselFinalCenterOffsetY,
        duration: 1.2,
        ease: "power3.inOut",
      },
      "spread",
    );

    cards.forEach((card, i) => {
      const basePos = positions[i];
      const currentRadiusX = Math.min(window.innerWidth * 0.49, 720);
      const {
        depthScale,
        depthZIndex,
        baseZ,
        rotX,
        rotY,
        brightness,
        depthBlur,
        boxShadow,
      } = get3DAttributes(basePos, currentRadiusX);

      gsap.set(card, { zIndex: depthZIndex });

      tl.to(
        card,
        {
          x: basePos.x,
          y: basePos.y,
          z: baseZ,
          scale: depthScale,
          rotationX: rotX,
          rotationY: rotY,
          rotationZ: 0,
          filter: `blur(${depthBlur}px) brightness(${brightness})`,
          boxShadow: boxShadow,
          duration: 1.2,
          ease: "power3.inOut",
        },
        "spread",
      );
    });

    const rotationProxy = { angle: 0 };
    // Smooth mouse coordinates and active state (0 = idle/off-screen, 1 = hovering carousel)
    const mouseProxy = { x: 0, y: 0, active: 0 };
    // Per-card eased hover influence: prevents snapping when the active card
    // changes or when the pointer crosses card boundaries during rotation.
    const smoothedInfluence = cards.map(() => 0);
    let lastTimeScaleTarget = 1;
    let rotationTween: gsap.core.Tween;

    tl.add(() => {
      rotationTween = gsap.to(rotationProxy, {
        angle: Math.PI * 2,
        duration: 100, // gentle base carousel speed
        repeat: -1,
        ease: "none",
        onUpdate: () => {
          const currentPositions = calculatePositions(rotationProxy.angle);
          const currentRadiusX = Math.min(window.innerWidth * 0.49, 720);
          const halfViewportWidth = Math.max(1, window.innerWidth / 2);
          const centerOffsetY = getFinalCenterOffsetY();

          // Find active card index: either direct card hover or proximity
          let activeIndex = hoveredCardRef.current;
          let minDistance = Infinity;

          if (activeIndex === null && mouseProxy.active > 0.01) {
            for (let i = 0; i < totalCards; i++) {
              const basePos = currentPositions[i];
              const cardScreenX = basePos.x + getFinalCenterOffsetX();
              const cardScreenY = basePos.y + centerOffsetY;
              const dx = mouseProxy.x - cardScreenX;
              const dy = mouseProxy.y - cardScreenY;
              const dist = Math.hypot(dx, dy);

              if (dist < minDistance) {
                minDistance = dist;
                activeIndex = i;
              }
            }
          }

          // Compute shelf activation level
          let shelfActivation = 0;
          if (hoveredCardRef.current !== null) {
            shelfActivation = 1.0;
            activeIndex = hoveredCardRef.current;
          } else if (activeIndex !== null && mouseProxy.active > 0.01) {
            const hoverRadius = Math.min(window.innerWidth * 0.22, 220);
            if (minDistance < hoverRadius) {
              const rawFactor = 1 - minDistance / hoverRadius;
              shelfActivation = Math.sin((rawFactor * Math.PI) / 2) * mouseProxy.active;
            }
          }

          let maxInfluenceObserved = 0;

          cards.forEach((card, i) => {
            const basePos = currentPositions[i];
            const {
              depthScale,
              depthZIndex,
              baseZ,
              rotX,
              rotY,
              brightness,
              depthBlur,
              boxShadow,
            } = get3DAttributes(basePos, currentRadiusX);

            let targetInfluence = 0;

            if (shelfActivation > 0.001 && activeIndex !== null) {
              // Circular index distance along the shelf
              let stepDiff = Math.abs(i - activeIndex);
              stepDiff = Math.min(stepDiff, totalCards - stepDiff);

              // Tight Gaussian: the hovered card dominates, immediate neighbours
              // only receive a gentle hint of the effect.
              const falloff = Math.exp(-(stepDiff * stepDiff) / (2 * 0.6 * 0.6));
              targetInfluence = shelfActivation * falloff;
            }

            // Ease toward the target influence so hover enter/leave and moving
            // between cards glides instead of jumping.
            const eased = smoothedInfluence[i];
            const influence = eased + (targetInfluence - eased) * 0.16;
            smoothedInfluence[i] = influence;

            if (influence > maxInfluenceObserved) {
              maxInfluenceObserved = influence;
            }

            // Hover only slides the image a little to the right — no extra
            // depth, scaling, tilt, brightness or shadow changes.
            const hoverShiftX = influence * 24;

            gsap.set(card, {
              x: basePos.x + hoverShiftX,
              y: basePos.y,
              z: baseZ,
              scale: depthScale,
              zIndex: depthZIndex,
              rotationX: rotX,
              rotationY: rotY,
              rotationZ: 0,
              filter: `blur(${depthBlur}px) brightness(${brightness})`,
              boxShadow: boxShadow,
            });

            // Flex-Carousel lens: cards crossing the left/right viewport edges
            // refract through invisible liquid glass with RGB dispersion. The
            // centre of the viewport stays perfectly crisp.
            const normX =
              (basePos.x + getFinalCenterOffsetX()) / halfViewportWidth;
            const edge = Math.min(
              1,
              Math.max(0, (Math.abs(normX) - 0.42) / 0.5),
            );
            updateCardGlass(card, {
              edgeDistort: edge * edge * (3 - 2 * edge),
              normX,
            });
          });

          // Softly ease carousel speed when inspecting/peeping a book.
          // Only tween when the target changes to avoid spawning a tween per frame.
          if (rotationTween) {
            const targetTimeScale = maxInfluenceObserved > 0.25 ? 0.35 : 1.0;
            if (targetTimeScale !== lastTimeScaleTarget) {
              lastTimeScaleTarget = targetTimeScale;
              gsap.to(rotationTween, {
                timeScale: targetTimeScale,
                duration: 0.5,
                ease: "power2.out",
                overwrite: "auto",
              });
            }
          }
        },
      });
    });

    // Mouse tracking: smoothly updates mouse coordinates without tilting whole carousel
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = clientX - innerWidth / 2;
      const y = clientY - innerHeight / 2;

      gsap.to(mouseProxy, {
        x,
        y,
        active: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    // Handle resize
    const handleResize = () => {
      applyStageScale();
      const currentPositions = calculatePositions(rotationProxy.angle);
      const currentRadiusX = Math.min(window.innerWidth * 0.49, 720);

      gsap.to(rotationContainerRef.current, {
        x: getFinalCenterOffsetX(),
        y: getFinalCenterOffsetY(),
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });

      cards.forEach((card, i) => {
        const basePos = currentPositions[i];
        const {
          depthScale,
          depthZIndex,
          baseZ,
          rotX,
          rotY,
          brightness,
          depthBlur,
          boxShadow,
        } = get3DAttributes(basePos, currentRadiusX);

        gsap.to(card, {
          x: basePos.x,
          y: basePos.y,
          z: baseZ,
          scale: depthScale,
          zIndex: depthZIndex,
          rotationX: rotX,
          rotationY: rotY,
          rotationZ: 0,
          filter: `blur(${depthBlur}px) brightness(${brightness})`,
          boxShadow: boxShadow,
          duration: 0.8,
          ease: "power2.out",
        });
      });
    };

    const handleMouseLeave = () => {
      hoveredCardRef.current = null;
      gsap.to(mouseProxy, {
        active: 0,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    window.addEventListener("mouseleave", handleMouseLeave);
    containerRef.current?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseleave", handleMouseLeave);
      containerRef.current?.removeEventListener("mouseleave", handleMouseLeave);

      const rotationNode = rotationContainerRef.current;

      // Cleanup GSAP tweens
      tl.kill();
      if (rotationTween) rotationTween.kill();
      gsap.killTweensOf(rotationProxy);
      gsap.killTweensOf(mouseProxy);
      gsap.killTweensOf(rotationNode);
      gsap.killTweensOf(cards);

      // Tear down the per-card liquid-glass lenses
      cards.forEach((card) => unmountCardGlass(card));
    };
  }, [images]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.parallaxContainer} ref={parallaxContainerRef}>
        <div className={styles.rotationContainer} ref={rotationContainerRef}>
          {images.map((src, index) => (
            <div
              key={index}
              className={styles.item}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              onMouseEnter={() => {
                hoveredCardRef.current = index;
              }}
              onMouseLeave={() => {
                if (hoveredCardRef.current === index) {
                  hoveredCardRef.current = null;
                }
              }}
            >
              <img
                src={src}
                alt={`Carousel item ${index}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  pointerEvents: "none",
                }}
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const card = img.parentElement;
                  if (!card || !img.naturalWidth || !img.naturalHeight) return;
                  // Let each image keep its own aspect ratio instead of being
                  // cropped into the fixed 3:4 card.
                  card.style.setProperty(
                    "--card-aspect",
                    `${img.naturalWidth} / ${img.naturalHeight}`,
                  );
                }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Rendered inside the 3D context so it depth-sorts naturally with cards */}
      {children}
    </div>
  );
};

export default ImageCircleCarousel;

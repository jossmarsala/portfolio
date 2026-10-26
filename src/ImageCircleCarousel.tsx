import React, { useRef, useEffect } from "react";
import gsap from "gsap";

import styles from "./ImageCircleCarousel.module.css";

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
      const radiusX = Math.min(width * 0.38, 500);
      const radiusY = Math.min(height * 0.3, 300);
      const tiltAngle = -Math.PI / 10; // -18 degrees tilt
      const angleStep = (Math.PI * 2) / totalCards;

      return cards.map((_, i) => {
        const angle = i * angleStep + offsetAngle;
        const x = radiusX * Math.cos(angle);
        const y = radiusY * Math.sin(angle);
        return {
          x: x * Math.cos(tiltAngle) - y * Math.sin(tiltAngle),
          y: x * Math.sin(tiltAngle) + y * Math.cos(tiltAngle),
        };
      });
    };

    // Calculate rich 3D spatial properties for each card based on its position in the orbit
    const get3DAttributes = (
      basePos: { x: number; y: number },
      currentRadiusX: number,
    ) => {
      const maxEstimatedY = window.innerHeight * 0.45;
      const yRatio = Math.max(-1, Math.min(1, basePos.y / maxEstimatedY));

      // 3D scale: balanced size difference between closer and further cards
      const depthScale = 1 + yRatio * 0.28;
      const depthZIndex = 100 + Math.round(yRatio * 50);

      // Subtle Z-space translation
      const baseZ = yRatio * 90;

      // Subtle 3D rotation: gentle pitch and soft curve yaw
      const rotX = 5 + yRatio * 2;
      const normX = currentRadiusX > 0 ? basePos.x / currentRadiusX : 0;
      const rotY = -Math.max(-1, Math.min(1, normX)) * 6;

      // Atmospheric depth: gentle opacity and brightness shifts
      const brightness = 0.95 + ((yRatio + 1) / 2) * 0.07;

      // Ultra-subtle optical softening for distant cards
      const depthBlur = yRatio < 0 ? -yRatio * 0.6 : 0;

      // Almost no shadows: barely-there whisper of ambient shadow for front cards
      const shadowElev = Math.max(0, (yRatio + 1) / 2);
      const shadowAlpha = (shadowElev * 0.035).toFixed(3);
      const boxShadow =
        shadowElev > 0.1
          ? `0px 2px ${(3 + shadowElev * 3).toFixed(1)}px rgba(0, 0, 0, ${shadowAlpha})`
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

    let positions = calculatePositions();

    // Spread to circle with full 3D spatial properties, moving final carousel center up slightly
    tl.addLabel("spread");
    const carouselFinalCenterOffsetY = -30; // Shifts final carousel orbit a bit up while keeping initial stack centered

    tl.to(
      rotationContainerRef.current,
      {
        y: carouselFinalCenterOffsetY,
        duration: 1.2,
        ease: "power3.inOut",
      },
      "spread",
    );

    cards.forEach((card, i) => {
      const basePos = positions[i];
      const currentRadiusX = Math.min(window.innerWidth * 0.38, 500);
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
          filter: `blur(${depthBlur}px) brightness(${brightness})`,
          boxShadow: boxShadow,
          duration: 1.2,
          ease: "power3.inOut",
        },
        "spread",
      );
    });

    // We use a proxy object to animate the global angle without nested DOM rotations,
    // which prevents the cards from visibly rotating on their own local axis.
    const rotationProxy = { angle: 0 };
    const mouseProxy = { x: 0, y: 0 }; // Proxy for smooth mouse tracking
    let rotationTween: gsap.core.Tween;

    tl.add(() => {
      rotationTween = gsap.to(rotationProxy, {
        angle: Math.PI * 2,
        duration: 100, // 40 seconds per full revolution
        repeat: -1,
        ease: "none",
        onUpdate: () => {
          const currentPositions = calculatePositions(rotationProxy.angle);
          const currentRadiusX = Math.min(window.innerWidth * 0.38, 500);

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

            // Calculate distance from card to smoothed mouse position
            const dx = mouseProxy.x - basePos.x;
            const dy = mouseProxy.y - basePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Curved proximity influence (closer to mouse = much stronger reaction)
            const maxDist = window.innerWidth * 0.6;
            const influence = Math.max(0, 1 - distance / maxDist);
            const curvedInfluence = Math.pow(influence, 3); // Cubed for a steeper curve

            // Subtler 2D parallax shift based on proximity
            const shiftX = -mouseProxy.x * 0.015 * curvedInfluence;
            const shiftY = -mouseProxy.y * 0.015 * curvedInfluence;
            const popZ = 6 * curvedInfluence; // Cards very subtly pop out towards you

            // Profoundity tilt: adjust Z depth based on mouse position to simulate a tilting carousel plane
            // without actually rotating the images (they stay perfectly parallel to the screen).
            const mouseNx = mouseProxy.x / (window.innerWidth / 2);
            const mouseNy = mouseProxy.y / (window.innerHeight / 2);

            const cardNx = basePos.x / currentRadiusX;
            const maxEstimatedY = window.innerHeight * 0.45;
            const cardNy = basePos.y / maxEstimatedY;

            // Tilt away from the mouse: side closest to mouse pushes back, opposite side comes forward
            const tiltZ = -(mouseNx * cardNx + mouseNy * cardNy) * 60; // depth differential

            // Subtle card-level tilt reaction to mouse for refined tactile skewing on the images themselves
            const cardTiltX = -mouseNy * 1.5;
            const cardTiltY = mouseNx * 2.0;

            gsap.set(card, {
              x: basePos.x + shiftX,
              y: basePos.y + shiftY,
              z: baseZ + popZ + tiltZ,
              scale: depthScale,
              zIndex: depthZIndex,
              rotationX: rotX + cardTiltX,
              rotationY: rotY + cardTiltY,
              filter: `blur(${depthBlur}px) brightness(${brightness})`,
              boxShadow: boxShadow,
            });
          });
        },
      });
    });

    // Smoothly track mouse position for the onUpdate loop
    // + subtle 3D tilt on the parallax container to skew/tilt the images in true 3D perspective
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = clientX - innerWidth / 2;
      const y = clientY - innerHeight / 2;

      gsap.to(mouseProxy, {
        x,
        y,
        duration: 2.0,
        ease: "power3.out",
      });

      // Subtle 3D tilt on the carousel container: tilts and skews the images themselves in 3D perspective
      const nx = x / (innerWidth / 2);
      const ny = y / (innerHeight / 2);

      const maxTiltX = 2.0; // subtle degrees pitch
      const maxTiltY = 2.5; // subtle degrees yaw

      gsap.to(parallaxContainerRef.current, {
        rotationX: -ny * maxTiltX,
        rotationY: nx * maxTiltY,
        duration: 2.4,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    // Handle resize to recalculate radius dynamically
    const handleResize = () => {
      const currentPositions = calculatePositions(rotationProxy.angle);
      const currentRadiusX = Math.min(window.innerWidth * 0.38, 500);

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
          filter: `blur(${depthBlur}px) brightness(${brightness})`,
          boxShadow: boxShadow,
          duration: 0.8,
          ease: "power2.out",
        });
      });
    };

    const handleMouseLeave = () => {
      gsap.to(mouseProxy, {
        x: 0,
        y: 0,
        duration: 2.2,
        ease: "power3.out",
      });

      gsap.to(parallaxContainerRef.current, {
        rotationX: 0,
        rotationY: 0,
        duration: 2.2,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    containerRef.current?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      containerRef.current?.removeEventListener("mouseleave", handleMouseLeave);

      const parallaxNode = parallaxContainerRef.current;
      const rotationNode = rotationContainerRef.current;

      // Cleanup GSAP tweens
      tl.kill();
      if (rotationTween) rotationTween.kill();
      gsap.killTweensOf(rotationProxy);
      gsap.killTweensOf(parallaxNode);
      gsap.killTweensOf(rotationNode);
      gsap.killTweensOf(cards);
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
            >
              <img
                src={src}
                alt={`Carousel item ${index}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                draggable={false}
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

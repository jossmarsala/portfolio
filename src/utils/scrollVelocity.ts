import { useState, useEffect } from "react";

export function useScrollVelocity(): number {
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let currentVelocity = 0;
    let rafId: number;

    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max(now - lastTime, 1);
      const currentScrollY = window.scrollY;
      const deltaY = Math.abs(currentScrollY - lastScrollY);

      currentVelocity = deltaY / dt;
      lastScrollY = currentScrollY;
      lastTime = now;
    };

    const update = () => {
      currentVelocity *= 0.9;
      if (currentVelocity < 0.0001) {
        currentVelocity = 0;
      }
      setVelocity(currentVelocity);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return velocity;
}

export default useScrollVelocity;

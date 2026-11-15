import { useEffect, useRef, useState, type ReactNode } from "react";

type MountMode = "idle" | "viewport";

export interface DeferredMountProps {
  children: ReactNode;
  /**
   * `idle` waits for the main thread to settle (or `idleTimeout` to elapse) and
   * is the right choice for content that is already part of the initial view.
   * `viewport` waits until the sentinel is within `rootMargin` of the viewport.
   */
  mode?: MountMode;
  /** Upper bound for `idle` mode, and the IntersectionObserver fallback. */
  idleTimeout?: number;
  /** Distance from the viewport at which `viewport` mode mounts. */
  rootMargin?: string;
  /** Mount immediately (useful for tests or reduced-motion preferences). */
  eager?: boolean;
}

/**
 * Defers mounting a subtree until the browser is idle or the subtree is close
 * to the viewport. Used to keep below-the-fold JS, CSS and media off the
 * critical path without changing the rendered layout.
 */
export function DeferredMount({
  children,
  mode = "idle",
  idleTimeout = 1200,
  rootMargin = "100% 0px 100% 0px",
  eager = false,
}: DeferredMountProps) {
  const [mounted, setMounted] = useState(eager);
  const sentinelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (mounted || eager) return;

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let observer: IntersectionObserver | undefined;

    const mount = () => {
      if (!cancelled) setMounted(true);
    };

    const scheduleTimeout = () => {
      timeoutId = setTimeout(mount, idleTimeout);
    };

    if (mode === "viewport" && "IntersectionObserver" in window) {
      const node = sentinelRef.current;
      if (!node) {
        mount();
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            mount();
          }
        },
        { rootMargin },
      );
      observer.observe(node);
    } else if (mode === "idle") {
      const idleWindow = window as Window & {
        requestIdleCallback?: (
          callback: () => void,
          options?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      };

      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(mount, {
          timeout: idleTimeout,
        });
      } else {
        scheduleTimeout();
      }
    } else {
      mount();
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) {
        (
          window as Window & {
            cancelIdleCallback?: (id: number) => void;
          }
        ).cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [eager, idleTimeout, mode, mounted, rootMargin]);

  if (!mounted) {
    if (mode === "viewport") {
      // Zero-height sentinel: lets us observe the section without adding
      // any visible box or shifting the layout.
      return (
        <span
          ref={sentinelRef}
          aria-hidden="true"
          style={{ display: "block", width: "100%", height: 0 }}
        />
      );
    }
    return null;
  }

  return <>{children}</>;
}

export default DeferredMount;

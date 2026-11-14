import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mediaUrl } from "@/lib/media";
import "./PortfolioMedia.css";

export interface PortfolioMediaProps {
  /**
   * Static image shown immediately and used as the strict fallback whenever the
   * video cannot play. Required so there is always something to render.
   */
  imageSrc: string;
  /** Optional looping video. Omit for image-only media. */
  videoSrc?: string;
  /** Accessible description. Use "" for purely decorative media. */
  alt: string;
  /** Wrapper class — controls the footprint of the media. */
  className?: string;
  imageClassName?: string;
  videoClassName?: string;
  /** Optional poster applied to the video while it buffers. */
  posterSrc?: string;
  /** Skip viewport gating (hero media that must paint immediately). */
  priority?: boolean;
  /** IntersectionObserver root margin. Defaults to 200px of look-ahead. */
  rootMargin?: string;
  draggable?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionOnServer() {
  return false;
}

/**
 * Viewport-aware video with a guaranteed static-image fallback.
 *
 * Behaviour:
 *  - Renders the image first, so layout never waits on video bytes.
 *  - Only assigns the video `src` / starts playback once the wrapper is in view.
 *  - Pauses when out of view (keeps the decoded frame, avoids re-downloads).
 *  - Falls back to the image on error, autoplay rejection or unsupported codec.
 *  - Never mounts a video at all when prefers-reduced-motion is set.
 *  - Paths run through `mediaUrl`, so swapping in a CDN is a one-env-var change.
 */
export function PortfolioMedia({
  imageSrc,
  videoSrc,
  alt,
  className = "",
  imageClassName = "",
  videoClassName = "",
  posterSrc,
  priority = false,
  rootMargin = "200px 0px",
  draggable = false,
  sizes,
  width,
  height,
}: PortfolioMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );

  const [inView, setInView] = useState(priority);
  // Once a video has entered the viewport we keep its src assigned so leaving
  // the viewport pauses playback instead of re-downloading on scroll back.
  const [shouldLoad, setShouldLoad] = useState(priority);
  // Failures and playback state are tracked per source, so a new videoSrc gets
  // a fresh attempt without a reset effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);

  const videoFailed = Boolean(videoSrc) && failedSrc === videoSrc;
  const showVideo = Boolean(videoSrc) && !reducedMotion && !videoFailed;
  const videoVisible = Boolean(videoSrc) && playingSrc === videoSrc;

  // Load / play only inside (or near) the viewport.
  useEffect(() => {
    if (priority) {
      setInView(true);
      setShouldLoad(true);
      return;
    }

    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setInView(true);
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setShouldLoad(true);
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [priority, rootMargin]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo || !inView || !videoSrc) return;

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch((error: DOMException) => {
        // Pausing an out-of-view video aborts the promise — that is expected.
        if (error.name === "AbortError") return;
        setFailedSrc(videoSrc);
      });
    }
  }, [showVideo, inView, videoSrc]);

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (video && !inView) video.pause();
  }, [showVideo, inView]);

  const wrapperClasses = ["portfolio-media", className]
    .filter(Boolean)
    .join(" ");
  const imageClasses = ["portfolio-media__image", imageClassName]
    .filter(Boolean)
    .join(" ");
  const videoClasses = ["portfolio-media__video", videoClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className={wrapperClasses}
      data-media-mode={showVideo ? "video" : "image"}
    >
      <img
        src={mediaUrl(imageSrc)}
        alt={alt}
        className={imageClasses}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        draggable={draggable}
        sizes={sizes}
        width={width}
        height={height}
      />

      {showVideo && videoSrc && (
        <video
          ref={videoRef}
          className={videoClasses}
          data-visible={videoVisible && inView ? "true" : "false"}
          // Assigning src on first view means no video bytes before scroll.
          src={shouldLoad ? mediaUrl(videoSrc) : undefined}
          poster={posterSrc ? mediaUrl(posterSrc) : undefined}
          muted
          loop
          playsInline
          preload={shouldLoad ? "auto" : "none"}
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlayingSrc(videoSrc)}
          onError={() => setFailedSrc(videoSrc)}
        />
      )}
    </div>
  );
}

export default PortfolioMedia;

import { forwardRef, type VideoHTMLAttributes } from "react";
import { posterForVideoSource, videoSourcesFor } from "@/lib/media";

export interface SourceVideoProps extends VideoHTMLAttributes<HTMLVideoElement> {
  /**
   * Video URL. When the CDN knows an H.264/MP4 sibling (or a `.webp` poster)
   * for it, both are added automatically so every browser gets a playable file.
   */
  src: string;
}

/**
 * `<video>` that renders a full `<source>` chain plus a poster.
 *
 * Safari/iOS do not reliably decode VP9 WebM, so WebM-only sources can leave a
 * blank hero. Passing `src` here lets the browser pick the best supported
 * format instead of committing to one container up front.
 */
export const SourceVideo = forwardRef<HTMLVideoElement, SourceVideoProps>(
  function SourceVideo({ src, poster, children, ...videoProps }, ref) {
    const sources = videoSourcesFor(src);

    return (
      <video
        ref={ref}
        poster={poster ?? posterForVideoSource(src)}
        {...videoProps}
      >
        {sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
        {children}
      </video>
    );
  },
);

export default SourceVideo;

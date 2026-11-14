import "./RouteFallback.css";

export type RouteFallbackVariant = "page" | "hero" | "section" | "overlay";

export interface RouteFallbackProps {
  variant?: RouteFallbackVariant;
  label?: string;
  /** Hide the visible label/track while keeping the status for assistive tech. */
  bare?: boolean;
}

/**
 * Minimal, motion-safe placeholder used while a lazy route or heavy animated
 * component is being fetched. Intentionally quieter than the site chrome.
 */
export function RouteFallback({
  variant = "page",
  label = "loading",
  bare = false,
}: RouteFallbackProps) {
  return (
    <div
      className={`route-fallback route-fallback--${variant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {!bare && (
        <>
          <span className="route-fallback__label" aria-hidden="true">
            [{label}]
          </span>
          <span className="route-fallback__track" aria-hidden="true">
            <span className="route-fallback__bar" />
          </span>
        </>
      )}
      <span className="route-fallback__sr-only">{label}</span>
    </div>
  );
}

export default RouteFallback;

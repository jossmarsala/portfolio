import "./OvalSpinner.css";

export interface OvalSpinnerProps {
  label?: string;
}

/**
 * Spinning oval-and-dot mark shown between the split "jos" halves while the
 * hero imagery loads. Mirrors the custom cursor geometry.
 */
export function OvalSpinner({ label = "loading" }: OvalSpinnerProps) {
  return (
    <div
      className="oval-spinner"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        className="oval-spinner__mark"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <ellipse cx="24" cy="24" rx="19" ry="11.5" fill="currentColor" />
        <circle
          className="oval-spinner__dot"
          cx="24"
          cy="24"
          r="4.5"
          fill="var(--color-bg, #efefef)"
        />
      </svg>
      <span className="oval-spinner__sr-only">{label}</span>
    </div>
  );
}

export default OvalSpinner;

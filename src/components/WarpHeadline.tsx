import WarpText, { type Props as WarpTextProps } from "../WarpText";
import { WARP_HEADLINE_PROPS } from "../config/warpTextPresets";
import "./WarpHeadline.css";

export interface WarpHeadlineProps {
  /** Text displayed in the left column. */
  leftText: string;
  /** Text displayed in the right column. */
  rightText: string;
  className?: string;
  /** Optional overrides for WarpText properties (fontSize, style height, etc.) */
  warpProps?: Partial<WarpTextProps>;
  leftWarpProps?: Partial<WarpTextProps>;
  rightWarpProps?: Partial<WarpTextProps>;
}

/**
 * Two-column typographic headline using WarpText.
 * Shared between WorksSection ("my / works.") and Footer ("let's / talk.").
 */
export function WarpHeadline({
  leftText,
  rightText,
  className = "",
  warpProps,
  leftWarpProps,
  rightWarpProps,
}: WarpHeadlineProps) {
  const mergedProps = {
    ...WARP_HEADLINE_PROPS,
    ...warpProps,
    style: {
      ...WARP_HEADLINE_PROPS.style,
      ...warpProps?.style,
    },
  };

  const leftMerged = {
    ...mergedProps,
    ...leftWarpProps,
    style: {
      ...mergedProps.style,
      ...leftWarpProps?.style,
    },
  };

  const rightMerged = {
    ...mergedProps,
    ...rightWarpProps,
    style: {
      ...mergedProps.style,
      ...rightWarpProps?.style,
    },
  };

  return (
    <div className={`warp-headline${className ? ` ${className}` : ""}`} aria-hidden="true">
      <div className="warp-headline__col">
        <WarpText {...leftMerged} text={leftText} align="left" />
      </div>
      <div className="warp-headline__col warp-headline__col--right">
        <WarpText {...rightMerged} text={rightText} align="right" />
      </div>
    </div>
  );
}

export default WarpHeadline;

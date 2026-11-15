import { useRef, useLayoutEffect, useState, type CSSProperties } from "react";
import "./JosMarsalaLogo.css";

export interface JosMarsalaLogoProps {
  isJosPortfolio?: boolean;
  onScrambleNext?: () => void;
}

// Per-column animation personality
const COL = [
  { delay: 0.03, dur: 1.15, ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
  { delay: 0.14, dur: 1.05, ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
  { delay: 0.28, dur: 1.25, ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
];

export default function JosMarsalaLogo({
  isJosPortfolio,
  onScrambleNext,
}: JosMarsalaLogoProps = {}) {
  const text =
    isJosPortfolio === false ? "i design. i develop." : "jos marsala";

  const measureRef = useRef<HTMLSpanElement>(null);
  // [split1%, split2%] — where each column boundary falls as % of total width
  const [splits, setSplits] = useState<[number, number] | null>(null);

  // Measure actual glyph positions synchronously before first paint
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    // The measure span renders a plain text node so Range can walk characters
    const textNode = el.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

    const { left: containerLeft, width: totalWidth } =
      el.getBoundingClientRect();
    if (totalWidth < 1) return;

    const colLen = Math.ceil(text.length / 3);
    const range = document.createRange();

    // Position cursor right before colLen-th char → that's the left edge of col 1
    range.setStart(textNode, colLen);
    range.setEnd(textNode, colLen);
    const s1 =
      ((range.getBoundingClientRect().left - containerLeft) / totalWidth) * 100;

    // Position cursor right before colLen*2-th char → left edge of col 2
    range.setStart(textNode, colLen * 2);
    range.setEnd(textNode, colLen * 2);
    const s2 =
      ((range.getBoundingClientRect().left - containerLeft) / totalWidth) * 100;

    setSplits([s1, s2]);
  }, [text]);

  // Derive inset left/right % for each column from measured splits
  const bounds = (i: number) => {
    const [s1, s2] = splits ?? [33.333, 66.666];
    // Add a tiny overlap to prevent subpixel anti-aliasing seam gaps
    const overlap = 0.4;
    if (i === 0) return { L: 0, R: Math.max(0, +(100 - s1 - overlap).toFixed(3)) };
    if (i === 1) return { L: Math.max(0, +(s1 - overlap).toFixed(3)), R: Math.max(0, +(100 - s2 - overlap).toFixed(3)) };
    // The display face uses tight negative tracking (-0.1em), which pulls the
    // final glyph inside the measured advance width. Extend the clip a few
    // percent past the right edge so the last "a" keeps its full ink.
    return { L: Math.max(0, +(s2 - overlap).toFixed(3)), R: -3 };
  };

  const renderText = () =>
    text.split("").map((char, i) => {
      const isTiltedO = char === "o" && i === 1 && text.startsWith("jos");
      return (
        <span
          key={i}
          className={isTiltedO ? "tilted-o" : undefined}
          style={{
            display: "inline-block",
            whiteSpace: char === " " ? "pre" : "normal",
          }}
        >
          {char}
        </span>
      );
    });

  return (
    <span
      className="jos-marsala-logo"
      style={{ display: "inline-block", position: "relative" }}
    >
      {/*
        Hidden measure span — plain text node so Range API can walk characters.
        Must inherit all font properties to match real rendered metrics.
      */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          font: "inherit",
          letterSpacing: "inherit",
        }}
      >
        {text}
      </span>

      {/*
        Animated columns mount synchronously after splits are measured.
        Softened with subtle opacity ramp and gentle micro-rise glide.
      */}
      {splits !== null &&
        COL.map(({ delay, dur, ease }, colIndex) => {
          const { L, R } = bounds(colIndex);
          return (
            <span
              key={colIndex}
              className="jos-logo-column"
              style={
                {
                  display: "inline-flex",
                  position: colIndex === 0 ? "relative" : "absolute",
                  top: 0,
                  left: 0,
                  width: colIndex === 0 ? "auto" : "100%",
                  height: "100%",
                  pointerEvents: colIndex === 0 ? "auto" : "none",
                  willChange: "clip-path, opacity, transform",
                  overflow: "visible",
                  "--jos-logo-l": `${L}%`,
                  "--jos-logo-r": `${R}%`,
                  animationDuration: `${dur}s, ${dur * 0.6}s`,
                  animationDelay: `${delay}s, ${delay}s`,
                  animationTimingFunction: `${ease}, ease-out`,
                } as CSSProperties
              }
              onAnimationEnd={
                colIndex === COL.length - 1
                  ? (event) => {
                      if (event.animationName === "jos-logo-column-clip") {
                        onScrambleNext?.();
                      }
                    }
                  : undefined
              }
            >
              {renderText()}
            </span>
          );
        })}
    </span>
  );
}

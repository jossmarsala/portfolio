import { useRef, useEffect, useCallback } from "react";
import JosMarsalaLogo from "./JosMarsalaLogo";

interface LayeredHeroTitleProps {
  isJosPortfolio: boolean;
  displayedPortfolio: boolean;
  onScrambleNext: () => void;
  aboveRef: React.RefObject<HTMLHeadingElement | null>;
  belowRef: React.RefObject<HTMLHeadingElement | null>;
}

export default function LayeredHeroTitle({
  isJosPortfolio,
  displayedPortfolio,
  onScrambleNext,
  aboveRef,
  belowRef,
}: LayeredHeroTitleProps) {
  const measureRef = useRef<HTMLDivElement>(null);

  const plainText = isJosPortfolio ? "jos marsala" : "i design. i develop.";
  const titleClass = `portfolio-title${!displayedPortfolio ? " secondary" : ""}`;

  const computeClips = useCallback(() => {
    const measureEl = measureRef.current;
    const above = aboveRef.current;
    const below = belowRef.current;
    if (!measureEl || !above || !below) return;

    const textNode = measureEl.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

    const text = textNode.textContent ?? "";
    if (!text) return;

    const containerRect = measureEl.getBoundingClientRect();
    const H = containerRect.height;
    if (H < 1) return;

    const range = document.createRange();
    const aboveParts: string[] = [];
    const belowParts: string[] = [];

    for (let i = 0; i < text.length; i++) {
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);

      const r = range.getBoundingClientRect();
      if (r.width < 1) continue;

      const x1 = +(r.left - containerRect.left).toFixed(2);
      const x2 = +(r.right - containerRect.left).toFixed(2);
      const h = +H.toFixed(2);

      const col = "M" + x1 + " 0L" + x2 + " 0L" + x2 + " " + h + "L" + x1 + " " + h + "Z";

      if (i % 2 === 0) {
        aboveParts.push(col);
      } else {
        belowParts.push(col);
      }
    }

    above.style.clipPath = aboveParts.length
      ? "path('" + aboveParts.join(" ") + "')"
      : "none";

    below.style.clipPath = belowParts.length
      ? "path('" + belowParts.join(" ") + "')"
      : "none";
  }, [aboveRef, belowRef]);

  useEffect(() => {
    const t = setTimeout(computeClips, 60);
    return () => clearTimeout(t);
  }, [computeClips, isJosPortfolio, displayedPortfolio]);

  useEffect(() => {
    const ro = new ResizeObserver(computeClips);
    const el = measureRef.current;
    if (el) ro.observe(el);
    window.addEventListener("resize", computeClips);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeClips);
    };
  }, [computeClips]);

  const logoProps = { isJosPortfolio, onScrambleNext };

  return (
    <>
      <div
        ref={measureRef}
        className={titleClass}
        style={{ visibility: "hidden", pointerEvents: "none", zIndex: -999 }}
        aria-hidden="true"
      >
        {plainText}
      </div>

      <h1
        ref={belowRef as React.RefObject<HTMLHeadingElement>}
        className={titleClass + " portfolio-title--behind"}
        aria-hidden="true"
      >
        <JosMarsalaLogo {...logoProps} />
      </h1>

      <h1
        ref={aboveRef as React.RefObject<HTMLHeadingElement>}
        className={titleClass + " portfolio-title--above"}
      >
        <JosMarsalaLogo {...logoProps} />
      </h1>
    </>
  );
}

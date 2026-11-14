import { useEffect, useState, useRef } from "react";
import OvalSpinner from "@/components/ui/OvalSpinner";
import "./Loader.css";

type Phase = "enter" | "split" | "compose" | "exit";

interface LoaderProps {
  onComplete: () => void;
  /**
   * When false, the split text stays open and the loader holds instead of
   * composing away. The home page sets this once the hero images have appeared.
   */
  ready?: boolean;
  /** Hide the oval mark as soon as the carousel images begin to appear. */
  imagesAppearing?: boolean;
}

/** Keep the split word visible long enough for the split + oval to read. */
const MIN_SPLIT_MS = 1300;
/** Sweep duration before the loader is removed. */
const COMPOSE_MS = 10;
const EXIT_MS = 400;
/** Safety valve: never trap the page behind the loader. */
const FALLBACK_MS = 8000;

export function Loader({
  onComplete,
  ready = true,
  imagesAppearing = false,
}: LoaderProps) {
  const [phase, setPhase] = useState<Phase>("enter");
  const [timedOut, setTimedOut] = useState(false);
  const mountedAtRef = useRef(0);
  const hasStartedExitRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    mountedAtRef.current = performance.now();
    const timer = setTimeout(() => setPhase("split"), 0);
    return () => clearTimeout(timer);
  }, []);

  // If the hero never reports back (chunk failure, stalled image), release the
  // loader anyway so the page remains reachable.
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  const canExit = ready || timedOut;

  useEffect(() => {
    if (!canExit || hasStartedExitRef.current) return;
    hasStartedExitRef.current = true;

    const elapsed = performance.now() - mountedAtRef.current;
    const hold = Math.max(0, MIN_SPLIT_MS - elapsed);

    const timers = [
      setTimeout(() => setPhase("compose"), hold),
      setTimeout(() => setPhase("exit"), hold + COMPOSE_MS),
      setTimeout(() => onCompleteRef.current(), hold + COMPOSE_MS + EXIT_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [canExit]);

  return (
    <div
      className={`loader loader--${phase}${
        imagesAppearing ? " loader--images" : ""
      }`}
      aria-hidden="true"
    >
      {/* Centered text stage */}
      <div className="loader__stage">
        {/* ── Split animation: two clipped copies of "jos" ── */}
        <div className="loader__split-group">
          {/*
            Left copy: clip-path shows only the left ~41% of the word.
            In Helvetica Bold at -0.1em tracking, "j" + left half of "o"
            sits at roughly 0–41% of the total word bounding box.
            Adjust --loader-clip-at in Loader.css to fine-tune the split.
          */}
          <div className="loader__half loader__half--left">
            <span className="loader__word">
              j<span className="tilted-o">o</span>s
            </span>
          </div>

          {/*
            Right copy: clip-path shows only the right ~59% of the word
            (right half of "o" + "s"). Absolutely overlays the left copy.
          */}
          <div className="loader__half loader__half--right">
            <span className="loader__word">
              j<span className="tilted-o">o</span>s
            </span>
          </div>
        </div>

        {/* Oval mark — appears in the gap once the word has split apart */}
        <div className="loader__mark">
          <OvalSpinner label="loading visual" />
        </div>
      </div>
    </div>
  );
}

export default Loader;

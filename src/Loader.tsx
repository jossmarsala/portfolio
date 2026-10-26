import { useEffect, useState, useRef } from "react";
import "./Loader.css";

type Phase = "enter" | "split" | "compose" | "exit";

interface LoaderProps {
  onComplete: () => void;
}

export function Loader({ onComplete }: LoaderProps) {
  const [phase, setPhase] = useState<Phase>("enter");

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("split"), 400),
      setTimeout(() => setPhase("compose"), 2200),
      setTimeout(() => setPhase("exit"), 2300),
      setTimeout(() => onCompleteRef.current(), 3100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={`loader loader--${phase}`} aria-hidden="true">
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
            <span className="loader__word">j<span className="tilted-o">o</span>s</span>
          </div>

          {/*
            Right copy: clip-path shows only the right ~59% of the word
            (right half of "o" + "s"). Absolutely overlays the left copy.
          */}
          <div className="loader__half loader__half--right">
            <span className="loader__word">j<span className="tilted-o">o</span>s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Loader;


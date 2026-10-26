import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import './DecryptedText.css';

export interface DecryptedTextProps extends HTMLMotionProps<'span'> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover' | 'inViewHover' | 'click';
  clickMode?: 'once' | 'toggle';
  onScrambleNext?: () => void;
  tiltO?: boolean;
}

type Direction = 'forward' | 'reverse';

export function DecryptedText({
  text: propText,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  clickMode = 'once',
  onScrambleNext,
  tiltO = false,
  ...props
}: DecryptedTextProps) {
  const [currentText, setCurrentText] = useState(propText);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const text = currentText;

  const containerRef = useRef<HTMLSpanElement>(null);
  const orderRef = useRef<number[]>([]);
  const pointerRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [justRevealedIndices, setJustRevealedIndices] = useState<Set<number>>(new Set());
  const justRevealedTimeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const availableChars = useMemo<string[]>(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).filter(char => char !== ' ' && char !== '\n')
      : characters.split('');
  }, [useOriginalCharsOnly, text, characters]);

  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) => {
      return originalText
        .split('')
        .map((char, i) => {
          if (char === ' ' || char === '\n') return char;
          if (currentRevealed.has(i)) return originalText[i];
          if (availableChars.length === 0) return char;
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join('');
    },
    [availableChars]
  );

  const computeOrder = useCallback(
    (len: number): number[] => {
      const order: number[] = [];
      if (len <= 0) return order;
      if (revealDirection === 'start') {
        for (let i = 0; i < len; i++) order.push(i);
        return order;
      }
      if (revealDirection === 'end') {
        for (let i = len - 1; i >= 0; i--) order.push(i);
        return order;
      }
      // center
      const middle = Math.floor(len / 2);
      let offset = 0;
      while (order.length < len) {
        if (offset % 2 === 0) {
          const idx = middle + offset / 2;
          if (idx >= 0 && idx < len) order.push(idx);
        } else {
          const idx = middle - Math.ceil(offset / 2);
          if (idx >= 0 && idx < len) order.push(idx);
        }
        offset++;
      }
      return order.slice(0, len);
    },
    [revealDirection]
  );

  const fillAllIndices = useCallback((): Set<number> => {
    const s = new Set<number>();
    for (let i = 0; i < text.length; i++) s.add(i);
    return s;
  }, [text]);

  const removeRandomIndices = useCallback((set: Set<number>, count: number): Set<number> => {
    const arr = Array.from(set);
    for (let i = 0; i < count && arr.length > 0; i++) {
      const idx = Math.floor(Math.random() * arr.length);
      arr.splice(idx, 1);
    }
    return new Set(arr);
  }, []);

  const shouldStartEncrypted = animateOn === 'click' || animateOn === 'view' || animateOn === 'inViewHover';

  const [displayText, setDisplayText] = useState<string>(() => {
    if (shouldStartEncrypted) {
      const pool = useOriginalCharsOnly
        ? Array.from(new Set(text.split(''))).filter(char => char !== ' ' && char !== '\n')
        : characters.split('');
      if (pool.length === 0) return text;
      return text
        .split('')
        .map(char => (char === ' ' || char === '\n' ? char : pool[Math.floor(Math.random() * pool.length)]))
        .join('');
    }
    return text;
  });

  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(!shouldStartEncrypted);
  const [direction, setDirection] = useState<Direction>('forward');

  const encryptInstantly = useCallback(() => {
    const emptySet = new Set<number>();
    setRevealedIndices(emptySet);
    setDisplayText(shuffleText(text, emptySet));
    setIsDecrypted(false);
  }, [text, shuffleText]);

  const triggerDecrypt = useCallback(() => {
    if (sequential) {
      orderRef.current = computeOrder(text.length);
      pointerRef.current = 0;
      setRevealedIndices(new Set());
    } else {
      setRevealedIndices(new Set());
    }
    setDisplayText(shuffleText(text, new Set()));
    setDirection('forward');
    setIsAnimating(true);
  }, [sequential, computeOrder, shuffleText, text]);

  const triggerReverse = useCallback(() => {
    if (sequential) {
      orderRef.current = computeOrder(text.length).slice().reverse();
      pointerRef.current = 0;
      setRevealedIndices(fillAllIndices());
      setDisplayText(shuffleText(text, fillAllIndices()));
    } else {
      setRevealedIndices(fillAllIndices());
      setDisplayText(shuffleText(text, fillAllIndices()));
    }
    setDirection('reverse');
    setIsAnimating(true);
  }, [sequential, computeOrder, fillAllIndices, shuffleText, text]);

  useEffect(() => {
    if (!isAnimating) return;

    let currentIteration = 0;

    const getNextIndex = (revealedSet: Set<number>): number => {
      const textLength = text.length;
      switch (revealDirection) {
        case 'start':
          return revealedSet.size;
        case 'end':
          return textLength - 1 - revealedSet.size;
        case 'center': {
          const middle = Math.floor(textLength / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;

          if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
            return nextIndex;
          }

          for (let i = 0; i < textLength; i++) {
            if (!revealedSet.has(i)) return i;
          }
          return 0;
        }
        default:
          return revealedSet.size;
      }
    };

    intervalRef.current = setInterval(() => {
      setRevealedIndices(prevRevealed => {
        if (sequential) {
          // Forward
          if (direction === 'forward') {
            if (prevRevealed.size < text.length) {
              const nextIndex = getNextIndex(prevRevealed);
              const newRevealed = new Set(prevRevealed);
              newRevealed.add(nextIndex);
              setDisplayText(shuffleText(text, newRevealed));
              // Mark this index as just-revealed for the entrance animation
              setJustRevealedIndices(prev => {
                const next = new Set(prev);
                next.add(nextIndex);
                return next;
              });
              // Remove the entrance class after the animation duration
              const existing = justRevealedTimeouts.current.get(nextIndex);
              if (existing) clearTimeout(existing);
              const tid = setTimeout(() => {
                setJustRevealedIndices(prev => {
                  const next = new Set(prev);
                  next.delete(nextIndex);
                  return next;
                });
                justRevealedTimeouts.current.delete(nextIndex);
              }, 280);
              justRevealedTimeouts.current.set(nextIndex, tid);
              return newRevealed;
            } else {
              clearInterval(intervalRef.current ?? undefined);
              setIsAnimating(false);
              setIsDecrypted(true);
              return prevRevealed;
            }
          }
          // Reverse
          if (direction === 'reverse') {
            if (pointerRef.current < orderRef.current.length) {
              const idxToRemove = orderRef.current[pointerRef.current++];
              const newRevealed = new Set(prevRevealed);
              newRevealed.delete(idxToRemove);
              setDisplayText(shuffleText(text, newRevealed));
              if (newRevealed.size === 0) {
                clearInterval(intervalRef.current ?? undefined);
                setIsAnimating(false);
                setIsDecrypted(false);
                if (onScrambleNext) onScrambleNext();
              }
              return newRevealed;
            } else {
              clearInterval(intervalRef.current ?? undefined);
              setIsAnimating(false);
              setIsDecrypted(false);
              if (onScrambleNext) onScrambleNext();
              return prevRevealed;
            }
          }
        } else {
          // Non-Sequential Forward
          if (direction === 'forward') {
            setDisplayText(shuffleText(text, prevRevealed));
            currentIteration++;
            if (currentIteration >= maxIterations) {
              clearInterval(intervalRef.current ?? undefined);
              setIsAnimating(false);
              setDisplayText(text);
              setIsDecrypted(true);
            }
            return prevRevealed;
          }

          // Non-Sequential Reverse
          if (direction === 'reverse') {
            let currentSet = prevRevealed;
            if (currentSet.size === 0) {
              currentSet = fillAllIndices();
            }
            const removeCount = Math.max(1, Math.ceil(text.length / Math.max(1, maxIterations)));
            const nextSet = removeRandomIndices(currentSet, removeCount);
            setDisplayText(shuffleText(text, nextSet));
            currentIteration++;
            if (nextSet.size === 0 || currentIteration >= maxIterations) {
              clearInterval(intervalRef.current ?? undefined);
              setIsAnimating(false);
              setIsDecrypted(false);
              setDisplayText(shuffleText(text, new Set()));
              if (onScrambleNext) onScrambleNext();
              return new Set();
            }
            return nextSet;
          }
        }
        return prevRevealed;
      });
    }, speed);

    const timeouts = justRevealedTimeouts.current;
    return () => {
      clearInterval(intervalRef.current ?? undefined);
      timeouts.forEach(tid => clearTimeout(tid));
      timeouts.clear();
    };
  }, [
    isAnimating,
    text,
    speed,
    maxIterations,
    sequential,
    revealDirection,
    shuffleText,
    direction,
    fillAllIndices,
    removeRandomIndices,
    onScrambleNext,
  ]);

  /* Click Behaviour */
  const handleClick = () => {
    if (animateOn !== 'click') return;

    if (clickMode === 'once') {
      if (isDecrypted) return;
      setDirection('forward');
      triggerDecrypt();
    }

    if (clickMode === 'toggle') {
      if (isDecrypted) {
        triggerReverse();
      } else {
        setDirection('forward');
        triggerDecrypt();
      }
    }
  };

  /* Hover Behaviour */
  const triggerHoverDecrypt = useCallback(() => {
    if (isAnimating) return;

    setRevealedIndices(new Set());
    setIsDecrypted(false);
    setDisplayText(shuffleText(text, new Set()));
    setDirection('forward');
    setIsAnimating(true);
  }, [isAnimating, text, shuffleText]);

  /* View Observer */
  useEffect(() => {
    if (animateOn !== 'view' && animateOn !== 'inViewHover') return;

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          triggerDecrypt();
          setHasAnimated(true);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [animateOn, hasAnimated, triggerDecrypt]);

  const prevPropsRef = useRef({ text: propText, animateOn });

  useEffect(() => {
    const prev = prevPropsRef.current;
    if (prev.text !== propText || prev.animateOn !== animateOn) {
      prevPropsRef.current = { text: propText, animateOn };
      if (prev.text !== propText && hasAnimated) {
        if (isDecrypted) {
          // eslint-disable-next-line
          setPendingText(propText);
          triggerReverse();
        } else {
          setCurrentText(propText);
        }
      } else if (animateOn === 'click') {
        encryptInstantly();
      } else if (animateOn === 'view' || animateOn === 'inViewHover') {
        if (!hasAnimated) {
          const emptySet = new Set<number>();
          setRevealedIndices(emptySet);
          setDisplayText(shuffleText(propText, emptySet));
          setIsDecrypted(false);
        }
      } else {
        setDisplayText(propText);
        setIsDecrypted(true);
        setRevealedIndices(new Set());
        setDirection('forward');
      }
    }
  }, [animateOn, propText, encryptInstantly, shuffleText, hasAnimated, triggerReverse, isDecrypted]);

  useEffect(() => {
    if (!isAnimating && !isDecrypted && pendingText !== null) {
      // eslint-disable-next-line
      setCurrentText(pendingText);
      setPendingText(null);
      setTimeout(() => {
        triggerDecrypt();
      }, 50);
    }
  }, [isAnimating, isDecrypted, pendingText, triggerDecrypt]);

  const animateProps =
    animateOn === 'hover' || animateOn === 'inViewHover'
      ? {
          onMouseEnter: triggerHoverDecrypt
        }
      : animateOn === 'click'
        ? {
            onClick: handleClick
          }
        : {};

  const combinedParentClassName = ['decrypted-text-wrapper', parentClassName].filter(Boolean).join(' ');

  return (
    <motion.span
      className={combinedParentClassName}
      ref={containerRef}
      {...animateProps}
      {...props}
    >
      <span className="decrypted-text-sr-only">{text}</span>

      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const isRevealedOrDone = revealedIndices.has(index) || (!isAnimating && isDecrypted);
          const isJustRevealed = justRevealedIndices.has(index);

          let stateClass: string;
          if (isRevealedOrDone) {
            stateClass = ['decrypted-text-revealed', className].filter(Boolean).join(' ');
          } else {
            stateClass = ['decrypted-text-encrypted', encryptedClassName].filter(Boolean).join(' ');
          }

          const enterClass = isJustRevealed ? 'decrypted-char-enter' : '';
          const letterOClass = (tiltO && char.toLowerCase() === 'o') ? 'tilted-o' : '';
          const combinedClass = ['decrypted-char', stateClass, enterClass, letterOClass].filter(Boolean).join(' ');

          return (
            <span key={index} className={combinedClass}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}

export default DecryptedText;

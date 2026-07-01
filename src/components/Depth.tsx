import React, { useState, useEffect, useMemo, useRef } from "react";
import { DepthContext, DepthContextValue } from "../context/DepthContext.js";
import { sentenceDiff, SentenceDiff } from "../diff/index.js";

export interface DepthProps {
  selectedIndex?: number;
  defaultIndex?: number;
  onChange?: (i: number) => void;
  children: React.ReactNode;
}

/**
 * Extracts text content recursively from React nodes.
 */
function getTextContent(node: React.ReactNode): string {
  if (node === null || node === undefined) {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }
  if (React.isValidElement(node)) {
    return getTextContent(node.props.children);
  }
  return "";
}

export function Depth({
  selectedIndex,
  defaultIndex,
  onChange,
  children,
}: DepthProps) {
  // Determine controlled state
  const isControlled = selectedIndex !== undefined && onChange !== undefined;

  const [internalIndex, setInternalIndex] = useState(defaultIndex ?? 0);
  const currentIndex = isControlled ? selectedIndex : internalIndex;

  // Hydration tracking
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Level data extraction
  const levels = useMemo(() => {
    const extracted: { label: string; text: string }[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const label = child.props.label || "";
        const text = getTextContent(child.props.children);
        extracted.push({ label, text });
      }
    });
    return extracted;
  }, [children]);

  // Pre-computed diff table
  const diffTable = useMemo(() => {
    const table: SentenceDiff[][] = [];
    if (levels.length > 0) {
      table.push(sentenceDiff("", levels[0].text));
      for (let i = 1; i < levels.length; i++) {
        table.push(sentenceDiff(levels[i - 1].text, levels[i].text));
      }
    }
    return table;
  }, [levels]);

  // Transition tracking for highlight decay
  const [isBackTransition, setIsBackTransition] = useState(false);
  const [justReturned, setJustReturned] = useState(false);
  const prevIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevIndexRef.current !== null) {
      if (currentIndex < prevIndexRef.current) {
        setIsBackTransition(true);
        setJustReturned(true);
      } else if (currentIndex > prevIndexRef.current) {
        setIsBackTransition(false);
        setJustReturned(false);
      }
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (justReturned) {
      const animFrameId = requestAnimationFrame(() => {
        setJustReturned(false);
      });
      return () => cancelAnimationFrame(animFrameId);
    }
  }, [justReturned]);

  const totalLevels = levels.length;

  const handleBack = () => {
    if (currentIndex > 0) {
      if (!isControlled) {
        setInternalIndex(currentIndex - 1);
      }
      onChange?.(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalLevels - 1) {
      if (!isControlled) {
        setInternalIndex(currentIndex + 1);
      }
      onChange?.(currentIndex + 1);
    }
  };

  const contextValue: DepthContextValue = {
    selectedIndex: currentIndex,
    totalLevels,
    labels: levels.map((l) => l.label),
    advance: handleNext,
    back: handleBack,
  };

  // SSR Fallback or Hydration Phase (isMounted is false)
  if (!isMounted) {
    const defaultLastIndex = totalLevels - 1;
    return (
      <DepthContext.Provider value={contextValue}>
        <div
          data-unfold-root
          data-level={defaultLastIndex}
          data-total-levels={totalLevels}
          role="region"
          aria-label={levels[defaultLastIndex]?.label}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                "data-unfold-active": index === defaultLastIndex ? "true" : undefined,
              } as any);
            }
            return child;
          })}
        </div>
      </DepthContext.Provider>
    );
  }

  // Interactive Client-Side Phase
  const currentDiff = diffTable[currentIndex] || [];

  return (
    <DepthContext.Provider value={contextValue}>
      <div
        data-unfold-root
        data-level={currentIndex}
        data-total-levels={totalLevels}
        role="region"
        aria-label={levels[currentIndex]?.label}
      >
        <div data-unfold-content aria-live="polite">
          {currentDiff
            .filter((item) => item.kind !== "removed")
            .map((item, index) => {
              const key = index;
              if (item.kind === "equal") {
                return (
                  <span key={key} data-sentence="equal">
                    {item.sentence}{" "}
                  </span>
                );
              } else {
                const sentenceText =
                  item.kind === "modified" ? item.after : item.sentence;
                const status =
                  isBackTransition && !justReturned ? "equal" : "added";
                return (
                  <span key={key} data-sentence={status}>
                    {sentenceText}{" "}
                  </span>
                );
              }
            })}
        </div>
        <div data-unfold-controls>
          <button
            data-unfold-back
            aria-disabled={currentIndex === 0 ? "true" : "false"}
            aria-label={
              currentIndex > 0
                ? `Go back to level: ${levels[currentIndex - 1]?.label}`
                : undefined
            }
            onClick={handleBack}
          >
            Back
          </button>
          <button
            data-unfold-next
            aria-disabled={currentIndex === totalLevels - 1 ? "true" : "false"}
            aria-label={
              currentIndex < totalLevels - 1
                ? `Advance to level: ${levels[currentIndex + 1]?.label}`
                : undefined
            }
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </DepthContext.Provider>
  );
}

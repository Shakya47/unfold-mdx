import React, { useState, useEffect, useMemo, useRef } from "react";
import { DepthContext, DepthContextValue } from "../context/DepthContext.js";
import { sentenceDiff, SentenceDiff } from "../diff/index.js";
import { codeDiff, CodeLineDiff } from "../diff/codeDiff.js";
import { DepthLevel } from "./DepthLevel.js";
import { DepthCode } from "./DepthCode.js";
import { DepthPane } from "./DepthPane.js";
import { Controls } from "./controls/Controls.js";
import type { ShikiHighlighter } from "../shiki/index.js";

export interface DepthProps {
  selectedIndex?: number;
  defaultIndex?: number;
  onChange?: (i: number) => void;
  orientation?: "horizontal" | "vertical";
  ratio?: number;
  show?: "both" | "prose" | "code";
  indicators?: boolean;
  buttonVariant?: "text" | "arrow" | "chevron" | "minimal";
  animate?: boolean;
  highlight?: boolean;
  highlighter?: ShikiHighlighter;
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
  orientation = "horizontal",
  ratio = 0.5,
  show = "both",
  indicators = false,
  buttonVariant = "text",
  animate = true,
  highlight = true,
  highlighter,
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
  const parsedChildren = useMemo(() => {
    const proseLevels: { label: string; text: string }[] = [];
    const codeLevels: { lang: string; label: string; text: string }[] = [];

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const type = (child.type as any)?.unfoldType || child.type;
        if (type === "level" || type === DepthLevel) {
          proseLevels.push({
            label: child.props.label || "",
            text: getTextContent(child.props.children),
          });
        } else if (type === "code" || type === DepthCode) {
          codeLevels.push({
            lang: child.props.lang || "",
            label: child.props.label || "",
            text: getTextContent(child.props.children),
          });
        }
      }
    });
    return { proseLevels, codeLevels };
  }, [children]);

  // Pre-computed diff tables
  const proseDiffTable = useMemo(() => {
    const table: SentenceDiff[][] = [];
    if (parsedChildren.proseLevels.length > 0) {
      table.push(sentenceDiff("", parsedChildren.proseLevels[0].text));
      for (let i = 1; i < parsedChildren.proseLevels.length; i++) {
        table.push(sentenceDiff(parsedChildren.proseLevels[i - 1].text, parsedChildren.proseLevels[i].text));
      }
    }
    return table;
  }, [parsedChildren.proseLevels]);

  const codeDiffTable = useMemo(() => {
    const table: CodeLineDiff[][] = [];
    if (parsedChildren.codeLevels.length > 0) {
      table.push(codeDiff("", parsedChildren.codeLevels[0].text));
      for (let i = 1; i < parsedChildren.codeLevels.length; i++) {
        table.push(codeDiff(parsedChildren.codeLevels[i - 1].text, parsedChildren.codeLevels[i].text));
      }
    }
    return table;
  }, [parsedChildren.codeLevels]);

  // Transition tracking for enter animation
  const [justEntered, setJustEntered] = useState(false);
  const prevIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevIndexRef.current !== null && currentIndex !== prevIndexRef.current) {
      setJustEntered(true);
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (justEntered) {
      const animFrameId = requestAnimationFrame(() => {
        setJustEntered(false);
      });
      return () => cancelAnimationFrame(animFrameId);
    }
  }, [justEntered]);

  const totalSteps = Math.max(parsedChildren.proseLevels.length, parsedChildren.codeLevels.length, 1);

  const goTo = (index: number) => {
    if (index >= 0 && index < totalSteps) {
      if (!isControlled) {
        setInternalIndex(index);
      }
      onChange?.(index);
    }
  };

  const handleBack = () => goTo(currentIndex - 1);
  const handleNext = () => goTo(currentIndex + 1);

  // Generate labels spanning up to totalSteps
  const maxLabels = Math.max(parsedChildren.proseLevels.length, parsedChildren.codeLevels.length);
  const labels = Array.from({ length: maxLabels }).map((_, i) => {
    return parsedChildren.proseLevels[i]?.label || parsedChildren.codeLevels[i]?.label || `Step ${i + 1}`;
  });

  const contextValue: DepthContextValue = {
    selectedIndex: currentIndex,
    totalSteps,
    labels,
    show,
    orientation,
    goTo,
    advance: handleNext,
    back: handleBack,
  };

  // SSR Fallback or Hydration Phase (isMounted is false)
  if (!isMounted) {
    const defaultLastIndex = totalSteps - 1;
    let proseCount = 0;
    let codeCount = 0;
    const maxProse = parsedChildren.proseLevels.length;
    const maxCode = parsedChildren.codeLevels.length;

    return (
      <DepthContext.Provider value={contextValue}>
        <div
          data-unfold-root
          data-orientation={orientation}
          data-show={show}
          style={{ "--unfold-ratio": ratio } as React.CSSProperties}
          data-level={defaultLastIndex}
          data-total-levels={totalSteps}
          role="region"
          aria-label={labels[defaultLastIndex]}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              const type = (child.type as any)?.unfoldType || child.type;
              if (type === "level" || type === DepthLevel) {
                const isDeepest = proseCount === Math.max(0, maxProse - 1);
                proseCount++;
                return React.cloneElement(child, {
                  "data-unfold-active": isDeepest ? "true" : undefined,
                } as any);
              } else if (type === "code" || type === DepthCode) {
                const isDeepest = codeCount === Math.max(0, maxCode - 1);
                codeCount++;
                return React.cloneElement(child, {
                  "data-unfold-active": isDeepest ? "true" : undefined,
                } as any);
              }
            }
            return child;
          })}
        </div>
      </DepthContext.Provider>
    );
  }

  // Interactive Client-Side Phase
  // Clamp index for panes if they are shorter than total steps
  const clampedProseIndex = Math.min(currentIndex, proseDiffTable.length - 1);
  const clampedCodeIndex = Math.min(currentIndex, codeDiffTable.length - 1);

  const currentProseDiff = clampedProseIndex >= 0 ? proseDiffTable[clampedProseIndex] : [];
  const currentCodeDiff = clampedCodeIndex >= 0 ? codeDiffTable[clampedCodeIndex] : [];
  
  const currentCodeLang = clampedCodeIndex >= 0 ? parsedChildren.codeLevels[clampedCodeIndex]?.lang : undefined;
  const currentCodeText = clampedCodeIndex >= 0 ? parsedChildren.codeLevels[clampedCodeIndex]?.text : undefined;

  return (
    <DepthContext.Provider value={contextValue}>
      <div
        data-unfold-root
        data-orientation={orientation}
        data-show={show}
        style={{ "--unfold-ratio": ratio } as React.CSSProperties}
        data-level={currentIndex}
        data-total-levels={totalSteps}
        role="region"
        aria-label={labels[currentIndex]}
      >
        <DepthPane
          show={show}
          proseDiff={currentProseDiff}
          codeDiff={currentCodeDiff}
          justEntered={justEntered}
          animate={animate}
          codeLang={currentCodeLang}
          codeText={currentCodeText}
          highlighter={highlighter}
          highlight={highlight}
        />
        <Controls buttonVariant={buttonVariant} indicators={indicators} />
      </div>
    </DepthContext.Provider>
  );
}

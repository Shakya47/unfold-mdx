import { useSyncExternalStore } from "react";
import { SentenceDiff } from "../diff/index.js";
import { CodeLineDiff } from "../diff/codeDiff.js";
import type { ShikiHighlighter } from "../shiki/index.js";

interface DepthPaneProps {
  show: "both" | "prose" | "code";
  proseDiff: SentenceDiff[];
  codeDiff: CodeLineDiff[];
  justEntered: boolean;
  animate: boolean;
  codeLang?: string;
  codeText?: string;
  highlighter?: ShikiHighlighter;
  highlight?: boolean;
}

// Dummy subscribe for when highlighter is not provided
const noopSubscribe = () => () => {};

export function DepthPane({
  show,
  proseDiff,
  codeDiff,
  justEntered,
  animate,
  codeLang,
  codeText,
  highlighter,
  highlight = true,
}: DepthPaneProps) {
  const showProse = show === "both" || show === "prose";
  const showCode = show === "both" || show === "code";

  // When animating, we set data-enter on newly revealed tokens for one frame.
  const enterState = animate && justEntered ? "true" : undefined;
  
  // Status calculation
  const getStatus = (itemKind: "added" | "equal" | "modified" | "changed") => {
    if (!highlight || itemKind === "equal") return "equal";
    return "added";
  };

  // Subscribe to highlighter state if provided
  useSyncExternalStore(
    highlighter?.subscribe ?? noopSubscribe,
    () => highlighter?.getSnapshot() ?? 0,
    () => highlighter?.getSnapshot() ?? 0
  );

  let finalCodeDiff = codeDiff;
  if (highlighter && codeText !== undefined && codeLang !== undefined) {
    const highlighted = highlighter.highlight(codeText, codeLang, codeDiff);
    if (highlighted) {
      finalCodeDiff = highlighted;
    }
  }

  return (
    <div data-unfold-panes>
      {showProse && (
        <div data-unfold-pane="prose" aria-live="polite">
          {proseDiff
            .filter((item) => item.kind !== "removed")
            .map((item, index) => {
              const status = getStatus(item.kind);

              const sentenceText = item.kind === "modified" ? item.after : item.sentence;

              return (
                <span
                  key={`prose-${index}`}
                  data-sentence={status}
                  data-enter={status === "added" ? enterState : undefined}
                >
                  {sentenceText}{" "}
                </span>
              );
            })}
        </div>
      )}

      {showCode && (
        <div data-unfold-pane="code" aria-live="polite">
          <pre data-lang={codeLang}>
            <code>
              {finalCodeDiff.map((lineDiff, lineIndex) => {
                const lineText = lineDiff.tokens ? lineDiff.tokens.map(t => t.text).join("") : (lineDiff as any).line || "";
                const isWhitespaceOnly = lineText.trim() === "";
                const lineStatus = isWhitespaceOnly ? "equal" : getStatus(lineDiff.kind);
                
                if (lineDiff.kind === "equal" && !lineDiff.tokens) {
                  return (
                    <span key={`line-${lineIndex}`} data-code-line="equal">
                      {lineDiff.line}
                      {"\n"}
                    </span>
                  );
                }
                
                return (
                  <span
                    key={`line-${lineIndex}`}
                    data-code-line={lineStatus}
                    data-enter={lineStatus === "added" ? enterState : undefined}
                  >
                    {lineDiff.tokens?.map((token, tokenIndex) => {
                      const tokenStatus = getStatus(token.kind);
                      return (
                        <span
                          key={`token-${tokenIndex}`}
                          data-code-token={isWhitespaceOnly ? "equal" : tokenStatus}
                          style={token.color ? { color: token.color } : undefined}
                        >
                          {token.text}
                        </span>
                      );
                    })}
                    {"\n"}
                  </span>
                );
              })}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}

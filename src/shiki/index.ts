import { getHighlighter, HighlighterCore } from "shiki";
import type { CodeLineDiff, CodeToken } from "../diff/codeDiff.js";

export interface ShikiAdapterOptions {
  theme?: string;
  langs?: string[];
}

export interface ShikiHighlighter {
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => number;
  highlight: (code: string, lang: string, diffLines: CodeLineDiff[]) => CodeLineDiff[] | undefined;
}

function mergeTokens(diffTokens: CodeToken[], syntaxTokens: { content: string; color?: string }[]): CodeToken[] {
  const chars: { char: string; kind: "equal" | "added"; color?: string }[] = [];

  for (const dt of diffTokens) {
    for (const char of dt.text) {
      chars.push({ char, kind: dt.kind });
    }
  }

  let charIdx = 0;
  for (const st of syntaxTokens) {
    const len = st.content.length;
    for (let i = 0; i < len; i++) {
      if (charIdx < chars.length) {
        chars[charIdx].color = st.color;
      }
      charIdx++;
    }
  }

  const merged: CodeToken[] = [];
  if (chars.length === 0) return merged;

  let currentKind = chars[0].kind;
  let currentColor = chars[0].color;
  let currentText = chars[0].char;

  for (let i = 1; i < chars.length; i++) {
    const c = chars[i];
    if (c.kind === currentKind && c.color === currentColor) {
      currentText += c.char;
    } else {
      merged.push({ kind: currentKind, color: currentColor, text: currentText });
      currentKind = c.kind;
      currentColor = c.color;
      currentText = c.char;
    }
  }
  merged.push({ kind: currentKind, color: currentColor, text: currentText });

  return merged;
}

export function createShikiHighlighter(options: ShikiAdapterOptions = {}): ShikiHighlighter {
  let highlighter: HighlighterCore | null = null;
  let isReady = false;
  let tick = 0;

  const listeners = new Set<() => void>();

  const notify = () => {
    tick++;
    listeners.forEach((fn) => fn());
  };

  const defaultTheme = options.theme || "vitesse-dark";
  const defaultLangs = options.langs || ["javascript", "typescript", "jsx", "tsx", "css", "html", "json", "markdown"];

  getHighlighter({
    themes: [defaultTheme],
    langs: defaultLangs,
  })
    .then((h) => {
      highlighter = h;
      isReady = true;
      notify();
    })
    .catch((err) => {
      console.error("[unfold-mdx] Failed to initialize Shiki highlighter:", err);
    });

  return {
    subscribe: (onStoreChange: () => void) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    getSnapshot: () => tick,
    highlight: (code: string, lang: string, diffLines: CodeLineDiff[]): CodeLineDiff[] | undefined => {
      if (!isReady || !highlighter) {
        return undefined; // Fall back to raw diff lines
      }

      let syntaxLines;
      try {
        syntaxLines = highlighter.codeToTokensBase(code, {
          lang,
          theme: defaultTheme,
        });
      } catch (e) {
        // Unknown language or missing grammar
        return undefined;
      }

      return diffLines.map((lineDiff, i) => {
        const syntaxTokens = syntaxLines[i] || [];

        let diffTokens: CodeToken[];
        if (lineDiff.kind === "equal" && !lineDiff.tokens) {
          diffTokens = [{ kind: "equal", text: lineDiff.line }];
        } else {
          diffTokens = lineDiff.tokens || [];
        }

        const mergedTokens = mergeTokens(diffTokens, syntaxTokens);

        return {
          ...lineDiff,
          tokens: mergedTokens,
        } as CodeLineDiff;
      });
    },
  };
}

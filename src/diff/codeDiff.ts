import { diff_match_patch } from "diff-match-patch";
import { tokenizeLines, tokenizeCodeLine } from "./codeTokenize.js";

export interface CodeToken {
  kind: "equal" | "added";
  text: string;
  color?: string; // Optional color from syntax highlighter
}

export type CodeLineDiff =
  | { kind: "equal"; line: string; tokens?: CodeToken[] }
  | { kind: "added"; tokens: CodeToken[] }
  | { kind: "changed"; tokens: CodeToken[] };

export function codeDiff(prev: string, next: string): CodeLineDiff[] {
  if (prev === "" && next !== "") {
    // Bootstrap first step
    return tokenizeLines(next).map((line) => ({
      kind: "added",
      tokens: tokenizeCodeLine(line).map((t) => ({ kind: "added", text: t })),
    }));
  }

  const prevLines = tokenizeLines(prev);
  const nextLines = tokenizeLines(next);

  // Line-level diff
  const lineToChar = new Map<string, string>();
  const charToLine: string[] = [];

  function getCharForLine(line: string): string {
    let char = lineToChar.get(line);
    if (char === undefined) {
      const code = charToLine.length;
      char = String.fromCharCode(code);
      lineToChar.set(line, char);
      charToLine.push(line);
    }
    return char;
  }

  const prevChars = prevLines.map(getCharForLine).join("");
  const nextChars = nextLines.map(getCharForLine).join("");

  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(prevChars, nextChars);
  dmp.diff_cleanupSemantic(diffs);

  const result: CodeLineDiff[] = [];
  let i = 0;
  while (i < diffs.length) {
    const [op, text] = diffs[i];

    if (op === 0) {
      // EQUAL
      for (let j = 0; j < text.length; j++) {
        result.push({
          kind: "equal",
          line: charToLine[text.charCodeAt(j)],
        });
      }
      i++;
    } else if (op === -1 && i + 1 < diffs.length && diffs[i + 1][0] === 1) {
      // DELETE followed by INSERT -> modified (changed)
      const deleteText = text;
      const insertText = diffs[i + 1][1];

      const deleteLen = deleteText.length;
      const insertLen = insertText.length;
      const minLen = Math.min(deleteLen, insertLen);

      // Changed lines
      for (let j = 0; j < minLen; j++) {
        const prevLine = charToLine[deleteText.charCodeAt(j)];
        const nextLine = charToLine[insertText.charCodeAt(j)];

        const prevTokens = tokenizeCodeLine(prevLine);
        const nextTokens = tokenizeCodeLine(nextLine);

        const tokenToChar = new Map<string, string>();
        const charToToken: string[] = [];
        
        function getCharForToken(tok: string): string {
          let char = tokenToChar.get(tok);
          if (char === undefined) {
            const code = charToToken.length;
            char = String.fromCharCode(code);
            tokenToChar.set(tok, char);
            charToToken.push(tok);
          }
          return char;
        }

        const prevTokChars = prevTokens.map(getCharForToken).join("");
        const nextTokChars = nextTokens.map(getCharForToken).join("");
        const tokDiffs = dmp.diff_main(prevTokChars, nextTokChars);
        dmp.diff_cleanupSemantic(tokDiffs);

        const tokens: CodeToken[] = [];
        for (let k = 0; k < tokDiffs.length; k++) {
          const [tokOp, tokText] = tokDiffs[k];
          if (tokOp === 0) {
            for (let c = 0; c < tokText.length; c++) {
              tokens.push({ kind: "equal", text: charToToken[tokText.charCodeAt(c)] });
            }
          } else if (tokOp === 1) {
            for (let c = 0; c < tokText.length; c++) {
              tokens.push({ kind: "added", text: charToToken[tokText.charCodeAt(c)] });
            }
          }
          // -1 (DELETE) is ignored because we only show next state tokens
        }

        result.push({ kind: "changed", tokens });
      }

      // Remaining inserted lines
      for (let j = minLen; j < insertLen; j++) {
        const line = charToLine[insertText.charCodeAt(j)];
        const tokens = tokenizeCodeLine(line).map((t) => ({ kind: "added" as const, text: t }));
        result.push({ kind: "added", tokens });
      }
      
      i += 2;
    } else if (op === -1) {
      // Lone DELETE -> dropped.
      i++;
    } else if (op === 1) {
      // Lone INSERT -> added
      for (let j = 0; j < text.length; j++) {
        const line = charToLine[text.charCodeAt(j)];
        const tokens = tokenizeCodeLine(line).map((t) => ({ kind: "added" as const, text: t }));
        result.push({ kind: "added", tokens });
      }
      i++;
    }
  }

  return result;
}

import { diff_match_patch } from "diff-match-patch";
import { tokenize } from "./tokenize.js";

export type SentenceDiff =
  | { kind: "equal";    sentence: string }
  | { kind: "added";    sentence: string }
  | { kind: "removed";  sentence: string }
  | { kind: "modified"; before: string; after: string };

/**
 * Given two consecutive full-snapshot strings, returns a structured diff
 * describing which sentences are unchanged, added, removed, or modified.
 */
export function sentenceDiff(prev: string, next: string): SentenceDiff[] {
  const prevSentences = tokenize(prev);
  const nextSentences = tokenize(next);

  // Map each unique sentence to a unique character code (DMP sentence-mode trick)
  const sentenceToChar = new Map<string, string>();
  const charToSentence: string[] = [];

  function getCharForSentence(sentence: string): string {
    let char = sentenceToChar.get(sentence);
    if (char === undefined) {
      const code = charToSentence.length;
      // Use 16-bit code points. This is safe up to 65536 unique sentences.
      char = String.fromCharCode(code);
      sentenceToChar.set(sentence, char);
      charToSentence.push(sentence);
    }
    return char;
  }

  const prevChars = prevSentences.map(getCharForSentence).join("");
  const nextChars = nextSentences.map(getCharForSentence).join("");

  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(prevChars, nextChars);
  dmp.diff_cleanupSemantic(diffs);

  const result: SentenceDiff[] = [];
  let i = 0;
  while (i < diffs.length) {
    const [op, text] = diffs[i];

    if (op === 0) {
      // 0 = EQUAL
      for (let j = 0; j < text.length; j++) {
        result.push({
          kind: "equal",
          sentence: charToSentence[text.charCodeAt(j)],
        });
      }
      i++;
    } else if (op === -1 && i + 1 < diffs.length && diffs[i + 1][0] === 1) {
      // -1 = DELETE followed by 1 = INSERT -> Collapse to modified + potential leftovers
      const deleteText = text;
      const insertText = diffs[i + 1][1];

      const deleteLen = deleteText.length;
      const insertLen = insertText.length;
      const minLen = Math.min(deleteLen, insertLen);

      for (let j = 0; j < minLen; j++) {
        result.push({
          kind: "modified",
          before: charToSentence[deleteText.charCodeAt(j)],
          after: charToSentence[insertText.charCodeAt(j)],
        });
      }

      for (let j = minLen; j < deleteLen; j++) {
        result.push({
          kind: "removed",
          sentence: charToSentence[deleteText.charCodeAt(j)],
        });
      }

      for (let j = minLen; j < insertLen; j++) {
        result.push({
          kind: "added",
          sentence: charToSentence[insertText.charCodeAt(j)],
        });
      }

      i += 2;
    } else if (op === -1) {
      // Lone DELETE -> removed
      for (let j = 0; j < text.length; j++) {
        result.push({
          kind: "removed",
          sentence: charToSentence[text.charCodeAt(j)],
        });
      }
      i++;
    } else if (op === 1) {
      // Lone INSERT -> added
      for (let j = 0; j < text.length; j++) {
        result.push({
          kind: "added",
          sentence: charToSentence[text.charCodeAt(j)],
        });
      }
      i++;
    }
  }

  return result;
}

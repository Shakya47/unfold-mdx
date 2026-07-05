import { describe, it, expect } from "vitest";
import { createShikiHighlighter } from "../../src/shiki/index.js";
import { CodeToken, CodeLineDiff } from "../../src/diff/codeDiff.js";

describe("Shiki Highlighter Adapter", () => {
  it("should merge syntax color onto single equal diff token", () => {
    // We can test the internal merge logic indirectly via the public highlight method,
    // but Shiki is async, so we wait for it to be ready.
    const highlighter = createShikiHighlighter();
    
    return new Promise<void>((resolve) => {
      const unsub = highlighter.subscribe(() => {
        if (highlighter.getSnapshot() > 0) {
          const code = "const x = 1;";
          const diffLines: CodeLineDiff[] = [
            { kind: "equal", line: "const x = 1;" }
          ];
          
          const result = highlighter.highlight(code, "js", diffLines);
          expect(result).toBeDefined();
          expect(result![0].tokens).toBeDefined();
          
          // Shiki splits "const x = 1;" into several color tokens
          const tokens = result![0].tokens!;
          expect(tokens.length).toBeGreaterThan(1);
          
          // The diff kind should be "equal" across all mapped tokens
          for (const t of tokens) {
            expect(t.kind).toBe("equal");
          }
          
          unsub();
          resolve();
        }
      });
    });
  });

  it("should merge syntax color across diff boundary", () => {
    const highlighter = createShikiHighlighter();
    
    return new Promise<void>((resolve) => {
      const unsub = highlighter.subscribe(() => {
        if (highlighter.getSnapshot() > 0) {
          const code = "console.log(123);";
          
          // Let's pretend "123" was added, everything else is equal.
          // Syntax tokenizer might treat "123" as a single token, or part of something else.
          const diffLines: CodeLineDiff[] = [
            { 
              kind: "changed", 
              tokens: [
                { kind: "equal", text: "console.log(" },
                { kind: "added", text: "123" },
                { kind: "equal", text: ");" }
              ] 
            }
          ];
          
          const result = highlighter.highlight(code, "js", diffLines);
          expect(result).toBeDefined();
          
          const tokens = result![0].tokens!;
          
          // Should have some tokens that are equal and some that are added
          const addedTokens = tokens.filter(t => t.kind === "added");
          expect(addedTokens.length).toBeGreaterThan(0);
          expect(addedTokens.map(t => t.text).join("")).toBe("123");
          
          // Check that colors are applied to both added and equal tokens
          expect(addedTokens[0].color).toBeDefined();
          
          unsub();
          resolve();
        }
      });
    });
  });
});

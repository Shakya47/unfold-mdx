import { describe, it, expect } from "vitest";
import { codeDiff } from "../../src/diff/codeDiff.js";

describe("codeDiff", () => {
  it("handles identical snapshots", () => {
    const code = "const a = 1;";
    const diff = codeDiff(code, code);
    expect(diff).toEqual([
      { kind: "equal", line: "const a = 1;" }
    ]);
  });

  it("handles empty prev bootstrap", () => {
    const next = "const a = 1;";
    const diff = codeDiff("", next);
    expect(diff).toEqual([
      {
        kind: "added",
        tokens: [
          { kind: "added", text: "const" },
          { kind: "added", text: " " },
          { kind: "added", text: "a" },
          { kind: "added", text: " " },
          { kind: "added", text: "=" },
          { kind: "added", text: " " },
          { kind: "added", text: "1" },
          { kind: "added", text: ";" },
        ],
      }
    ]);
  });

  it("handles line append", () => {
    const prev = "const a = 1;";
    const next = "const a = 1;\nconst b = 2;";
    const diff = codeDiff(prev, next);
    expect(diff).toEqual([
      { kind: "equal", line: "const a = 1;" },
      {
        kind: "added",
        tokens: [
          { kind: "added", text: "const" },
          { kind: "added", text: " " },
          { kind: "added", text: "b" },
          { kind: "added", text: " " },
          { kind: "added", text: "=" },
          { kind: "added", text: " " },
          { kind: "added", text: "2" },
          { kind: "added", text: ";" },
        ],
      }
    ]);
  });

  it("handles in-place token change", () => {
    const prev = "const x = 1;";
    const next = "const y = 1;";
    const diff = codeDiff(prev, next);
    expect(diff).toEqual([
      {
        kind: "changed",
        tokens: [
          { kind: "equal", text: "const" },
          { kind: "equal", text: " " },
          { kind: "added", text: "y" },
          { kind: "equal", text: " " },
          { kind: "equal", text: "=" },
          { kind: "equal", text: " " },
          { kind: "equal", text: "1" },
          { kind: "equal", text: ";" },
        ],
      }
    ]);
  });
});

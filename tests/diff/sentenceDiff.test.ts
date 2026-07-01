import { describe, it, expect } from "vitest";
import { tokenize, sentenceDiff } from "../../src/diff/index.js";

describe("tokenize", () => {
  it("should return an empty array for empty or whitespace-only input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ")).toEqual([]);
    expect(tokenize("\n\n\r  ")).toEqual([]);
  });

  it("should split on terminal punctuation followed by whitespace or end-of-string", () => {
    const text = "Nuclear fission splits a heavy atom. This releases energy! Does it work?";
    expect(tokenize(text)).toEqual([
      "Nuclear fission splits a heavy atom.",
      "This releases energy!",
      "Does it work?",
    ]);
  });

  it("should preserve multiple punctuation marks at the end of sentences", () => {
    const text = "What?! Yes!! Really.";
    expect(tokenize(text)).toEqual(["What?!", "Yes!!", "Really."]);
  });

  it("should trim tokens and ignore empty tokens", () => {
    const text = "   Hello world.    This is a test.   ";
    expect(tokenize(text)).toEqual([
      "Hello world.",
      "This is a test.",
    ]);
  });

  it("should handle ellipsis as non-splitting", () => {
    const text = "Wait... What?";
    expect(tokenize(text)).toEqual(["Wait... What?"]);

    const textWithSpaces = "Sentence one... Sentence two.";
    expect(tokenize(textWithSpaces)).toEqual(["Sentence one... Sentence two."]);
  });

  it("should handle decimals without splitting", () => {
    const text = "The value is 3.14. It is pi.";
    expect(tokenize(text)).toEqual([
      "The value is 3.14.",
      "It is pi.",
    ]);
  });

  it("should split on newlines if they follow terminal punctuation", () => {
    const text = "First sentence.\nSecond sentence.\n\nThird sentence.";
    expect(tokenize(text)).toEqual([
      "First sentence.",
      "Second sentence.",
      "Third sentence.",
    ]);
  });

  it("should handle sentences without terminal punctuation at the end of the text", () => {
    const text = "No punctuation here";
    expect(tokenize(text)).toEqual(["No punctuation here"]);
  });

  it("should handle mixed punctuation and newlines", () => {
    const text = "Sentence one!\n\nSentence two? Yes.";
    expect(tokenize(text)).toEqual([
      "Sentence one!",
      "Sentence two?",
      "Yes.",
    ]);
  });
});

describe("sentenceDiff", () => {
  it("should return empty array for both empty inputs", () => {
    expect(sentenceDiff("", "")).toEqual([]);
  });

  it("should bootstrap empty string to first level (all added)", () => {
    const next = "Nuclear fission splits a heavy atom. This releases energy.";
    expect(sentenceDiff("", next)).toEqual([
      { kind: "added", sentence: "Nuclear fission splits a heavy atom." },
      { kind: "added", sentence: "This releases energy." },
    ]);
  });

  it("should handle pure appends correctly", () => {
    const prev = "Nuclear fission splits a heavy atom.";
    const next = "Nuclear fission splits a heavy atom. This releases energy.";
    expect(sentenceDiff(prev, next)).toEqual([
      { kind: "equal", sentence: "Nuclear fission splits a heavy atom." },
      { kind: "added", sentence: "This releases energy." },
    ]);
  });

  it("should handle identical strings as equal", () => {
    const text = "Nuclear fission splits a heavy atom.";
    expect(sentenceDiff(text, text)).toEqual([
      { kind: "equal", sentence: "Nuclear fission splits a heavy atom." },
    ]);
  });

  it("should handle in-place modification of a sentence", () => {
    const prev = "Sentence one. Sentence two. Sentence three.";
    const next = "Sentence one. Sentence modified. Sentence three.";
    expect(sentenceDiff(prev, next)).toEqual([
      { kind: "equal", sentence: "Sentence one." },
      { kind: "modified", before: "Sentence two.", after: "Sentence modified." },
      { kind: "equal", sentence: "Sentence three." },
    ]);
  });

  it("should collapse adjacent deletion and insertion pairs into modified", () => {
    const prev = "This is a sentence. We are deleting this.";
    const next = "This is a sentence. We are inserting that.";
    expect(sentenceDiff(prev, next)).toEqual([
      { kind: "equal", sentence: "This is a sentence." },
      { kind: "modified", before: "We are deleting this.", after: "We are inserting that." },
    ]);
  });

  it("should handle deletion followed by multiple insertions", () => {
    const prev = "This is a sentence. Deleting this.";
    const next = "This is a sentence. Replacing with first. Replacing with second.";
    expect(sentenceDiff(prev, next)).toEqual([
      { kind: "equal", sentence: "This is a sentence." },
      { kind: "modified", before: "Deleting this.", after: "Replacing with first." },
      { kind: "added", sentence: "Replacing with second." },
    ]);
  });

  it("should handle multiple deletions followed by single insertion", () => {
    const prev = "This is a sentence. Deleting first. Deleting second.";
    const next = "This is a sentence. Replacing with this single.";
    expect(sentenceDiff(prev, next)).toEqual([
      { kind: "equal", sentence: "This is a sentence." },
      { kind: "modified", before: "Deleting first.", after: "Replacing with this single." },
      { kind: "removed", sentence: "Deleting second." },
    ]);
  });

  it("should preserve removed sentences in the output", () => {
    const prev = "First. Second. Third.";
    const next = "First. Third.";
    expect(sentenceDiff(prev, next)).toEqual([
      { kind: "equal", sentence: "First." },
      { kind: "removed", sentence: "Second." },
      { kind: "equal", sentence: "Third." },
    ]);
  });

  it("should handle multi-paragraph input correctly", () => {
    const prev = "Paragraph one. Still paragraph one.\n\nParagraph two.";
    const next = "Paragraph one. Still paragraph one.\n\nParagraph two. Added sentence.";
    expect(sentenceDiff(prev, next)).toEqual([
      { kind: "equal", sentence: "Paragraph one." },
      { kind: "equal", sentence: "Still paragraph one." },
      { kind: "equal", sentence: "Paragraph two." },
      { kind: "added", sentence: "Added sentence." },
    ]);
  });
});

/**
 * Splits a prose string into an ordered array of sentence strings.
 * 
 * Rules:
 * - Split on '.', '!', '?' followed by whitespace or end-of-string.
 * - Treat ellipsis ('...') as non-splitting.
 * - Trim leading/trailing whitespace from each token; discard empty tokens.
 * - Pure function — no side effects.
 */
export function tokenize(text: string): string[] {
  if (!text) {
    return [];
  }

  // Split on '.', '!', '?' followed by whitespace or end-of-string.
  // We use a lookbehind assertion to ensure the split occurs right after:
  // - A single dot (not preceded by a dot and not followed by a dot)
  // - An exclamation or question mark
  // And a lookahead assertion that it is followed by whitespace or the end of the string.
  const splitRegex = /(?<=(?:(?<!\.)\.(?!\.)|[!?]))(?=\s|$)/;

  return text
    .split(splitRegex)
    .map(token => token.trim())
    .filter(token => token.length > 0);
}

export function tokenizeLines(code: string): string[] {
  if (code === "") return [];
  return code.split(/\r?\n/);
}

export function tokenizeCodeLine(line: string): string[] {
  if (line === "") return [];
  const regex = /([a-zA-Z0-9_]+|\s+|[^a-zA-Z0-9_\s])/g;
  const tokens: string[] = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match[0].length > 0) {
      tokens.push(match[0]);
    }
  }
  return tokens;
}

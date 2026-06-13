// Small, dependency-free helpers to inspect a note's raw text in assertions.
// We read the RAW file (obsidianPage.read) so we can check on-disk specifics
// like quoting that a parsed metadataCache view would hide.

/** The text between the opening and closing `---` fences (without fences). */
export function getFrontmatterBlock(raw: string): string {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  return m ? (m[1] ?? '') : '';
}

/** Everything after the closing `---` fence (the note body). */
export function getBody(raw: string): string {
  const m = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return m ? (m[1] ?? raw) : raw;
}

/** Trimmed value of a top-level scalar key in the frontmatter, or undefined. */
export function fmValue(raw: string, key: string): string | undefined {
  const line = getFrontmatterBlock(raw)
    .split('\n')
    .find((l) => l.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : undefined;
}

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

/**
 * Trimmed raw value of a nested scalar key (`['meta', 'updated']`), read by
 * indentation from block-style YAML as Obsidian writes it, or undefined.
 */
export function fmPathValue(
  raw: string,
  segments: string[],
): string | undefined {
  let lines = getFrontmatterBlock(raw).split('\n');
  let indent = '';
  for (let i = 0; i < segments.length; i++) {
    const key = segments[i]!;
    const at = lines.findIndex((l) => l.startsWith(`${indent}${key}:`));
    if (at < 0) return undefined;
    if (i === segments.length - 1) {
      return lines[at]!.slice(indent.length + key.length + 1).trim();
    }
    const block: string[] = [];
    for (const l of lines.slice(at + 1)) {
      if (!l.startsWith(`${indent} `)) break;
      block.push(l);
    }
    lines = block;
    indent = block[0]?.match(/^ */)?.[0] ?? `${indent}  `;
  }
  return undefined;
}

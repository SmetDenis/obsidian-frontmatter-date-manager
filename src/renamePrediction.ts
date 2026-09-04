// Pure helpers for the experimental "skip the date after a rename" feature.
//
// The feature predicts the exact bytes Obsidian writes when it rewrites the
// `[[wikilinks]]` that pointed at a note the user just renamed, then compares
// the prediction with the file on disk byte for byte. A match means the only
// difference is the rewrite, so the plugin refreshes its content hash and the
// scheduled pass finds nothing to stamp.
//
// The whole design rests on one property: **a wrong prediction costs coverage,
// never data.** Anything unexpected here returns null / false, the byte
// comparison then fails, and the file is stamped exactly as it is today.
//
// No Obsidian runtime import - everything below is unit-testable without the
// mock. The two calls that genuinely need the vault (`fileToLinktext`, which
// decides shortest-vs-relative-vs-absolute link form, and `parseLinktext`) stay
// in main.ts and their results are passed in.

// One link/embed reference as snapshotted from metadataCache BEFORE Obsidian
// rewrote it. Offsets are into the UNTRIMMED file text (that is what the
// metadata cache records).
export interface RefSnapshot {
  /** The verbatim source text of the reference, e.g. `[[Folder/Old|Old]]`. */
  original: string;
  /** The link target as Obsidian parsed it, e.g. `Folder/Old#Heading`. */
  link: string;
  start: number;
  end: number;
}

/** One span replacement to splice into the snapshot content. */
export interface Replacement {
  start: number;
  end: number;
  text: string;
}

// Obsidian's own wikilink grammar (matches both links and embeds).
// Groups: 1 = `[[` or `![[`, 2 = link part, 4 = alias (without the pipe),
// 5 = `]]`.
const WIKILINK_RE = /^(!?\[\[)(.*?)(\|(.*))?(]])$/;

export interface ParsedWikilink {
  open: string;
  linkPart: string;
  alias: string | null;
  close: string;
}

/** Split a wikilink into its parts, or null when it is not a wikilink. */
export function parseWikilink(original: string): ParsedWikilink | null {
  const m = WIKILINK_RE.exec(original);
  if (!m) return null;
  const open = m[1];
  const linkPart = m[2];
  const close = m[5];
  if (open === undefined || linkPart === undefined || close === undefined) {
    return null;
  }
  return { open, linkPart, alias: m[4] ?? null, close };
}

/** The segment after the last `/` - Obsidian's own notion of a link basename. */
export function linkBasename(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? path : path.slice(i + 1);
}

// Pure stand-in for the path half of Obsidian's `parseLinktext`: the subpath
// starts at the first `#` that is not the very first character (a `[[#Heading]]`
// link has an empty path, not an empty subpath).
export function linktextPath(linktext: string): string {
  const i = linktext.indexOf('#');
  return i > 0 ? linktext.slice(0, i) : i === 0 ? '' : linktext;
}

/**
 * Is this reference one v1 can predict?
 *
 * Wikilinks and wiki-embeds only, no escaped pipe (`\|` - the alias grammar
 * differs there and embed dimensions reuse the same pipe), and the recorded
 * span must still hold exactly this text (a stale metadata cache otherwise
 * makes every offset below meaningless).
 *
 * Everything else - Markdown links, frontmatter links, embeds with dimensions -
 * is deliberately out of scope; see docs/plans/experimental-rename-link-suppression.md.
 */
export function isPredictable(ref: RefSnapshot, content: string): boolean {
  if (ref.original.includes('\\|')) return false;
  if (parseWikilink(ref.original) === null) return false;
  return content.slice(ref.start, ref.end) === ref.original;
}

/**
 * Rewrite one wikilink the way Obsidian's own link updater does.
 *
 * The visible alias is rewritten ONLY when the OLD link carried a path
 * component AND the alias equalled that path's basename - i.e. when the alias
 * was Obsidian's own auto-generated "show just the file name" text. A
 * hand-written alias is always preserved. This keys on the OLD link text, which
 * is why the reference has to be snapshotted before the rewrite.
 *
 * Returns null when `original` is not a wikilink.
 */
export function rewriteWikilink(
  original: string,
  newLinktext: string,
): string | null {
  const parsed = parseWikilink(original);
  if (parsed === null) return null;
  const { open, linkPart, alias, close } = parsed;

  if (alias === null) return open + newLinktext + close;

  const pipe = original.includes('\\|') ? '\\|' : '|';
  const autoAlias =
    linkPart.includes('/') && linkBasename(linkPart) === alias.trim();
  const outAlias = autoAlias ? linkBasename(linktextPath(newLinktext)) : alias;

  return open + newLinktext + pipe + outAlias + close;
}

/**
 * Does this link target resolve to the file that was just renamed?
 *
 * A deliberately conservative reimplementation of link resolution: the renamed
 * file has already moved by the time the plugin sees the rename event, so
 * Obsidian's own resolver can no longer answer this. Being wrong in EITHER
 * direction only breaks the byte comparison later, which means the file is
 * stamped as it is today - so this trades coverage, never safety.
 *
 * Covered: the absolute vault path (`Folder/Old`), the shortest form (`Old`),
 * and any folder-aligned suffix of the old path (`Folder/Old` for
 * `Vault/Folder/Old.md`), each with an optional `.md` and Obsidian's
 * case-insensitive matching. Not covered: relative forms (`../Old`), which
 * simply keep their file on today's behaviour.
 */
export function linkpathTargetsPath(
  linkpath: string,
  oldPath: string,
): boolean {
  const norm = (s: string): string => {
    let out = s.trim().replace(/^\.\//, '');
    if (out.toLowerCase().endsWith('.md')) out = out.slice(0, -3);
    return out.toLowerCase();
  };
  const link = norm(linkpath);
  if (link === '' || link.includes('..')) return false;
  const target = norm(oldPath);
  if (link === target) return true;
  if (link === linkBasename(target)) return true;
  return target.endsWith(`/${link}`);
}

/**
 * Splice replacements into `content`, applying them in descending offset order
 * so earlier offsets stay valid.
 *
 * Returns null - meaning "suppress nothing" - on any span that is out of
 * range, inverted, or overlapping another. Overlapping spans mean the metadata
 * cache disagrees with the file, so no prediction built from it can be trusted.
 */
export function predictContent(
  content: string,
  replacements: Replacement[],
): string | null {
  const sorted = [...replacements].sort((a, b) => a.start - b.start);
  let prevEnd = -1;
  for (const r of sorted) {
    if (
      !Number.isInteger(r.start) ||
      !Number.isInteger(r.end) ||
      r.start < 0 ||
      r.end > content.length ||
      r.start > r.end ||
      r.start < prevEnd
    ) {
      return null;
    }
    prevEnd = r.end;
  }

  let out = content;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const r = sorted[i]!;
    out = out.slice(0, r.start) + r.text + out.slice(r.end);
  }
  return out;
}

/**
 * Do any of these snapshotted references overlap each other?
 *
 * `links` and `embeds` are separate arrays whose concatenation is not in
 * document order, so they are sorted first. An overlap means the snapshot is
 * inconsistent and the whole file must be left alone.
 */
export function hasOverlappingRefs(refs: RefSnapshot[]): boolean {
  const sorted = [...refs].sort((a, b) => a.start - b.start);
  let prevEnd = -1;
  for (const r of sorted) {
    if (r.start < prevEnd) return true;
    prevEnd = r.end;
  }
  return false;
}

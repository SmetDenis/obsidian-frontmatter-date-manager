import { TAbstractFile, TFile } from 'obsidian';
import { isMatch } from 'picomatch/posix';

declare global {
  var __DEV_MODE__: boolean;
}
export function onlyUniqueArray<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index;
}

export function isTFile(value: TAbstractFile): value is TFile {
  return 'stat' in value;
}

export function isGlobPattern(pattern: string): boolean {
  return /[*?[{]/.test(pattern);
}

/**
 * Numbers reach our date code in two different units. Filesystem timestamps
 * (`file.stat.ctime`/`mtime`) and `T`-format frontmatter are milliseconds,
 * while `t`-format frontmatter is Unix seconds. `new Date(n)` always assumes
 * milliseconds, so a seconds value (~1.7e9) would resolve to ~1970. Values
 * below this threshold are too small to be a plausible modern millisecond
 * timestamp, so they are treated as seconds. 1e11 ms = 1973; 1e11 s = year
 * 5138 — the only misread values are millisecond timestamps before 1973.
 */
export const EPOCH_SECONDS_THRESHOLD = 1e11;

/**
 * Convert a numeric epoch value to a Date, auto-detecting seconds vs.
 * milliseconds by magnitude. Returns an invalid Date for NaN/Infinity inputs
 * (callers check `isNaN(date.getTime())`).
 */
export function epochNumberToDate(input: number): Date {
  const ms = input < EPOCH_SECONDS_THRESHOLD ? input * 1000 : input;
  return new Date(ms);
}

export function matchesPathPattern(filePath: string, pattern: string): boolean {
  const trimmed = pattern.trim();
  if (trimmed.length === 0) return false;

  if (isGlobPattern(trimmed)) {
    return isMatch(filePath, trimmed);
  }

  // Exact file match (e.g. "inbox/scratch.md", "README.md")
  if (filePath === trimmed) return true;

  // Folder prefix match (e.g. "templates" or "templates/")
  const normalized = trimmed.endsWith('/') ? trimmed : trimmed + '/';
  return filePath.startsWith(normalized);
}

/**
 * Extract a human-readable message from a caught value. Errors expose `.message`;
 * anything else is stringified. Used wherever a failure reason is surfaced to the
 * user (bulk execute failures, the single-file update command) instead of being
 * lost to a dev-only `logError`.
 */
export function errorToMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function getMomentFormatHint(formatStr: string): string | undefined {
  const replacements: [RegExp, string][] = [
    [/YYYY/, 'Use "yyyy" instead of "YYYY" for year'],
    [/(?<!Y)YY(?!Y)/, 'Use "yy" instead of "YY" for 2-digit year'],
    [/(?<!D)DD(?!D)/, 'Use "dd" instead of "DD" for day of month'],
    [/(?<!D)D(?!D)/, 'Use "d" instead of "D" for day of month'],
  ];
  const hints = replacements
    .filter(([re]) => re.test(formatStr))
    .map(([, msg]) => msg);
  return hints.length > 0 ? hints.join('. ') + '.' : undefined;
}

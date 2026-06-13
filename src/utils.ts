import { TAbstractFile, TFile } from 'obsidian';
import { isMatch } from 'picomatch/posix';
import { parse, parseISO } from 'date-fns';
import { tz } from '@date-fns/tz';

declare global {
  var __DEV_MODE__: boolean;
}
export function onlyUniqueArray<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index;
}

/**
 * Split a comma-separated property-name input into clean keys to add. Trims each
 * segment, drops empty ones, and removes duplicates both within the input and
 * against the already-present list. Returns only the NEW keys (exact-match
 * dedup, matching how the exclusion list is compared elsewhere).
 */
export function parsePropertyKeys(input: string, existing: string[]): string[] {
  const seen = new Set(existing);
  const result: string[] = [];
  for (const segment of input.split(',')) {
    const key = segment.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
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
 * 5138 - the only misread values are millisecond timestamps before 1973.
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

/**
 * Date formats tried when auto-detecting a stored date string (the Reformat
 * tool). Order matters - more specific formats first to avoid ambiguous matches.
 * ISO 8601 is handled separately via `parseISO` before these are tried.
 */
export const COMMON_DATE_FORMATS = [
  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  "yyyy-MM-dd'T'HH:mm:ssxxx",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm",
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd HH:mm',
  'yyyy-MM-dd',
  'yyyy/MM/dd HH:mm:ss',
  'yyyy/MM/dd HH:mm',
  'yyyy/MM/dd',
  'dd.MM.yyyy HH:mm:ss',
  'dd.MM.yyyy HH:mm',
  'dd.MM.yyyy',
  'dd/MM/yyyy HH:mm:ss',
  'dd/MM/yyyy HH:mm',
  'dd/MM/yyyy',
  'MM/dd/yyyy HH:mm:ss',
  'MM/dd/yyyy HH:mm',
  'MM/dd/yyyy',
  'yyyyMMdd',
];

/**
 * Auto-detect and parse a stored date value into a `Date`, anchoring every
 * textual strategy to ONE timezone reference frame.
 *
 * This parser is the inverse of `formatDate`, which always formats with
 * `{ in: tz(timezone) }` when a timezone is configured. A timezone-blind parse
 * branch resolves a naive wall-clock value against the host zone instead, so the
 * value shifts on reformat and values already in the target format get rewritten
 * (a needless write that churns notes and fights sync). To make that class of
 * bug structurally impossible, `tzOptions` is built ONCE here and threaded
 * through BOTH deterministic strategies (`parseISO` and the format loop), so no
 * branch can drift to a different frame. Empty timezone -> `{}` -> host zone,
 * identical to formatting with no timezone (so the default config is unchanged).
 *
 * Strategy order:
 *  1. Numbers / numeric strings -> epoch (absolute instant, timezone-
 *     independent; never re-anchored, so `t`/`T` epoch vaults are unaffected).
 *  2. `parseISO(str, tzOptions)` - ISO 8601 incl. partials and the plugin's own
 *     default format. An explicit offset in the string still wins; the `in`
 *     option only supplies the zone for offset-less values.
 *  3. The common date-fns format loop with the SAME `tzOptions`.
 *  4. Last-resort `new Date(str)` for locale/RFC strings the above reject. Left
 *     timezone-blind on purpose: such strings are ambiguous (a naive wall clock
 *     cannot be told apart from an absolute instant), and re-anchoring would
 *     discard an explicit zone (e.g. a trailing `GMT`) - a guess-and-overwrite.
 *     Returning the absolute instant matches the previous behavior exactly.
 */
export function parseDateValueWithZone(
  value: string | number,
  timezone: string | undefined,
): Date | undefined {
  if (typeof value === 'number') {
    const date = epochNumberToDate(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  const str = String(value).trim();
  if (!str) return undefined;

  // Numeric string -> epoch timestamp (but not 8-digit yyyyMMdd-style strings).
  if (/^\d+$/.test(str) && str.length !== 8) {
    const date = epochNumberToDate(parseInt(str));
    return isNaN(date.getTime()) ? undefined : date;
  }

  // One reference frame for every textual strategy below, matching formatDate.
  const tzOptions = timezone ? { in: tz(timezone) } : {};

  // ISO 8601 (also matches the plugin's own default format, space-separated,
  // and partial dates). An explicit offset in the string still wins.
  try {
    const iso = parseISO(str, tzOptions);
    if (!isNaN(iso.getTime())) return iso;
  } catch {
    // continue to next strategy
  }

  // Common date-fns formats - the SAME tzOptions, so no branch drifts.
  for (const fmt of COMMON_DATE_FORMATS) {
    try {
      const parsed = parse(str, fmt, new Date(), tzOptions);
      if (!isNaN(parsed.getTime())) return parsed;
    } catch {
      // continue to next format
    }
  }

  // Last resort: native Date parser (timezone-blind by design; see above).
  try {
    const native = new Date(str);
    if (!isNaN(native.getTime())) return native;
  } catch {
    // give up
  }

  return undefined;
}

/**
 * Day-first format strings for the two-field `D/D/yyyy` (and `D.D.yyyy`) shapes
 * that are genuinely ambiguous. Longest-first so a time component is captured
 * when present. The dot variants matter because `MM.dd.yyyy` is NOT in
 * `COMMON_DATE_FORMATS` (dots there only ever parse day-first), so this is the
 * only place a dot date's month-first reading is even attempted.
 */
const AMBIGUOUS_DMY_FORMATS = [
  'dd/MM/yyyy HH:mm:ss',
  'dd/MM/yyyy HH:mm',
  'dd/MM/yyyy',
  'dd.MM.yyyy HH:mm:ss',
  'dd.MM.yyyy HH:mm',
  'dd.MM.yyyy',
];
const AMBIGUOUS_MDY_FORMATS = [
  'MM/dd/yyyy HH:mm:ss',
  'MM/dd/yyyy HH:mm',
  'MM/dd/yyyy',
  'MM.dd.yyyy HH:mm:ss',
  'MM.dd.yyyy HH:mm',
  'MM.dd.yyyy',
];

/** Result of probing a stored date string for day-vs-month ambiguity. */
export interface SlashDateReadings {
  /** True only when BOTH readings parse AND yield different calendar dates. */
  ambiguous: boolean;
  /** Day-first interpretation (e.g. `01/05` -> May 1), present when ambiguous. */
  dmyDate?: Date;
  /** Month-first interpretation (e.g. `01/05` -> Jan 5), present when ambiguous. */
  mdyDate?: Date;
}

/**
 * Detect whether a stored date string is a genuinely ambiguous slash/dot date -
 * one where both day-first and month-first readings are valid AND differ (e.g.
 * `01/05/2024`). Returns BOTH candidate `Date`s so the caller can resolve by an
 * explicit order (or skip) without re-parsing.
 *
 * Why this exists: `parseDateValueWithZone` resolves such values by format-list
 * order (day-first wins arbitrarily), silently turning an American's
 * `01/05/2024` (= Jan 5) into May 1 on reformat. This function lets the Reformat
 * preview flag those values and let the user choose, honoring "never
 * guess-and-overwrite a value you can't safely parse".
 *
 * NOT ambiguous (so the normal `parseDateValueWithZone` path handles them): a
 * value where only one reading is valid (e.g. `25/12` - day > 12 rejects the
 * month-first reading), both readings equal (`05/05`), year-first (`2024/01/15`),
 * ISO, compact `yyyyMMdd`, numbers, or anything unparseable. Anchored to the
 * SAME timezone reference frame as `parseDateValueWithZone` so the two strategies
 * never drift.
 */
export function detectSlashDateReadings(
  value: string | number,
  timezone: string | undefined,
): SlashDateReadings {
  if (typeof value !== 'string') return { ambiguous: false };
  const str = value.trim();
  // Only `D/D/yyyy` or `D.D.yyyy` (1-2 digit day/month, 4-digit year), with an
  // optional time tail. Year-first, ISO, and `yyyyMMdd` are excluded by shape.
  if (!/^\d{1,2}[/.]\d{1,2}[/.]\d{4}([ T].*)?$/.test(str)) {
    return { ambiguous: false };
  }

  const tzOptions = timezone ? { in: tz(timezone) } : {};
  // One shared reference for both parses, for determinism and clarity (the two
  // readings are compared by instant below).
  const reference = new Date();
  const firstValid = (formats: string[]): Date | undefined => {
    for (const fmt of formats) {
      try {
        const parsed = parse(str, fmt, reference, tzOptions);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch {
        // `parse` can throw on throwing format tokens; ours are throw-free, but
        // guard anyway to match `parseDateValueWithZone` and stay scan-safe.
      }
    }
    return undefined;
  };

  const dmyDate = firstValid(AMBIGUOUS_DMY_FORMATS);
  const mdyDate = firstValid(AMBIGUOUS_MDY_FORMATS);
  if (!dmyDate || !mdyDate) return { ambiguous: false };
  if (dmyDate.getTime() === mdyDate.getTime()) return { ambiguous: false };
  return { ambiguous: true, dmyDate, mdyDate };
}

/**
 * Resolve a day/month order from a BCP-47 locale, used only to PRE-SELECT the
 * Reformat day/month control - never to silently overwrite. Returns `undefined`
 * (no confident signal) when the locale carries no region subtag, because a
 * region-less language like `en` cannot tell US month-first from UK day-first.
 * The OS locale is region-aware inside Obsidian (verified: `Intl` returns
 * `en-US`/`en-GB`), so this is the trustworthy source.
 */
export function detectSlashOrderFromLocale(
  locale: string | undefined,
): 'dmy' | 'mdy' | undefined {
  if (!locale) return undefined;
  let region: string | undefined;
  try {
    region = new Intl.Locale(locale).region ?? undefined;
  } catch {
    return undefined;
  }
  if (!region) return undefined;

  try {
    const parts = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'numeric',
    }).formatToParts(new Date(Date.UTC(2024, 0, 31)));
    for (const part of parts) {
      if (part.type === 'day') return 'dmy';
      if (part.type === 'month') return 'mdy';
    }
  } catch {
    return undefined;
  }
  return undefined;
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

/**
 * Parse the "Maximum cache entries" text input into a valid setting value.
 *
 * `0` is a meaningful value here - it means "no limit" (the engine treats
 * `maxSize <= 0` as unlimited). The naive `parseInt(value) || 10_000` idiom
 * breaks this: `parseInt('0')` is `0`, which is falsy, so `0 || 10_000` yields
 * `10_000` and the documented "0 = no limit" is unreachable from the UI. To
 * tell a meaningful `0` apart from empty/garbage input we must check for a
 * finite parse explicitly rather than rely on truthiness. A negative value is
 * clamped to `0` (unlimited), matching the engine's `maxSize <= 0` branch; an
 * unparseable value falls back to the default so clearing the field cannot
 * silently disable the limit. Mirrors the `inversionToleranceSec` handler.
 */
export function parseCacheMaxSize(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 10_000;
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

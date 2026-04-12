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

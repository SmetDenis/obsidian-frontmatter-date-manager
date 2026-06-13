import { makeRe } from 'picomatch/posix';
import { matchesPathPattern, isGlobPattern } from './utils';

export interface FilterRule {
  pattern: string;
  negate: boolean;
  lineNumber: number;
}

export interface ParseResult {
  rules: FilterRule[];
  errors: { lineNumber: number; text: string; message: string }[];
}

export function validatePattern(pattern: string): string | null {
  const trimmed = pattern.trim();
  if (trimmed.length === 0) return 'Empty pattern';

  if (!isGlobPattern(trimmed)) {
    return null;
  }

  try {
    makeRe(trimmed);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid glob pattern';
  }
}

export function parseFilterRules(text: string): ParseResult {
  const rules: FilterRule[] = [];
  const errors: ParseResult['errors'] = [];

  if (!text || text.trim().length === 0) {
    return { rules, errors };
  }

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const trimmed = raw.trim();

    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    let negate = false;
    let pattern = trimmed;

    if (trimmed.startsWith('!')) {
      negate = true;
      pattern = trimmed.slice(1).trim();
      if (pattern.length === 0) {
        errors.push({
          lineNumber: i + 1,
          text: raw,
          message: 'Empty pattern after "!"',
        });
        continue;
      }
    }

    const error = validatePattern(pattern);
    if (error) {
      errors.push({ lineNumber: i + 1, text: raw, message: error });
      continue;
    }

    rules.push({ pattern, negate, lineNumber: i + 1 });
  }

  return { rules, errors };
}

// Last matching rule wins (gitignore semantics). The loop intentionally does NOT
// short-circuit - this enables allowlist mode: `**` (exclude all) then `!projects/`
// (re-include). Do not optimize with an early break.
export function isFileExcluded(filePath: string, rules: FilterRule[]): boolean {
  let excluded = false;

  for (const rule of rules) {
    if (matchesPathPattern(filePath, rule.pattern)) {
      excluded = !rule.negate;
    }
  }

  return excluded;
}

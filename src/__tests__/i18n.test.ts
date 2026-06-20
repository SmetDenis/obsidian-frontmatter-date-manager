import { describe, it, expect } from 'vitest';
import { STRINGS_EN } from '../i18n/locales/en';
import { mergeTranslationValues, strings, LANGUAGE_MAP } from '../i18n';

describe('STRINGS_EN', () => {
  it('exposes the expected top-level groups', () => {
    expect(Object.keys(STRINGS_EN).sort()).toEqual(
      [
        'bulkChrome',
        'commands',
        'common',
        'modals',
        'notices',
        'settings',
        'statusBar',
      ].sort(),
    );
  });
  it('keeps a known value verbatim', () => {
    expect(STRINGS_EN.common.run).toBe('Run');
  });
});

describe('mergeTranslationValues', () => {
  it('overrides only provided keys, falls back to base for the rest', () => {
    const base = { a: 'A', nested: { x: 'X', y: 'Y' } };
    const merged = mergeTranslationValues(base, { nested: { x: 'XX' } });
    expect(merged).toEqual({ a: 'A', nested: { x: 'XX', y: 'Y' } });
  });
  it('keeps base when override is undefined', () => {
    expect(mergeTranslationValues('A', undefined)).toBe('A');
  });
  it('ignores a type-mismatched override (string vs object)', () => {
    const base = { x: 'X' };
    expect(mergeTranslationValues(base, 'oops')).toEqual({ x: 'X' });
  });
});

describe('strings', () => {
  it('resolves to English under the mock locale', () => {
    expect(strings.common.run).toBe('Run');
  });
});

describe('locale resolution over real data', () => {
  // Exercises the deep-merge with a REAL locale object (not the toy fixture
  // above): a translated leaf must win, and a leaf the locale omits must fall
  // back to the English value - never undefined or blank. This guards the
  // per-key fallback contract that 20/21 languages rely on at runtime (the
  // module-load resolver itself only ever runs the 'en' short-circuit under the
  // test mock, so without this the non-English merge path is untested).
  const ruLocale = LANGUAGE_MAP.ru;
  const merged = mergeTranslationValues(
    STRINGS_EN,
    ruLocale,
  ) as typeof STRINGS_EN;

  it('uses the translation where the locale provides one', () => {
    expect(merged.common.run).toBe('Запустить');
    expect(merged.commands.updateCurrentFile).toBe(
      'Обновить даты в текущем файле',
    );
  });
  it('falls back to English for keys the locale omits (no blank/undefined)', () => {
    // ru intentionally omits these identifier/symbol leaves.
    expect(merged.modals.populate.platformMacWin).toBe('macOS / Windows');
    expect(merged.modals.inversions.columnDelta).toBe('Δ');
    expect(merged.modals.reformat.targetFormatDesc).toBe('{currentFormat}');
  });
});

function collectKeyPaths(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out.push(...collectKeyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

const NON_EN_LOCALES = Object.entries(LANGUAGE_MAP).filter(
  ([code]) => code !== 'en',
);

describe('locale coverage', () => {
  const enKeys = new Set(collectKeyPaths(STRINGS_EN));
  if (NON_EN_LOCALES.length === 0) {
    it('no non-English locales registered yet (nothing to check)', () => {
      expect(NON_EN_LOCALES).toEqual([]);
    });
  }
  for (const [code, locale] of NON_EN_LOCALES) {
    it(`${code}: every key exists in English (no stray/renamed keys)`, () => {
      const stray = collectKeyPaths(locale).filter((k) => !enKeys.has(k));
      expect(stray, `stray keys in ${code}`).toEqual([]);
    });
  }
});

function leafEntries(obj: unknown, prefix = ''): Array<[string, string]> {
  if (typeof obj === 'string') return [[prefix, obj]];
  if (typeof obj !== 'object' || obj === null) return [];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leafEntries(v, prefix ? `${prefix}.${k}` : k),
  );
}
const EN_LEAVES = new Map(leafEntries(STRINGS_EN));
const tokenSet = (s: string): string =>
  (s.match(/\{(\w+)\}/g) ?? []).sort().join(',');

describe('locale value integrity', () => {
  if (NON_EN_LOCALES.length === 0) {
    it('no non-English locales registered yet (nothing to check)', () => {
      expect(NON_EN_LOCALES).toEqual([]);
    });
  }
  for (const [code, locale] of NON_EN_LOCALES) {
    const entries = leafEntries(locale);
    it(`${code}: no empty-string overrides (would ship a blank label)`, () => {
      const blanks = entries.filter(
        ([p, v]) => v === '' && EN_LEAVES.get(p) !== '',
      );
      expect(blanks.map(([p]) => p)).toEqual([]);
    });
    it(`${code}: every value keeps English's {token} set`, () => {
      const drift = entries.filter(([p, v]) => {
        const en = EN_LEAVES.get(p);
        return en !== undefined && tokenSet(v) !== tokenSet(en);
      });
      expect(drift.map(([p]) => p)).toEqual([]);
    });
  }
});

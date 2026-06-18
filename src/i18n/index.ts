// src/i18n/index.ts
// Detects Obsidian's language and resolves `strings` once at load,
// deep-merging the locale over English so missing keys fall back.
import { getLanguage } from 'obsidian';
import { STRINGS_EN } from './locales/en';
import { STRINGS_RU } from './locales/ru';
import { STRINGS_AR } from './locales/ar';
import { STRINGS_DE } from './locales/de';
import { STRINGS_ES } from './locales/es';
import { STRINGS_FA } from './locales/fa';
import { STRINGS_FR } from './locales/fr';
import { STRINGS_ID } from './locales/id';
import { STRINGS_IT } from './locales/it';
import { STRINGS_JA } from './locales/ja';
import { STRINGS_KO } from './locales/ko';
import { STRINGS_NL } from './locales/nl';
import { STRINGS_PL } from './locales/pl';
import { STRINGS_PT } from './locales/pt';
import { STRINGS_PT_BR } from './locales/pt_br';
import { STRINGS_TH } from './locales/th';
import { STRINGS_TR } from './locales/tr';
import { STRINGS_UK } from './locales/uk';
import { STRINGS_VI } from './locales/vi';
import { STRINGS_ZH_CN } from './locales/zh_cn';
import { STRINGS_ZH_TW } from './locales/zh_tw';

export { format } from './format';

export type Strings = typeof STRINGS_EN;

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

// Locales are registered here. English is implicit (the base); others are added
// as their files land. Aliases (e.g. zh / zh-CN) map to the same object.
export const LANGUAGE_MAP: Record<string, DeepPartial<Strings>> = {
  'en': STRINGS_EN,
  'ru': STRINGS_RU,
  'ar': STRINGS_AR,
  'de': STRINGS_DE,
  'es': STRINGS_ES,
  'fa': STRINGS_FA,
  'fr': STRINGS_FR,
  'id': STRINGS_ID,
  'it': STRINGS_IT,
  'ja': STRINGS_JA,
  'ko': STRINGS_KO,
  'nl': STRINGS_NL,
  'pl': STRINGS_PL,
  'pt': STRINGS_PT,
  'pt-BR': STRINGS_PT_BR,
  'th': STRINGS_TH,
  'tr': STRINGS_TR,
  'uk': STRINGS_UK,
  'vi': STRINGS_VI,
  // Chinese aliases mirror notebook-navigator's verified map exactly. Obsidian's
  // getLanguage() returns `zh` (Simplified) / `zh-TW` (Traditional); the `zh-CN`,
  // `zh_cn`, `zh_tw` keys are defensive aliases for code forms that may arrive on
  // some platforms/versions. Keep all of them - dropping `zh_cn`/`zh_tw` would
  // silently fall an underscore-form Chinese locale back to English.
  'zh': STRINGS_ZH_CN,
  'zh-CN': STRINGS_ZH_CN,
  'zh_cn': STRINGS_ZH_CN,
  'zh-TW': STRINGS_ZH_TW,
  'zh_tw': STRINGS_ZH_TW,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeTranslationValues(
  base: unknown,
  override: unknown,
): unknown {
  if (override === undefined) return base;
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (isPlainObject(base)) {
    if (!isPlainObject(override)) return base;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(base)) {
      result[key] = mergeTranslationValues(base[key], override[key]);
    }
    return result;
  }
  return typeof override === typeof base ? override : base;
}

const resolvedCache = new Map<string, Strings>();

function getResolvedStrings(locale: string): Strings {
  if (locale === 'en') return STRINGS_EN;
  const cached = resolvedCache.get(locale);
  if (cached) return cached;
  // `?? STRINGS_EN` mirrors notebook-navigator (LANGUAGE_MAP[locale] ?? LANGUAGE_MAP.en)
  // and satisfies noUncheckedIndexedAccess. Note: untouched subtrees are returned BY
  // REFERENCE from STRINGS_EN (shared with the merged result), so `strings` must be
  // treated as read-only - never assign to `strings.*` at runtime, or it would mutate
  // the English source and every cached locale. (No code mutates it today; this is a
  // guard for future edits. A dev-time deep-freeze of STRINGS_EN is optional insurance.)
  const merged = mergeTranslationValues(
    STRINGS_EN,
    LANGUAGE_MAP[locale] ?? STRINGS_EN,
  ) as Strings;
  resolvedCache.set(locale, merged);
  return merged;
}

function getObsidianLanguage(): string {
  const locale = getLanguage();
  return locale && locale in LANGUAGE_MAP ? locale : 'en';
}

export const strings: Strings = getResolvedStrings(getObsidianLanguage());

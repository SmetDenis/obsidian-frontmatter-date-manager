import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { detectSlashDateReadings, detectSlashOrderFromLocale } from '../utils';

// Pin the host zone to UTC so the parsed instants are deterministic on any
// machine; every call also passes an explicit timezone, mirroring how the
// Reformat modal anchors parsing (see parseDateValueWithZone.test.ts).
const ymd = (date: Date | undefined): string =>
  date === undefined
    ? 'undefined'
    : format(date, 'yyyy-MM-dd', { in: tz('UTC') });
const hh = (date: Date | undefined): string =>
  date === undefined ? 'undefined' : format(date, 'HH:mm', { in: tz('UTC') });

describe('detectSlashDateReadings', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'UTC');
  });
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('flags a both-readings-valid slash date as ambiguous with both candidates', () => {
    // 01/05/2024: day-first -> May 1, month-first -> Jan 5. Both valid, differ.
    const r = detectSlashDateReadings('01/05/2024', 'UTC');
    expect(r.ambiguous).toBe(true);
    expect(ymd(r.dmyDate)).toBe('2024-05-01');
    expect(ymd(r.mdyDate)).toBe('2024-01-05');
  });

  it('applies the same ambiguity detection to dot-separated dates', () => {
    const r = detectSlashDateReadings('01.05.2024', 'UTC');
    expect(r.ambiguous).toBe(true);
    expect(ymd(r.dmyDate)).toBe('2024-05-01');
    expect(ymd(r.mdyDate)).toBe('2024-01-05');
  });

  it('preserves the time component on both candidate readings', () => {
    const r = detectSlashDateReadings('01/05/2024 10:30:00', 'UTC');
    expect(r.ambiguous).toBe(true);
    expect(ymd(r.dmyDate)).toBe('2024-05-01');
    expect(ymd(r.mdyDate)).toBe('2024-01-05');
    expect(hh(r.dmyDate)).toBe('10:30');
    expect(hh(r.mdyDate)).toBe('10:30');
  });

  it('is NOT ambiguous when only the day-first reading is valid (day > 12)', () => {
    // 25/12/2024: month-first would need month 25 (invalid), so only DMY parses.
    expect(detectSlashDateReadings('25/12/2024', 'UTC').ambiguous).toBe(false);
  });

  it('is NOT ambiguous when only the month-first reading is valid', () => {
    // 12/25/2024: day-first would need month 25 (invalid), so only MDY parses.
    expect(detectSlashDateReadings('12/25/2024', 'UTC').ambiguous).toBe(false);
  });

  it('is NOT ambiguous when both readings yield the same date', () => {
    // 05/05/2024 is identical either way - no ambiguity.
    expect(detectSlashDateReadings('05/05/2024', 'UTC').ambiguous).toBe(false);
  });

  it('is NOT ambiguous for a year-first slash date', () => {
    expect(detectSlashDateReadings('2024/01/15', 'UTC').ambiguous).toBe(false);
  });

  it('is NOT ambiguous for an ISO 8601 value', () => {
    expect(detectSlashDateReadings('2024-01-15', 'UTC').ambiguous).toBe(false);
  });

  it('is NOT ambiguous for a compact yyyyMMdd value', () => {
    expect(detectSlashDateReadings('20240115', 'UTC').ambiguous).toBe(false);
  });

  it('is NOT ambiguous for an unparseable string', () => {
    expect(detectSlashDateReadings('garbage', 'UTC').ambiguous).toBe(false);
  });

  it('is NOT ambiguous for a numeric epoch value', () => {
    expect(detectSlashDateReadings(1712916000, 'UTC').ambiguous).toBe(false);
  });
});

describe('detectSlashOrderFromLocale', () => {
  it('returns mdy for a US English locale', () => {
    expect(detectSlashOrderFromLocale('en-US')).toBe('mdy');
  });

  it('returns dmy for a UK English locale', () => {
    expect(detectSlashOrderFromLocale('en-GB')).toBe('dmy');
  });

  it('returns dmy for Russian and German locales', () => {
    expect(detectSlashOrderFromLocale('ru-RU')).toBe('dmy');
    expect(detectSlashOrderFromLocale('de-DE')).toBe('dmy');
  });

  it('returns undefined for a region-less language (no confident signal)', () => {
    // Bare 'en' carries no region, so US-vs-UK order cannot be determined.
    expect(detectSlashOrderFromLocale('en')).toBeUndefined();
  });

  it('returns undefined for the undetermined locale', () => {
    expect(detectSlashOrderFromLocale('und')).toBeUndefined();
  });

  it('returns undefined for empty or undefined input', () => {
    expect(detectSlashOrderFromLocale('')).toBeUndefined();
    expect(detectSlashOrderFromLocale(undefined)).toBeUndefined();
  });
});

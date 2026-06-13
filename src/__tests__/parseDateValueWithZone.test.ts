import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { parseDateValueWithZone } from '../utils';

// `parseDateValueWithZone` is the inverse of `formatDate`, which always formats
// with `{ in: tz(timezone) }`. The bug it fixes only manifests when the
// configured timezone differs from the host zone, so pin the host zone to UTC
// to make these assertions deterministic on any machine. The configured zone is
// New York, which is never UTC, so the difference always exists.
const NY = 'America/New_York';
const reformatInNy = (date: Date | undefined): string =>
  date === undefined
    ? 'undefined'
    : format(date, "yyyy-MM-dd'T'HH:mm:ss", { in: tz(NY) });

describe('parseDateValueWithZone', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'UTC');
  });
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('is the exact inverse of formatDate for a naive ISO datetime', () => {
    // Anchored in the configured zone: 10:30 parsed in NY re-formats to 10:30,
    // not 05:30 (what a host-zone parse would produce on a UTC host).
    expect(
      reformatInNy(parseDateValueWithZone('2024-01-15T10:30:00', NY)),
    ).toBe('2024-01-15T10:30:00');
  });

  it('keeps a date-only value on the same calendar day in the configured zone', () => {
    const date = parseDateValueWithZone('2024-01-15', NY);
    expect(date).toBeDefined();
    // Must NOT become 2024-01-14 (the prev-day shift under a host-zone parse).
    expect(format(date as Date, 'yyyy-MM-dd', { in: tz(NY) })).toBe(
      '2024-01-15',
    );
  });

  it('parses a space-separated ISO variant in the configured zone', () => {
    expect(
      reformatInNy(parseDateValueWithZone('2024-01-15 10:30:00', NY)),
    ).toBe('2024-01-15T10:30:00');
  });

  it('parses the European dot format via the format loop, anchored in the zone', () => {
    expect(
      reformatInNy(parseDateValueWithZone('15.01.2024 10:30:00', NY)),
    ).toBe('2024-01-15T10:30:00');
  });

  it('respects an explicit offset instead of re-anchoring it', () => {
    // 10:30 at +05:00 is the absolute instant 2024-01-15T05:30:00Z. The `in`
    // option supplies a zone only for offset-less values, so the offset wins.
    const date = parseDateValueWithZone('2024-01-15T10:30:00+05:00', NY);
    expect(date?.getTime()).toBe(Date.UTC(2024, 0, 15, 5, 30, 0));
  });

  it('parses an offset-less value in the host zone when timezone is empty', () => {
    // Host zone is pinned to UTC, so the naive value resolves to 10:30Z.
    const date = parseDateValueWithZone('2024-01-15T10:30:00', '');
    expect(date?.getTime()).toBe(Date.UTC(2024, 0, 15, 10, 30, 0));
  });

  it('treats a numeric epoch as an absolute instant, never re-anchored', () => {
    // 1712916000 s == 2024-04-12T10:00:00Z. The result is identical for any
    // timezone argument because epoch values carry no wall-clock ambiguity.
    const expected = 1712916000 * 1000;
    expect(parseDateValueWithZone(1712916000, NY)?.getTime()).toBe(expected);
    expect(parseDateValueWithZone(1712916000, 'UTC')?.getTime()).toBe(expected);
    expect(parseDateValueWithZone(1712916000, '')?.getTime()).toBe(expected);
  });

  it('parses a numeric epoch string as seconds (absolute instant)', () => {
    expect(parseDateValueWithZone('1712916000', NY)?.getTime()).toBe(
      1712916000 * 1000,
    );
  });

  it('returns undefined for an unparseable string', () => {
    expect(parseDateValueWithZone('not-a-date', NY)).toBeUndefined();
  });

  it('returns undefined for an empty or whitespace string', () => {
    expect(parseDateValueWithZone('', NY)).toBeUndefined();
    expect(parseDateValueWithZone('   ', NY)).toBeUndefined();
  });

  it('returns undefined for NaN numeric input', () => {
    expect(parseDateValueWithZone(NaN, NY)).toBeUndefined();
  });
});

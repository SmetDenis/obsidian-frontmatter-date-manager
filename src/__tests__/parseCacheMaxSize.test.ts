import { describe, it, expect } from 'vitest';
import { parseCacheMaxSize } from '../utils';

describe('parseCacheMaxSize', () => {
  // The bug this function fixes: the old handler did `parseInt(value) || 10_000`,
  // and since parseInt('0') === 0 is falsy, an explicit 0 was silently turned
  // into 10000 - making the documented "0 = no limit" unreachable from the UI.
  it('preserves an explicit 0 as unlimited (regression: || swallowed 0)', () => {
    expect(parseCacheMaxSize('0')).toBe(0);
  });

  it('keeps a normal positive integer', () => {
    expect(parseCacheMaxSize('500')).toBe(500);
  });

  it('keeps the documented default value', () => {
    expect(parseCacheMaxSize('10000')).toBe(10_000);
  });

  it('truncates a decimal to an integer (parseInt semantics)', () => {
    expect(parseCacheMaxSize('2.9')).toBe(2);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseCacheMaxSize('  42  ')).toBe(42);
  });

  it('clamps a negative value to 0 (unlimited), matching the engine maxSize <= 0', () => {
    expect(parseCacheMaxSize('-5')).toBe(0);
  });

  it('clamps -1 to 0 (unlimited)', () => {
    expect(parseCacheMaxSize('-1')).toBe(0);
  });

  it('falls back to the default 10000 on empty input', () => {
    expect(parseCacheMaxSize('')).toBe(10_000);
  });

  it('falls back to the default 10000 on whitespace-only input', () => {
    expect(parseCacheMaxSize('   ')).toBe(10_000);
  });

  it('falls back to the default 10000 on non-numeric garbage', () => {
    expect(parseCacheMaxSize('abc')).toBe(10_000);
  });
});

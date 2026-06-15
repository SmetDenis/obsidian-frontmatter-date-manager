import { describe, it, expect } from 'vitest';
import { coerceCount } from '../utils';

// R4 (number hygiene): coerceCount turns ANY existing edit-activity counter
// value - a clean number, numeric string, float, negative, garbage, array,
// object, boolean, or missing - into a safe non-negative integer BASE (the caller
// adds the +1). It must never throw, never go negative, never round up, and never
// let `Number([5]) === 5` leak an array element through. Mirrors the table style
// of parseDateValueWithZone.test.ts.

const cases: Array<[unknown, number]> = [
  // clean numbers
  [0, 0],
  [1, 1],
  [42, 42],
  // numeric strings parse
  ['0', 0],
  ['42', 42],
  // floats truncate TOWARD ZERO (never round up)
  [42.7, 42],
  ['42.7', 42],
  [0.9, 0],
  [-0.4, 0],
  [100.9, 100],
  // negatives clamp to 0
  [-3, 0],
  ['-3', 0],
  // non-finite -> 0
  [NaN, 0],
  [Infinity, 0],
  [-Infinity, 0],
  // unparseable / blank -> 0
  ['abc', 0],
  ['', 0],
  ['   ', 0],
  // missing / wrong-type -> 0 (type guard before Number())
  [null, 0],
  [undefined, 0],
  [true, 0],
  [false, 0],
  [[], 0],
  [[5], 0],
  [{}, 0],
  [{ a: 1 }, 0],
];

describe('coerceCount', () => {
  cases.forEach(([input, expected], i) => {
    it(`case ${i}: coerceCount(${String(input)}) -> ${expected}`, () => {
      expect(coerceCount(input)).toBe(expected);
    });
  });

  it('never throws and always returns a finite non-negative integer', () => {
    for (const [input] of cases) {
      let result = -1;
      expect(() => {
        result = coerceCount(input);
      }).not.toThrow();
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });

  it('preserves a large value near MAX_SAFE_INTEGER without overflow to NaN', () => {
    expect(coerceCount(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    // JS pre-rounds this to an even integer before the helper sees it; result is
    // still a finite, non-negative integer (no NaN/Infinity leak).
    const r = coerceCount(Number.MAX_SAFE_INTEGER + 0.5);
    expect(Number.isFinite(r)).toBe(true);
    expect(Number.isInteger(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
  });

  it('returns the BASE: the caller adds +1 (helper itself does not)', () => {
    expect(coerceCount('4') + 1).toBe(5);
    expect(coerceCount(undefined) + 1).toBe(1);
    expect(coerceCount('garbage') + 1).toBe(1);
    expect(coerceCount(-2) + 1).toBe(1);
  });
});

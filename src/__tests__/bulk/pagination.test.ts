import { describe, it, expect } from 'vitest';
import { getPageCount, clampPage, getPageSlice } from '../../bulk/pagination';

describe('getPageCount', () => {
  it('returns 0 for an empty set', () => {
    expect(getPageCount(0, 100)).toBe(0);
  });

  it('returns 1 when the total fits in a single page', () => {
    expect(getPageCount(1, 100)).toBe(1);
    expect(getPageCount(100, 100)).toBe(1);
  });

  it('rounds partial pages up', () => {
    expect(getPageCount(101, 100)).toBe(2);
    expect(getPageCount(250, 100)).toBe(3);
  });
});

describe('clampPage', () => {
  it('clamps a negative page to 0', () => {
    expect(clampPage(-1, 3)).toBe(0);
  });

  it('clamps a page beyond the last to pageCount - 1', () => {
    expect(clampPage(5, 3)).toBe(2);
  });

  it('returns 0 when there are no pages', () => {
    expect(clampPage(0, 0)).toBe(0);
    expect(clampPage(2, 0)).toBe(0);
  });

  it('leaves an in-range page unchanged', () => {
    expect(clampPage(1, 3)).toBe(1);
  });
});

describe('getPageSlice', () => {
  const rows = Array.from({ length: 250 }, (_, i) => i);

  it('returns the first page', () => {
    expect(getPageSlice(rows, 0, 100)).toEqual(
      Array.from({ length: 100 }, (_, i) => i),
    );
  });

  it('returns a middle page', () => {
    expect(getPageSlice(rows, 1, 100)).toEqual(
      Array.from({ length: 100 }, (_, i) => i + 100),
    );
  });

  it('returns the partial last page', () => {
    expect(getPageSlice(rows, 2, 100)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 200),
    );
  });

  it('clamps an out-of-range page to the last page', () => {
    expect(getPageSlice(rows, 99, 100)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 200),
    );
  });

  it('returns an empty array when there are no rows', () => {
    expect(getPageSlice([], 0, 100)).toEqual([]);
  });
});

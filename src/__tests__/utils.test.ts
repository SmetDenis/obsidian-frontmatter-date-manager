import { describe, it, expect } from 'vitest';
import { onlyUniqueArray, isTFile, errorToMessage } from '../utils';

describe('onlyUniqueArray', () => {
  it('removes duplicate strings', () => {
    expect(['a', 'b', 'a', 'c', 'b'].filter(onlyUniqueArray)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('removes duplicate numbers', () => {
    expect([1, 2, 3, 2, 1].filter(onlyUniqueArray)).toEqual([1, 2, 3]);
  });

  it('returns empty array for empty input', () => {
    expect([].filter(onlyUniqueArray)).toEqual([]);
  });

  it('preserves order of first occurrence', () => {
    expect(['c', 'a', 'b', 'a', 'c'].filter(onlyUniqueArray)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('returns single element for all-duplicate array', () => {
    expect(['x', 'x', 'x'].filter(onlyUniqueArray)).toEqual(['x']);
  });
});

describe('isTFile', () => {
  it('returns true for object with stat property', () => {
    const file = { stat: { ctime: 0, mtime: 0, size: 0 }, path: 'test.md' };
    expect(isTFile(file as any)).toBe(true);
  });

  it('returns false for object without stat property', () => {
    const folder = { path: 'some-folder', children: [] };
    expect(isTFile(folder as any)).toBe(false);
  });
});

describe('errorToMessage', () => {
  it('returns the message of an Error', () => {
    expect(errorToMessage(new Error('boom'))).toBe('boom');
  });

  it('returns the message of an Error subclass', () => {
    class CustomError extends Error {}
    expect(errorToMessage(new CustomError('custom'))).toBe('custom');
  });

  it('stringifies a thrown string', () => {
    expect(errorToMessage('oops')).toBe('oops');
  });

  it('stringifies a thrown number', () => {
    expect(errorToMessage(42)).toBe('42');
  });

  it('stringifies a thrown plain object', () => {
    expect(errorToMessage({ code: 1 })).toBe('[object Object]');
  });

  it('stringifies null and undefined', () => {
    expect(errorToMessage(null)).toBe('null');
    expect(errorToMessage(undefined)).toBe('undefined');
  });
});

import { describe, it, expect } from 'vitest';
import {
  onlyUniqueArray,
  isTFile,
  errorToMessage,
  parsePropertyKeys,
} from '../utils';

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

describe('parsePropertyKeys', () => {
  it('returns a single trimmed key', () => {
    expect(parsePropertyKeys('  tags  ', [])).toEqual(['tags']);
  });

  it('splits a comma-separated list and trims each key', () => {
    expect(parsePropertyKeys('tags, aliases ,cssclasses', [])).toEqual([
      'tags',
      'aliases',
      'cssclasses',
    ]);
  });

  it('drops empty segments from stray or trailing commas', () => {
    expect(parsePropertyKeys('tags, , aliases,', [])).toEqual([
      'tags',
      'aliases',
    ]);
  });

  it('dedupes repeated keys within the same input', () => {
    expect(parsePropertyKeys('tags, tags, aliases', [])).toEqual([
      'tags',
      'aliases',
    ]);
  });

  it('drops keys already present in the existing list', () => {
    expect(parsePropertyKeys('tags, aliases', ['tags'])).toEqual(['aliases']);
  });

  it('returns an empty array for empty or whitespace-only input', () => {
    expect(parsePropertyKeys('', ['tags'])).toEqual([]);
    expect(parsePropertyKeys('   ,  , ', ['tags'])).toEqual([]);
  });

  it('is case-sensitive (matches exact-match dedup elsewhere)', () => {
    expect(parsePropertyKeys('Tags', ['tags'])).toEqual(['Tags']);
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

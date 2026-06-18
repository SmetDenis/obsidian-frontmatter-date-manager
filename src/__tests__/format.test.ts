import { describe, it, expect } from 'vitest';
import { format } from '../i18n/format';

describe('format', () => {
  it('substitutes a single token', () => {
    expect(format('Page {page}', { page: 2 })).toBe('Page 2');
  });
  it('substitutes multiple tokens and coerces numbers', () => {
    expect(format('Page {current} of {total}', { current: 1, total: 5 })).toBe(
      'Page 1 of 5',
    );
  });
  it('substitutes a repeated token', () => {
    expect(format('{x} {x}', { x: 'z' })).toBe('z z');
  });
  it('keeps an unknown/missing token literal', () => {
    expect(format('hi {missing}', {})).toBe('hi {missing}');
  });
  it('renders zero, not an empty string', () => {
    expect(format('{n} files', { n: 0 })).toBe('0 files');
  });
  it('returns the template unchanged when it has no tokens', () => {
    expect(format('no tokens here', { x: 1 })).toBe('no tokens here');
  });
});

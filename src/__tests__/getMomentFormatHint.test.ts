import { describe, it, expect } from 'vitest';
import { getMomentFormatHint } from '../utils';

describe('getMomentFormatHint', () => {
  it('detects YYYY and suggests yyyy', () => {
    const hint = getMomentFormatHint('YYYY-MM-DD');
    expect(hint).toContain('Use "yyyy" instead of "YYYY"');
  });

  it('detects DD and suggests dd', () => {
    const hint = getMomentFormatHint('yyyy-MM-DD');
    expect(hint).toContain('Use "dd" instead of "DD"');
  });

  it('detects multiple Moment.js tokens', () => {
    const hint = getMomentFormatHint('YYYY-MM-DD');
    expect(hint).toContain('yyyy');
    expect(hint).toContain('dd');
  });

  it('detects standalone YY (2-digit year)', () => {
    const hint = getMomentFormatHint('YY-MM-dd');
    expect(hint).toContain('Use "yy" instead of "YY"');
  });

  it('detects standalone D (single-digit day)', () => {
    const hint = getMomentFormatHint('yyyy-MM-D');
    expect(hint).toContain('Use "d" instead of "D"');
  });

  it('returns undefined for valid date-fns format', () => {
    const hint = getMomentFormatHint("yyyy-MM-dd'T'HH:mm");
    expect(hint).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const hint = getMomentFormatHint('');
    expect(hint).toBeUndefined();
  });
});

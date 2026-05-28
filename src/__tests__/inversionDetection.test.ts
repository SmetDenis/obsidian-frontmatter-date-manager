import { describe, it, expect } from 'vitest';
import {
  isInversion,
  applyInversionFix,
  InversionFixStrategy,
} from '../inversionDetection';

const D = (iso: string) => new Date(iso);

describe('isInversion', () => {
  it('returns false when updated is after created', () => {
    expect(
      isInversion(D('2024-01-01T10:00:00Z'), D('2024-01-02T10:00:00Z'), 0),
    ).toBe(false);
  });

  it('returns false when updated equals created', () => {
    const d = D('2024-01-01T10:00:00Z');
    expect(isInversion(d, d, 0)).toBe(false);
  });

  it('returns true when updated is strictly before created (tolerance 0)', () => {
    expect(
      isInversion(D('2024-01-02T10:00:00Z'), D('2024-01-01T10:00:00Z'), 0),
    ).toBe(true);
  });

  it('returns false when difference is within tolerance', () => {
    expect(
      isInversion(D('2024-01-01T10:00:05Z'), D('2024-01-01T10:00:00Z'), 10),
    ).toBe(false);
  });

  it('returns false at exact tolerance boundary', () => {
    expect(
      isInversion(D('2024-01-01T10:00:10Z'), D('2024-01-01T10:00:00Z'), 10),
    ).toBe(false);
  });

  it('returns true when difference exceeds tolerance', () => {
    expect(
      isInversion(D('2024-01-01T10:00:11Z'), D('2024-01-01T10:00:00Z'), 10),
    ).toBe(true);
  });

  it('treats negative tolerance as 0', () => {
    expect(
      isInversion(D('2024-01-02T10:00:00Z'), D('2024-01-01T10:00:00Z'), -5),
    ).toBe(true);
  });
});

describe('applyInversionFix', () => {
  const sources = {
    created: D('2024-01-10T10:00:00Z'),
    updated: D('2024-01-05T10:00:00Z'),
    mtime: D('2024-01-07T10:00:00Z'),
    ctime: D('2024-01-09T10:00:00Z'),
  };

  it('created-to-updated: created becomes updated, updated unchanged', () => {
    const result = applyInversionFix('created-to-updated', sources);
    expect(result.created.getTime()).toBe(sources.updated.getTime());
    expect(result.updated.getTime()).toBe(sources.updated.getTime());
  });

  it('updated-to-created: updated becomes created, created unchanged', () => {
    const result = applyInversionFix('updated-to-created', sources);
    expect(result.created.getTime()).toBe(sources.created.getTime());
    expect(result.updated.getTime()).toBe(sources.created.getTime());
  });

  it('max-all: both become the latest of all four sources', () => {
    const result = applyInversionFix('max-all', sources);
    const expectedMax = sources.created.getTime(); // 2024-01-10 is latest
    expect(result.created.getTime()).toBe(expectedMax);
    expect(result.updated.getTime()).toBe(expectedMax);
  });

  it('max-all picks ctime when it is latest', () => {
    const result = applyInversionFix('max-all', {
      created: D('2024-01-01T10:00:00Z'),
      updated: D('2024-01-02T10:00:00Z'),
      mtime: D('2024-01-03T10:00:00Z'),
      ctime: D('2024-01-10T10:00:00Z'),
    });
    expect(result.created.toISOString()).toBe('2024-01-10T10:00:00.000Z');
    expect(result.updated.toISOString()).toBe('2024-01-10T10:00:00.000Z');
  });

  it('returns new Date objects (no aliasing of inputs)', () => {
    const result = applyInversionFix('created-to-updated', sources);
    expect(result.created).not.toBe(sources.updated);
    expect(result.updated).not.toBe(sources.updated);
  });
});

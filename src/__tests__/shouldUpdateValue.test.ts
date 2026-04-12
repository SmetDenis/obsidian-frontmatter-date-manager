import { describe, it, expect } from 'vitest';
import { createPlugin } from './helpers';

describe('shouldUpdateValue', () => {
  it('returns true when mtime is after threshold', () => {
    const plugin = createPlugin({ minSecondsBetweenSaves: 30 });
    const updateHeader = new Date(2024, 0, 15, 10, 0, 0);
    const currentMtime = new Date(2024, 0, 15, 10, 0, 31); // 31s later
    expect(plugin.shouldUpdateValue(currentMtime, updateHeader)).toBe(true);
  });

  it('returns false when mtime is before threshold', () => {
    const plugin = createPlugin({ minSecondsBetweenSaves: 60 });
    const updateHeader = new Date(2024, 0, 15, 10, 0, 0);
    const currentMtime = new Date(2024, 0, 15, 10, 0, 45); // 45s later, threshold is 60
    expect(plugin.shouldUpdateValue(currentMtime, updateHeader)).toBe(false);
  });

  it('returns false when exactly at threshold (isAfter is strict)', () => {
    const plugin = createPlugin({ minSecondsBetweenSaves: 60 });
    const updateHeader = new Date(2024, 0, 15, 10, 0, 0);
    const currentMtime = new Date(2024, 0, 15, 10, 1, 0); // exactly 60s
    expect(plugin.shouldUpdateValue(currentMtime, updateHeader)).toBe(false);
  });

  it('returns false when both dates are identical', () => {
    const plugin = createPlugin({ minSecondsBetweenSaves: 30 });
    const date = new Date(2024, 0, 15, 10, 0);
    expect(plugin.shouldUpdateValue(date, date)).toBe(false);
  });

  it('works with high threshold (300 seconds)', () => {
    const plugin = createPlugin({ minSecondsBetweenSaves: 300 });
    const updateHeader = new Date(2024, 0, 15, 10, 0, 0);
    const after301 = new Date(2024, 0, 15, 10, 5, 1); // 301s
    const after299 = new Date(2024, 0, 15, 10, 4, 59); // 299s
    expect(plugin.shouldUpdateValue(after301, updateHeader)).toBe(true);
    expect(plugin.shouldUpdateValue(after299, updateHeader)).toBe(false);
  });
});

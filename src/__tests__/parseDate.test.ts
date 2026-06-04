import { describe, it, expect } from 'vitest';
import { createPlugin } from './helpers';

describe('parseDate', () => {
  it("parses string with default format yyyy-MM-dd'T'HH:mm:ss", () => {
    const plugin = createPlugin();
    const result = plugin.parseDate('2024-01-15T10:30:00');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(0); // January
    expect(result!.getDate()).toBe(15);
    expect(result!.getHours()).toBe(10);
    expect(result!.getMinutes()).toBe(30);
  });

  it('parses numeric timestamp (milliseconds)', () => {
    const timestamp = new Date(2024, 0, 15, 10, 30).getTime();
    const plugin = createPlugin();
    const result = plugin.parseDate(timestamp);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBe(timestamp);
  });

  it('returns undefined for unparseable string', () => {
    const plugin = createPlugin();
    const result = plugin.parseDate('not-a-date');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const plugin = createPlugin();
    const result = plugin.parseDate('');
    expect(result).toBeUndefined();
  });

  it('works with custom date format', () => {
    const plugin = createPlugin({ dateFormat: 'yyyy/MM/dd' });
    const result = plugin.parseDate('2024/06/20');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(5); // June
    expect(result!.getDate()).toBe(20);
  });

  it('handles numeric input 0 (epoch)', () => {
    const plugin = createPlugin();
    const result = plugin.parseDate(0);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getTime()).toBe(0);
  });

  it('parses string in UTC when timezone is set to UTC', () => {
    const plugin = createPlugin({ timezone: 'UTC' });
    const result = plugin.parseDate('2024-01-15T10:30:00');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getUTCHours()).toBe(10);
    expect(result!.getUTCMinutes()).toBe(30);
  });

  it('parses string in specified IANA timezone', () => {
    const plugin = createPlugin({ timezone: 'America/New_York' });
    const result = plugin.parseDate('2024-01-15T10:30:00');
    expect(result).toBeInstanceOf(Date);
    // 10:30 EST = 15:30 UTC (January, EST = UTC-5)
    expect(result!.getUTCHours()).toBe(15);
    expect(result!.getUTCMinutes()).toBe(30);
  });

  it('parses numeric timestamp identically regardless of timezone', () => {
    const timestamp = Date.UTC(2024, 0, 15, 10, 30);
    const pluginLocal = createPlugin({ timezone: '' });
    const pluginUTC = createPlugin({ timezone: 'UTC' });
    const resultLocal = pluginLocal.parseDate(timestamp);
    const resultUTC = pluginUTC.parseDate(timestamp);
    expect(resultLocal!.getTime()).toBe(resultUTC!.getTime());
  });

  it('returns undefined for NaN numeric input', () => {
    const plugin = createPlugin();
    const result = plugin.parseDate(NaN);
    expect(result).toBeUndefined();
  });

  it('returns undefined for Infinity numeric input', () => {
    const plugin = createPlugin();
    const result = plugin.parseDate(Infinity);
    expect(result).toBeUndefined();
  });

  it('returns undefined for -Infinity numeric input', () => {
    const plugin = createPlugin();
    const result = plugin.parseDate(-Infinity);
    expect(result).toBeUndefined();
  });

  it('parses 10-digit Unix seconds as seconds, not milliseconds', () => {
    const plugin = createPlugin({ timezone: 'UTC' });
    // 1712916000 = 2024-04-12T10:00:00Z expressed in Unix SECONDS (format `t`)
    const result = plugin.parseDate(1712916000);
    expect(result).toBeInstanceOf(Date);
    expect(result!.getUTCFullYear()).toBe(2024);
    expect(result!.getUTCMonth()).toBe(3); // April
    expect(result!.getUTCDate()).toBe(12);
  });

  it('round-trips numeric t-format output (formatDate -> parseDate)', () => {
    const plugin = createPlugin({
      dateFormat: 't',
      enableNumberProperties: true,
      timezone: 'UTC',
    });
    const original = new Date(Date.UTC(2024, 3, 12, 10, 0, 0));
    const formatted = plugin.formatDate(original);
    expect(typeof formatted).toBe('number');
    const parsed = plugin.parseDate(formatted as number);
    expect(parsed!.getTime()).toBe(original.getTime());
  });

  it('still parses 13-digit millisecond timestamps as milliseconds', () => {
    const plugin = createPlugin({ timezone: 'UTC' });
    const ms = Date.UTC(2024, 3, 12, 10, 0, 0); // ~1.71e12
    const result = plugin.parseDate(ms);
    expect(result!.getTime()).toBe(ms);
    expect(result!.getUTCFullYear()).toBe(2024);
  });
});

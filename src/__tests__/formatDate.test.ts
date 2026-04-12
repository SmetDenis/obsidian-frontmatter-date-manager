import { describe, it, expect, vi } from 'vitest';
import { createPlugin } from './helpers';

describe('formatDate', () => {
  it('formats Date with default format', () => {
    const plugin = createPlugin();
    const date = new Date(2024, 0, 15, 10, 30);
    const result = plugin.formatDate(date);
    expect(result).toBe('2024-01-15T10:30:00');
  });

  it('returns string when enableNumberProperties is false', () => {
    const plugin = createPlugin({
      dateFormat: 'T',
      enableNumberProperties: false,
    });
    const date = new Date(2024, 0, 15);
    const result = plugin.formatDate(date);
    expect(typeof result).toBe('string');
  });

  it('returns number when enableNumberProperties is true and output is all digits', () => {
    const plugin = createPlugin({
      dateFormat: 'T',
      enableNumberProperties: true,
    });
    const date = new Date(2024, 0, 15, 10, 30);
    const result = plugin.formatDate(date);
    expect(typeof result).toBe('number');
  });

  it('returns string when output has non-digits even with enableNumberProperties', () => {
    const plugin = createPlugin({
      dateFormat: "yyyy-MM-dd'T'HH:mm",
      enableNumberProperties: true,
    });
    const date = new Date(2024, 0, 15, 10, 30);
    const result = plugin.formatDate(date);
    expect(typeof result).toBe('string');
    expect(result).toBe('2024-01-15T10:30');
  });

  it('works with custom format', () => {
    const plugin = createPlugin({ dateFormat: 'yyyy/MM/dd HH:mm:ss' });
    const date = new Date(2024, 5, 20, 14, 45, 30);
    const result = plugin.formatDate(date);
    expect(result).toBe('2024/06/20 14:45:30');
  });

  it('works with date-only format', () => {
    const plugin = createPlugin({ dateFormat: 'yyyy-MM-dd' });
    const date = new Date(2024, 11, 25);
    const result = plugin.formatDate(date);
    expect(result).toBe('2024-12-25');
  });

  it('formats Date in UTC when timezone is set to UTC', () => {
    const plugin = createPlugin({ timezone: 'UTC' });
    const date = new Date(Date.UTC(2024, 0, 15, 10, 30));
    const result = plugin.formatDate(date);
    expect(result).toBe('2024-01-15T10:30:00');
  });

  it('formats Date in specified IANA timezone', () => {
    const plugin = createPlugin({ timezone: 'America/New_York' });
    // Jan 15 2024 15:30 UTC = Jan 15 2024 10:30 EST (UTC-5)
    const date = new Date(Date.UTC(2024, 0, 15, 15, 30));
    const result = plugin.formatDate(date);
    expect(result).toBe('2024-01-15T10:30:00');
  });

  it('formats Date in local timezone when timezone is empty string', () => {
    const plugin = createPlugin({ timezone: '' });
    const date = new Date(2024, 0, 15, 10, 30);
    const result = plugin.formatDate(date);
    expect(result).toBe('2024-01-15T10:30:00');
  });

  it('returns undefined for Moment.js format tokens', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const plugin = createPlugin({ dateFormat: 'YYYY-MM-DD' });
    const date = new Date(2024, 0, 15, 10, 30);
    const result = plugin.formatDate(date);
    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('returns undefined for unrecognized format token', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const plugin = createPlugin({ dateFormat: 'yyyy-MM-dd j' });
    const date = new Date(2024, 0, 15, 10, 30);
    const result = plugin.formatDate(date);
    expect(result).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

import { describe, it, expect } from 'vitest';
import { createPlugin } from './helpers';

describe('hashString', () => {
  it('returns consistent SHA-256 hash for known input', () => {
    const plugin = createPlugin();
    const hash1 = plugin.hashString('hello');
    const hash2 = plugin.hashString('hello');
    expect(hash1).toBe(hash2);
  });

  it('returns 64 hex characters', () => {
    const plugin = createPlugin();
    const hash = plugin.hashString('test');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns different hashes for different inputs', () => {
    const plugin = createPlugin();
    const hash1 = plugin.hashString('hello');
    const hash2 = plugin.hashString('world');
    expect(hash1).not.toBe(hash2);
  });

  it('handles empty string', () => {
    const plugin = createPlugin();
    const hash = plugin.hashString('');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    // SHA-256 of empty string is well-known
    expect(hash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

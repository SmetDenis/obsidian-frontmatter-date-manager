import { describe, it, expect } from 'vitest';
import { createPlugin } from './helpers';

describe('stripFrontmatter', () => {
  const plugin = createPlugin();

  it('strips standard frontmatter and returns body', () => {
    const content =
      '---\ntitle: Test\ndate: 2024-01-01\n---\nBody content here';
    expect(plugin.stripFrontmatter(content)).toBe('Body content here');
  });

  it('returns full content when no frontmatter present', () => {
    const content = 'Just body content without frontmatter';
    expect(plugin.stripFrontmatter(content)).toBe(content);
  });

  it('handles empty frontmatter', () => {
    const content = '---\n---\nBody after empty frontmatter';
    expect(plugin.stripFrontmatter(content)).toBe(
      'Body after empty frontmatter',
    );
  });

  it('handles CRLF line endings', () => {
    const content = '---\r\ntitle: Test\r\n---\r\nBody with CRLF';
    expect(plugin.stripFrontmatter(content)).toBe('Body with CRLF');
  });

  it('does not strip horizontal rules in body', () => {
    const content = '---\ntitle: Test\n---\nBefore rule\n\n---\n\nAfter rule';
    expect(plugin.stripFrontmatter(content)).toBe(
      'Before rule\n\n---\n\nAfter rule',
    );
  });

  it('returns empty string when file is frontmatter only', () => {
    const content = '---\ntitle: Test\n---\n';
    expect(plugin.stripFrontmatter(content)).toBe('');
  });

  it('returns empty string when file is frontmatter only without trailing newline', () => {
    const content = '---\ntitle: Test\n---';
    expect(plugin.stripFrontmatter(content)).toBe('');
  });

  it('does not strip --- that is not at the start of file', () => {
    const content = 'Some text\n---\ntitle: Test\n---\nMore text';
    expect(plugin.stripFrontmatter(content)).toBe(content);
  });

  it('handles multiline YAML values', () => {
    const content =
      '---\ntitle: Test\ndescription: |\n  Line one\n  Line two\n---\nBody';
    expect(plugin.stripFrontmatter(content)).toBe('Body');
  });
});

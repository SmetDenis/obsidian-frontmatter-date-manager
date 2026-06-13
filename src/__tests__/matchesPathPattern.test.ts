import { describe, it, expect } from 'vitest';
import { matchesPathPattern, isGlobPattern } from '../utils';

describe('isGlobPattern', () => {
  it('returns false for plain folder names', () => {
    expect(isGlobPattern('templates')).toBe(false);
    expect(isGlobPattern('notes/daily')).toBe(false);
    expect(isGlobPattern('notes/')).toBe(false);
  });

  it('returns true for patterns with glob characters', () => {
    expect(isGlobPattern('**/README.md')).toBe(true);
    expect(isGlobPattern('notes/*.md')).toBe(true);
    expect(isGlobPattern('notes/??.md')).toBe(true);
    expect(isGlobPattern('notes/[abc].md')).toBe(true);
    expect(isGlobPattern('*.{md,txt}')).toBe(true);
  });
});

describe('matchesPathPattern - backward compat (plain folders)', () => {
  it('matches file in folder', () => {
    expect(matchesPathPattern('notes/test.md', 'notes')).toBe(true);
  });

  it('matches file in nested subfolder', () => {
    expect(matchesPathPattern('notes/sub/deep.md', 'notes')).toBe(true);
  });

  it('does NOT false-match similarly-named folders', () => {
    expect(matchesPathPattern('notes2/test.md', 'notes')).toBe(false);
  });

  it('works with trailing slash', () => {
    expect(matchesPathPattern('notes/test.md', 'notes/')).toBe(true);
  });

  it('does NOT match root-level file against folder', () => {
    expect(matchesPathPattern('README.md', 'notes')).toBe(false);
  });
});

describe('matchesPathPattern - glob patterns', () => {
  it('matches ** recursive pattern', () => {
    expect(matchesPathPattern('a/b/README.md', '**/README.md')).toBe(true);
  });

  it('matches root-level file with **', () => {
    expect(matchesPathPattern('README.md', '**/README.md')).toBe(true);
  });

  it('matches single * within a folder', () => {
    expect(matchesPathPattern('notes/test.md', 'notes/*.md')).toBe(true);
  });

  it('single * does NOT cross directory boundaries', () => {
    expect(matchesPathPattern('notes/sub/test.md', 'notes/*.md')).toBe(false);
  });

  it('matches **/* across directories', () => {
    expect(matchesPathPattern('notes/sub/test.md', 'notes/**/*.md')).toBe(true);
  });

  it('does not match wrong extension', () => {
    expect(matchesPathPattern('notes/test.md', '**/*.excalidraw.md')).toBe(
      false,
    );
  });

  it('matches correct compound extension', () => {
    expect(
      matchesPathPattern('notes/test.excalidraw.md', '**/*.excalidraw.md'),
    ).toBe(true);
  });

  it('does not match unrelated path', () => {
    expect(matchesPathPattern('other/file.md', 'notes/**')).toBe(false);
  });

  it('? wildcard matches single character', () => {
    expect(matchesPathPattern('notes/test1.md', 'notes/test?.md')).toBe(true);
    expect(matchesPathPattern('notes/test12.md', 'notes/test?.md')).toBe(false);
  });

  it('root-level file matches *.md', () => {
    expect(matchesPathPattern('test.md', '*.md')).toBe(true);
    expect(matchesPathPattern('test.txt', '*.md')).toBe(false);
  });
});

describe('matchesPathPattern - edge cases', () => {
  it('empty pattern returns false', () => {
    expect(matchesPathPattern('any/path.md', '')).toBe(false);
  });

  it('whitespace-only pattern returns false', () => {
    expect(matchesPathPattern('any/path.md', '  ')).toBe(false);
  });
});

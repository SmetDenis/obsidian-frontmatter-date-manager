import { describe, it, expect } from 'vitest';
import {
  RefSnapshot,
  hasOverlappingRefs,
  isPredictable,
  linkBasename,
  linkpathTargetsPath,
  linktextPath,
  parseWikilink,
  predictContent,
  rewriteWikilink,
} from '../renamePrediction';

// Build a snapshot whose offsets really point at `original` inside `content`.
function refIn(content: string, original: string, link: string): RefSnapshot {
  const start = content.indexOf(original);
  if (start === -1) throw new Error(`"${original}" not in content`);
  return { original, link, start, end: start + original.length };
}

describe('parseWikilink', () => {
  it('splits a plain link', () => {
    expect(parseWikilink('[[Old]]')).toEqual({
      open: '[[',
      linkPart: 'Old',
      alias: null,
      close: ']]',
    });
  });

  it('keeps the embed marker in `open`', () => {
    expect(parseWikilink('![[Old]]')?.open).toBe('![[');
  });

  it('takes everything after the first pipe as the alias', () => {
    expect(parseWikilink('[[a|b|c]]')).toMatchObject({
      linkPart: 'a',
      alias: 'b|c',
    });
  });

  it('rejects a markdown link', () => {
    expect(parseWikilink('[x](Old.md)')).toBeNull();
  });
});

describe('linkBasename / linktextPath', () => {
  it('takes the segment after the last slash', () => {
    expect(linkBasename('a/b/c')).toBe('c');
    expect(linkBasename('c')).toBe('c');
  });

  it('splits the subpath off, but not a leading-# link', () => {
    expect(linktextPath('Folder/Old#Heading')).toBe('Folder/Old');
    expect(linktextPath('Old#^abc123')).toBe('Old');
    expect(linktextPath('Old')).toBe('Old');
    expect(linktextPath('#Heading')).toBe('');
  });
});

describe('rewriteWikilink', () => {
  it('[[Old]] -> [[New]]', () => {
    expect(rewriteWikilink('[[Old]]', 'New')).toBe('[[New]]');
  });

  it('[[Folder/Old]] -> [[Folder/New]]', () => {
    expect(rewriteWikilink('[[Folder/Old]]', 'Folder/New')).toBe(
      '[[Folder/New]]',
    );
  });

  it('rewrites the alias when the old link had a path and the alias was its basename', () => {
    expect(rewriteWikilink('[[Folder/Old|Old]]', 'Folder/New')).toBe(
      '[[Folder/New|New]]',
    );
  });

  it('keeps the alias when the old link had no path component', () => {
    expect(rewriteWikilink('[[Old|Old]]', 'New')).toBe('[[New|Old]]');
  });

  it('keeps a hand-written alias', () => {
    expect(rewriteWikilink('[[Old|my label]]', 'New')).toBe('[[New|my label]]');
  });

  it('preserves a subpath carried in the new link text', () => {
    expect(rewriteWikilink('[[Old#Heading]]', 'New#Heading')).toBe(
      '[[New#Heading]]',
    );
    expect(rewriteWikilink('[[Old#^abc123]]', 'New#^abc123')).toBe(
      '[[New#^abc123]]',
    );
  });

  it('preserves the embed marker', () => {
    expect(rewriteWikilink('![[Old]]', 'New')).toBe('![[New]]');
  });

  it('drops the subpath from the alias it derives', () => {
    // Alias rewriting reads the PATH half of the new link text only.
    expect(rewriteWikilink('[[Folder/Old|Old]]', 'Other/New#Heading')).toBe(
      '[[Other/New#Heading|New]]',
    );
  });

  it('returns null for a non-wikilink', () => {
    expect(rewriteWikilink('[x](Old.md)', 'New')).toBeNull();
  });
});

describe('isPredictable', () => {
  it('accepts a wikilink whose span still holds its own text', () => {
    const content = 'see [[Old]] here';
    expect(isPredictable(refIn(content, '[[Old]]', 'Old'), content)).toBe(true);
  });

  it('accepts an embed', () => {
    const content = 'see ![[Old]] here';
    expect(isPredictable(refIn(content, '![[Old]]', 'Old'), content)).toBe(
      true,
    );
  });

  it('rejects an escaped pipe', () => {
    const content = 'see [[Old\\|x]] here';
    expect(isPredictable(refIn(content, '[[Old\\|x]]', 'Old'), content)).toBe(
      false,
    );
  });

  it('rejects a markdown link', () => {
    const content = 'see [x](Old.md) here';
    expect(
      isPredictable(refIn(content, '[x](Old.md)', 'Old.md'), content),
    ).toBe(false);
  });

  it('rejects a span that no longer holds `original` (stale cache)', () => {
    const content = 'see [[Old]] here';
    expect(
      isPredictable(
        { original: '[[Old]]', link: 'Old', start: 0, end: 7 },
        content,
      ),
    ).toBe(false);
  });
});

describe('linkpathTargetsPath', () => {
  it('matches the shortest form, the full path and a folder-aligned suffix', () => {
    expect(linkpathTargetsPath('Old', 'Folder/Old.md')).toBe(true);
    expect(linkpathTargetsPath('Folder/Old', 'Folder/Old.md')).toBe(true);
    expect(linkpathTargetsPath('Folder/Old.md', 'Folder/Old.md')).toBe(true);
    expect(linkpathTargetsPath('Folder/Old', 'Vault/Folder/Old.md')).toBe(true);
    expect(linkpathTargetsPath('./Old', 'Old.md')).toBe(true);
    expect(linkpathTargetsPath('OLD', 'Folder/Old.md')).toBe(true);
  });

  it('does not match an unrelated note, a partial segment, or a relative form', () => {
    expect(linkpathTargetsPath('Other', 'Folder/Old.md')).toBe(false);
    // "ld" is a suffix of "Old" but not a whole segment.
    expect(linkpathTargetsPath('ld', 'Folder/Old.md')).toBe(false);
    expect(linkpathTargetsPath('../Old', 'a/Old.md')).toBe(false);
    expect(linkpathTargetsPath('', 'Old.md')).toBe(false);
  });
});

describe('predictContent', () => {
  it('applies several replacements in descending offset order', () => {
    const content = 'a [[Old]] b [[Old]] c';
    const first = refIn(content, '[[Old]]', 'Old');
    const second = {
      ...first,
      start: content.lastIndexOf('[[Old]]'),
      end: content.lastIndexOf('[[Old]]') + 7,
    };
    const out = predictContent(content, [
      { start: second.start, end: second.end, text: '[[Renamed note]]' },
      { start: first.start, end: first.end, text: '[[Renamed note]]' },
    ]);
    expect(out).toBe('a [[Renamed note]] b [[Renamed note]] c');
  });

  it('returns the content unchanged when there is nothing to replace', () => {
    expect(predictContent('abc', [])).toBe('abc');
  });

  it('rejects overlapping spans', () => {
    expect(
      predictContent('abcdef', [
        { start: 0, end: 3, text: 'X' },
        { start: 2, end: 5, text: 'Y' },
      ]),
    ).toBeNull();
  });

  it('rejects an out-of-range or inverted span', () => {
    expect(
      predictContent('abc', [{ start: 0, end: 99, text: 'X' }]),
    ).toBeNull();
    expect(predictContent('abc', [{ start: 2, end: 1, text: 'X' }])).toBeNull();
    expect(
      predictContent('abc', [{ start: -1, end: 1, text: 'X' }]),
    ).toBeNull();
  });
});

describe('hasOverlappingRefs', () => {
  it('sorts before comparing, so links and embeds may interleave', () => {
    const refs: RefSnapshot[] = [
      { original: '[[b]]', link: 'b', start: 10, end: 15 },
      { original: '![[a]]', link: 'a', start: 0, end: 6 },
    ];
    expect(hasOverlappingRefs(refs)).toBe(false);
  });

  it('detects an overlap', () => {
    const refs: RefSnapshot[] = [
      { original: '[[a]]', link: 'a', start: 0, end: 8 },
      { original: '[[b]]', link: 'b', start: 5, end: 10 },
    ];
    expect(hasOverlappingRefs(refs)).toBe(true);
  });
});

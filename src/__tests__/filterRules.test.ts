import { describe, it, expect } from 'vitest';
import {
  parseFilterRules,
  isFileExcluded,
  validatePattern,
} from '../filterRules';
import { matchesPathPattern } from '../utils';

describe('validatePattern', () => {
  it('returns null for valid glob', () => {
    expect(validatePattern('**/*.md')).toBeNull();
    expect(validatePattern('notes/*.md')).toBeNull();
    expect(validatePattern('*.{md,txt}')).toBeNull();
  });

  it('returns null for plain folder name', () => {
    expect(validatePattern('templates')).toBeNull();
    expect(validatePattern('notes/daily')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validatePattern('')).toBe('Empty pattern');
    expect(validatePattern('   ')).toBe('Empty pattern');
  });
});

describe('parseFilterRules', () => {
  it('returns empty for empty string', () => {
    const result = parseFilterRules('');
    expect(result.rules).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('returns empty for whitespace-only', () => {
    const result = parseFilterRules('   \n  \n  ');
    expect(result.rules).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('skips comment lines', () => {
    const result = parseFilterRules('# this is a comment\n# another');
    expect(result.rules).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('skips blank lines', () => {
    const result = parseFilterRules('templates/\n\nnotes/');
    expect(result.rules).toHaveLength(2);
  });

  it('parses exclude rules', () => {
    const result = parseFilterRules('templates/\ndaily/**/*.md');
    expect(result.rules).toEqual([
      { pattern: 'templates/', negate: false, lineNumber: 1 },
      { pattern: 'daily/**/*.md', negate: false, lineNumber: 2 },
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it('parses negate rules with !', () => {
    const result = parseFilterRules('templates/\n!templates/important.md');
    expect(result.rules).toEqual([
      { pattern: 'templates/', negate: false, lineNumber: 1 },
      { pattern: 'templates/important.md', negate: true, lineNumber: 2 },
    ]);
  });

  it('trims leading/trailing whitespace', () => {
    const result = parseFilterRules('  templates/  \n  !notes/  ');
    expect(result.rules[0].pattern).toBe('templates/');
    expect(result.rules[1].pattern).toBe('notes/');
    expect(result.rules[1].negate).toBe(true);
  });

  it('reports error for ! with no pattern', () => {
    const result = parseFilterRules('!\n!  ');
    expect(result.rules).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].message).toBe('Empty pattern after "!"');
  });

  it('collects errors without stopping (empty ! pattern)', () => {
    const result = parseFilterRules('templates/\n!\nnotes/');
    expect(result.rules).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].lineNumber).toBe(2);
  });

  it('handles mixed comments, blanks, rules, and errors', () => {
    const text = [
      '# header',
      '',
      'templates/',
      '# re-include',
      '!templates/daily/',
      '',
      'archive/',
    ].join('\n');
    const result = parseFilterRules(text);
    expect(result.rules).toHaveLength(3);
    expect(result.rules[0]).toEqual({
      pattern: 'templates/',
      negate: false,
      lineNumber: 3,
    });
    expect(result.rules[1]).toEqual({
      pattern: 'templates/daily/',
      negate: true,
      lineNumber: 5,
    });
    expect(result.rules[2]).toEqual({
      pattern: 'archive/',
      negate: false,
      lineNumber: 7,
    });
  });
});

describe('isFileExcluded', () => {
  it('returns false when no rules', () => {
    expect(isFileExcluded('notes/test.md', [])).toBe(false);
  });

  it('excludes file matching a rule', () => {
    const rules = parseFilterRules('templates/').rules;
    expect(isFileExcluded('templates/note.md', rules)).toBe(true);
    expect(isFileExcluded('notes/note.md', rules)).toBe(false);
  });

  it('negate rule re-includes file', () => {
    const rules = parseFilterRules('templates/\n!templates/daily/').rules;
    expect(isFileExcluded('templates/note.md', rules)).toBe(true);
    expect(isFileExcluded('templates/daily/note.md', rules)).toBe(false);
  });

  it('last matching rule wins', () => {
    const rules = parseFilterRules(
      'templates/\n!templates/daily/\ntemplates/daily/secret/',
    ).rules;
    expect(isFileExcluded('templates/daily/note.md', rules)).toBe(false);
    expect(isFileExcluded('templates/daily/secret/note.md', rules)).toBe(true);
  });

  it('works with glob patterns', () => {
    const rules = parseFilterRules('**/*.excalidraw.md').rules;
    expect(isFileExcluded('notes/drawing.excalidraw.md', rules)).toBe(true);
    expect(isFileExcluded('notes/normal.md', rules)).toBe(false);
  });

  it('works with plain folder names (backward compat)', () => {
    const rules = parseFilterRules('templates').rules;
    expect(isFileExcluded('templates/note.md', rules)).toBe(true);
    expect(isFileExcluded('templates2/note.md', rules)).toBe(false);
  });

  it('handles allowlist pattern: ** then !folder', () => {
    const rules = parseFilterRules('**\n!notes/').rules;
    // Root-level file: excluded by **, not re-included
    expect(isFileExcluded('README.md', rules)).toBe(true);
    // notes/ file: excluded by **, then re-included by !notes/
    expect(isFileExcluded('notes/test.md', rules)).toBe(false);
  });

  it('negate without prior exclude still allows', () => {
    const rules = parseFilterRules('!templates/').rules;
    expect(isFileExcluded('templates/note.md', rules)).toBe(false);
    expect(isFileExcluded('other/note.md', rules)).toBe(false);
  });

  it('handles complex scenario: allowlist + specific exclude', () => {
    const text = [
      '# Exclude everything',
      '**',
      '# Re-include projects',
      '!projects/',
      '# But exclude project templates',
      'projects/templates/',
    ].join('\n');
    const rules = parseFilterRules(text).rules;
    expect(isFileExcluded('notes/test.md', rules)).toBe(true);
    expect(isFileExcluded('projects/note.md', rules)).toBe(false);
    expect(isFileExcluded('projects/templates/tmpl.md', rules)).toBe(true);
  });
});

// ── Tests for every pattern from the "Pattern syntax reference" ─────────

describe('Reference: Syntax basics', () => {
  it('comments are ignored', () => {
    const result = parseFilterRules('# comment');
    expect(result.rules).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('blank lines are ignored', () => {
    const result = parseFilterRules('templates/\n\n\nnotes/');
    expect(result.rules).toHaveLength(2);
  });

  it('templates/ excludes files inside', () => {
    const rules = parseFilterRules('templates/').rules;
    expect(isFileExcluded('templates/note.md', rules)).toBe(true);
    expect(isFileExcluded('templates/sub/deep.md', rules)).toBe(true);
    expect(isFileExcluded('other/note.md', rules)).toBe(false);
  });

  it('!templates/keep.md re-includes after exclusion', () => {
    const rules = parseFilterRules('templates/\n!templates/keep.md').rules;
    expect(isFileExcluded('templates/keep.md', rules)).toBe(false);
    expect(isFileExcluded('templates/other.md', rules)).toBe(true);
  });

  it('last matching rule wins', () => {
    const rules = parseFilterRules('daily/\n!daily/\ndaily/').rules;
    expect(isFileExcluded('daily/note.md', rules)).toBe(true);
  });
});

describe('Reference: Exclude a folder', () => {
  it('templates/ excludes all files inside', () => {
    const rules = parseFilterRules('templates/').rules;
    expect(isFileExcluded('templates/note.md', rules)).toBe(true);
    expect(isFileExcluded('templates/sub/deep.md', rules)).toBe(true);
  });

  it('templates (no slash) has same effect', () => {
    const rules = parseFilterRules('templates').rules;
    expect(isFileExcluded('templates/note.md', rules)).toBe(true);
    expect(isFileExcluded('templates/sub/deep.md', rules)).toBe(true);
    expect(isFileExcluded('templates2/note.md', rules)).toBe(false);
  });

  it('projects/drafts/ excludes nested folder', () => {
    const rules = parseFilterRules('projects/drafts/').rules;
    expect(isFileExcluded('projects/drafts/note.md', rules)).toBe(true);
    expect(isFileExcluded('projects/drafts/sub/deep.md', rules)).toBe(true);
    expect(isFileExcluded('projects/active/note.md', rules)).toBe(false);
  });
});

describe('Reference: Re-include', () => {
  it('!templates/keep.md re-includes one file from excluded folder', () => {
    const rules = parseFilterRules('templates/\n!templates/keep.md').rules;
    expect(isFileExcluded('templates/keep.md', rules)).toBe(false);
    expect(isFileExcluded('templates/other.md', rules)).toBe(true);
    expect(isFileExcluded('templates/sub/deep.md', rules)).toBe(true);
  });
});

describe('Reference: Wildcards', () => {
  it('* matches any characters except /', () => {
    expect(matchesPathPattern('notes/test.md', 'notes/*.md')).toBe(true);
    expect(matchesPathPattern('notes/sub/test.md', 'notes/*.md')).toBe(false);
  });

  it('** matches any characters including / (crosses folders)', () => {
    expect(matchesPathPattern('notes/sub/deep/test.md', 'notes/**/*.md')).toBe(
      true,
    );
    expect(matchesPathPattern('notes/test.md', 'notes/**/*.md')).toBe(true);
  });

  it('? matches exactly one character', () => {
    expect(matchesPathPattern('notes/a.md', 'notes/?.md')).toBe(true);
    expect(matchesPathPattern('notes/ab.md', 'notes/?.md')).toBe(false);
  });
});

describe('Reference: Wildcard examples', () => {
  it('*.canvas.md matches at vault root only', () => {
    const rules = parseFilterRules('*.canvas.md').rules;
    expect(isFileExcluded('drawing.canvas.md', rules)).toBe(true);
    expect(isFileExcluded('notes/drawing.canvas.md', rules)).toBe(false);
  });

  it('**/*.canvas.md matches in any folder', () => {
    const rules = parseFilterRules('**/*.canvas.md').rules;
    expect(isFileExcluded('drawing.canvas.md', rules)).toBe(true);
    expect(isFileExcluded('notes/drawing.canvas.md', rules)).toBe(true);
    expect(isFileExcluded('a/b/c/drawing.canvas.md', rules)).toBe(true);
    expect(isFileExcluded('notes/normal.md', rules)).toBe(false);
  });

  it('daily/2024-*.md matches date-prefixed files', () => {
    const rules = parseFilterRules('daily/2024-*.md').rules;
    expect(isFileExcluded('daily/2024-01-01.md', rules)).toBe(true);
    expect(isFileExcluded('daily/2024-12-31.md', rules)).toBe(true);
    expect(isFileExcluded('daily/2025-01-01.md', rules)).toBe(false);
    expect(isFileExcluded('daily/note.md', rules)).toBe(false);
  });

  it('notes/??.md matches two-character filenames', () => {
    const rules = parseFilterRules('notes/??.md').rules;
    expect(isFileExcluded('notes/ab.md', rules)).toBe(true);
    expect(isFileExcluded('notes/xy.md', rules)).toBe(true);
    expect(isFileExcluded('notes/a.md', rules)).toBe(false);
    expect(isFileExcluded('notes/abc.md', rules)).toBe(false);
  });
});

describe('Reference: Specific files', () => {
  it('inbox/scratch.md excludes one exact file', () => {
    const rules = parseFilterRules('inbox/scratch.md').rules;
    expect(isFileExcluded('inbox/scratch.md', rules)).toBe(true);
    expect(isFileExcluded('inbox/other.md', rules)).toBe(false);
  });

  it('README.md excludes a file at vault root', () => {
    const rules = parseFilterRules('README.md').rules;
    expect(isFileExcluded('README.md', rules)).toBe(true);
    expect(isFileExcluded('notes/README.md', rules)).toBe(false);
  });
});

describe('Reference: Paths with spaces', () => {
  it('My Folder/My Notes/ matches folder with spaces', () => {
    const rules = parseFilterRules('My Folder/My Notes/').rules;
    expect(isFileExcluded('My Folder/My Notes/note.md', rules)).toBe(true);
    expect(isFileExcluded('My Folder/My Notes/sub/deep.md', rules)).toBe(true);
    expect(isFileExcluded('MyFolder/MyNotes/note.md', rules)).toBe(false);
  });

  it('Work in Progress/ matches folder with spaces', () => {
    const rules = parseFilterRules('Work in Progress/').rules;
    expect(isFileExcluded('Work in Progress/draft.md', rules)).toBe(true);
    expect(isFileExcluded('Work in Progress/sub/draft.md', rules)).toBe(true);
    expect(isFileExcluded('WorkinProgress/draft.md', rules)).toBe(false);
  });
});

describe('Reference: Non-Latin characters', () => {
  it('notes/Заметки/ matches Cyrillic folder name', () => {
    const rules = parseFilterRules('notes/Заметки/').rules;
    expect(isFileExcluded('notes/Заметки/файл.md', rules)).toBe(true);
    expect(isFileExcluded('notes/Заметки/sub/deep.md', rules)).toBe(true);
    expect(isFileExcluded('notes/other/file.md', rules)).toBe(false);
  });

  it('projects/日记/ matches Chinese characters', () => {
    const rules = parseFilterRules('projects/日记/').rules;
    expect(isFileExcluded('projects/日记/entry.md', rules)).toBe(true);
    expect(isFileExcluded('projects/other/entry.md', rules)).toBe(false);
  });

  it('Записки/черновики.md matches full non-Latin path', () => {
    const rules = parseFilterRules('Записки/черновики.md').rules;
    expect(isFileExcluded('Записки/черновики.md', rules)).toBe(true);
    expect(isFileExcluded('Записки/другой.md', rules)).toBe(false);
  });
});

describe('Reference: Obsidian-specific examples', () => {
  it('templates/ excludes template folder', () => {
    const rules = parseFilterRules('templates/').rules;
    expect(isFileExcluded('templates/my-template.md', rules)).toBe(true);
  });

  it('daily/ excludes daily notes folder', () => {
    const rules = parseFilterRules('daily/').rules;
    expect(isFileExcluded('daily/2024-01-01.md', rules)).toBe(true);
  });

  it('attachments/ excludes attachments folder', () => {
    const rules = parseFilterRules('attachments/').rules;
    expect(isFileExcluded('attachments/image-note.md', rules)).toBe(true);
  });

  it('**/*.canvas.md excludes all canvas files', () => {
    const rules = parseFilterRules('**/*.canvas.md').rules;
    expect(isFileExcluded('my-board.canvas.md', rules)).toBe(true);
    expect(isFileExcluded('projects/board.canvas.md', rules)).toBe(true);
    expect(isFileExcluded('projects/note.md', rules)).toBe(false);
  });

  it('**/*.excalidraw.md excludes all Excalidraw drawings', () => {
    const rules = parseFilterRules('**/*.excalidraw.md').rules;
    expect(isFileExcluded('drawing.excalidraw.md', rules)).toBe(true);
    expect(isFileExcluded('art/sketch.excalidraw.md', rules)).toBe(true);
    expect(isFileExcluded('art/sketch.md', rules)).toBe(false);
  });

  it('inbox/ excludes inbox folder', () => {
    const rules = parseFilterRules('inbox/').rules;
    expect(isFileExcluded('inbox/quick-note.md', rules)).toBe(true);
  });

  it('archive/ excludes archived notes', () => {
    const rules = parseFilterRules('archive/').rules;
    expect(isFileExcluded('archive/old-note.md', rules)).toBe(true);
    expect(isFileExcluded('archive/2023/note.md', rules)).toBe(true);
  });
});

describe('Reference: Allowlist mode', () => {
  it('** + !projects/ + !notes/ tracks only those folders', () => {
    const rules = parseFilterRules('**\n!projects/\n!notes/').rules;

    // Excluded (not in allowlist)
    expect(isFileExcluded('README.md', rules)).toBe(true);
    expect(isFileExcluded('inbox/note.md', rules)).toBe(true);
    expect(isFileExcluded('archive/old.md', rules)).toBe(true);
    expect(isFileExcluded('daily/2024-01-01.md', rules)).toBe(true);

    // Re-included (in allowlist)
    expect(isFileExcluded('projects/note.md', rules)).toBe(false);
    expect(isFileExcluded('projects/sub/deep.md', rules)).toBe(false);
    expect(isFileExcluded('notes/note.md', rules)).toBe(false);
    expect(isFileExcluded('notes/sub/deep.md', rules)).toBe(false);
  });
});

describe('Reference: Placeholder examples', () => {
  it('placeholder scenario: templates/ + daily/**/*.md + !daily/important.md', () => {
    const rules = parseFilterRules(
      'templates/\ndaily/**/*.md\n!daily/important.md',
    ).rules;

    expect(isFileExcluded('templates/tmpl.md', rules)).toBe(true);
    expect(isFileExcluded('daily/2024-01-01.md', rules)).toBe(true);
    expect(isFileExcluded('daily/sub/note.md', rules)).toBe(true);
    expect(isFileExcluded('daily/important.md', rules)).toBe(false);
    expect(isFileExcluded('notes/note.md', rules)).toBe(false);
  });
});

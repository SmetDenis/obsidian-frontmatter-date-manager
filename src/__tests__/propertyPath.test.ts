import { describe, it, expect } from 'vitest';
import {
  formatPropertyPath,
  hasDotWithoutNesting,
  isContainer,
  isGroup,
  parsePropertyPath,
  pathConflict,
  readPath,
  readTarget,
  removeNestedKeyLines,
  writePath,
  writeTarget,
} from '../propertyPath';

describe('parsePropertyPath', () => {
  it('a flat name is one trimmed segment, like the old .trim()', () => {
    expect(parsePropertyPath(' updated ')).toEqual({
      ok: true,
      segments: ['updated'],
    });
  });

  it('a dotted name stays one flat segment', () => {
    expect(parsePropertyPath('meta.updated')).toEqual({
      ok: true,
      segments: ['meta.updated'],
    });
  });

  it('splits on > and trims each level', () => {
    expect(parsePropertyPath('parent >meta>  viewed ')).toEqual({
      ok: true,
      segments: ['parent', 'meta', 'viewed'],
    });
  });

  it('keeps inner spaces of a level', () => {
    expect(parsePropertyPath('my group > last edit')).toEqual({
      ok: true,
      segments: ['my group', 'last edit'],
    });
  });

  it.each(['', '   ', undefined, 42])('rejects an empty name: %j', (name) => {
    expect(parsePropertyPath(name)).toEqual({ ok: false, reason: 'empty' });
  });

  it.each(['meta >> updated', '> updated', 'meta >', 'meta > > updated'])(
    'rejects an empty level: %s',
    (name) => {
      expect(parsePropertyPath(name)).toEqual({
        ok: false,
        reason: 'empty-segment',
      });
    },
  );
});

describe('formatPropertyPath / hasDotWithoutNesting', () => {
  it('formats levels with spaced separators', () => {
    expect(formatPropertyPath(['a', 'b', 'c'])).toBe('a > b > c');
  });

  it('flags a dot without nesting only', () => {
    expect(hasDotWithoutNesting('meta.updated')).toBe(true);
    expect(hasDotWithoutNesting('meta > updated')).toBe(false);
    expect(hasDotWithoutNesting('meta > app.version')).toBe(false);
    expect(hasDotWithoutNesting('updated')).toBe(false);
  });
});

describe('isGroup / isContainer', () => {
  it('only a plain object is a group', () => {
    expect(isGroup({})).toBe(true);
    expect(isGroup({ a: 1 })).toBe(true);
    expect(isGroup([])).toBe(false);
    expect(isGroup(null)).toBe(false);
    expect(isGroup('draft')).toBe(false);
    expect(isGroup(new Date())).toBe(false);
  });

  it('groups and lists are containers, scalars are not', () => {
    expect(isContainer({})).toBe(true);
    expect(isContainer([1])).toBe(true);
    expect(isContainer([])).toBe(true);
    expect(isContainer('x')).toBe(false);
    expect(isContainer(null)).toBe(false);
    expect(isContainer(0)).toBe(false);
  });
});

describe('readPath', () => {
  it('reads a flat key', () => {
    expect(readPath({ updated: 'x' }, ['updated'])).toEqual({
      kind: 'value',
      value: 'x',
    });
  });

  it('reads a nested key', () => {
    expect(
      readPath({ parent: { meta: { viewed: 'v' } } }, [
        'parent',
        'meta',
        'viewed',
      ]),
    ).toEqual({ kind: 'value', value: 'v' });
  });

  it('a dotted flat key is not the nested path', () => {
    const fm = { 'meta.updated': 'flat', 'meta': { updated: 'nested' } };
    expect(readPath(fm, ['meta.updated'])).toEqual({
      kind: 'value',
      value: 'flat',
    });
    expect(readPath(fm, ['meta', 'updated'])).toEqual({
      kind: 'value',
      value: 'nested',
    });
  });

  it('missing key, missing parent, empty parent and no frontmatter read as missing', () => {
    expect(readPath({ meta: {} }, ['meta', 'updated']).kind).toBe('missing');
    expect(readPath({}, ['meta', 'updated']).kind).toBe('missing');
    expect(readPath({ meta: null }, ['meta', 'updated']).kind).toBe('missing');
    expect(readPath(undefined, ['updated']).kind).toBe('missing');
  });

  it.each([
    ['text', 'draft'],
    ['number', 3],
    ['boolean', true],
    ['empty string', ''],
    ['list', ['a']],
    ['empty list', []],
  ])('a %s parent blocks the path', (_label, parentValue) => {
    expect(readPath({ meta: parentValue }, ['meta', 'updated'])).toEqual({
      kind: 'blocked',
      reason: 'parent-not-group',
      parent: 'meta',
    });
  });

  it('names the blocking parent at depth', () => {
    expect(
      readPath({ parent: { meta: 'x' } }, ['parent', 'meta', 'viewed']),
    ).toEqual({
      kind: 'blocked',
      reason: 'parent-not-group',
      parent: 'parent > meta',
    });
  });
});

describe('writePath', () => {
  it('writes a flat key in place, keeping order', () => {
    const fm: Record<string, unknown> = { a: 1, updated: 'old', b: 2 };
    expect(writePath(fm, ['updated'], 'new')).toEqual({ kind: 'written' });
    expect(Object.keys(fm)).toEqual(['a', 'updated', 'b']);
    expect(fm.updated).toBe('new');
  });

  it('creates a missing group at the end of the frontmatter', () => {
    const fm: Record<string, unknown> = { title: 't', created: 'c' };
    writePath(fm, ['meta', 'updated'], 'u');
    expect(Object.keys(fm)).toEqual(['title', 'created', 'meta']);
    expect(fm.meta).toEqual({ updated: 'u' });
  });

  it('appends to an existing group, other keys and their order survive', () => {
    const fm: Record<string, unknown> = {
      meta: { source: 'web', tags: ['a'] },
    };
    writePath(fm, ['meta', 'updated'], 'u');
    expect(Object.keys(fm.meta as object)).toEqual([
      'source',
      'tags',
      'updated',
    ]);
    expect(fm.meta).toEqual({ source: 'web', tags: ['a'], updated: 'u' });
  });

  it('creates groups at any depth', () => {
    const fm: Record<string, unknown> = {};
    writePath(fm, ['parent', 'meta', 'viewed'], 'v');
    expect(fm).toEqual({ parent: { meta: { viewed: 'v' } } });
  });

  it('turns an empty parent into a group in place', () => {
    const fm: Record<string, unknown> = { a: 1, meta: null, b: 2 };
    expect(writePath(fm, ['meta', 'updated'], 'u')).toEqual({
      kind: 'written',
    });
    expect(Object.keys(fm)).toEqual(['a', 'meta', 'b']);
    expect(fm.meta).toEqual({ updated: 'u' });
  });

  it.each([
    ['text', 'draft'],
    ['number', 3],
    ['empty string', ''],
    ['list', ['a']],
    ['empty list', []],
  ])('refuses a %s parent and mutates nothing', (_label, parentValue) => {
    const fm: Record<string, unknown> = { meta: parentValue };
    const before = JSON.stringify(fm);
    expect(writePath(fm, ['meta', 'updated'], 'u')).toEqual({
      kind: 'blocked',
      reason: 'parent-not-group',
      parent: 'meta',
    });
    expect(JSON.stringify(fm)).toBe(before);
  });

  it('a refusal deep in the path never leaves a half-built group', () => {
    const fm: Record<string, unknown> = { parent: { meta: 'x' } };
    writePath(fm, ['parent', 'meta', 'viewed'], 'v');
    expect(fm).toEqual({ parent: { meta: 'x' } });
  });

  it.each([
    ['group', { a: 1 }],
    ['list', ['2024-01-01', '2024-02-01']],
    ['empty list', []],
  ])('never replaces a %s at the target', (_label, existing) => {
    const fm: Record<string, unknown> = { updated: existing };
    expect(writePath(fm, ['updated'], 'u')).toEqual({
      kind: 'holds-container',
    });
    expect(fm.updated).toEqual(existing);
  });

  it('overwrites an empty or scalar target', () => {
    const fm: Record<string, unknown> = { updated: null, created: '' };
    writePath(fm, ['updated'], 'u');
    writePath(fm, ['created'], 'c');
    expect(fm).toEqual({ updated: 'u', created: 'c' });
  });
});

describe('pathConflict', () => {
  it('detects equal and prefix paths', () => {
    expect(pathConflict(['updated'], ['updated'])).toBe('equal');
    expect(pathConflict(['meta'], ['meta', 'updated'])).toBe('prefix');
    expect(pathConflict(['meta', 'updated'], ['meta'])).toBe('prefix');
    expect(pathConflict(['meta', 'updated'], ['meta', 'viewed'])).toBeNull();
    expect(pathConflict(['meta.updated'], ['meta', 'updated'])).toBeNull();
  });
});

describe('removeNestedKeyLines', () => {
  const block = [
    'title: Test',
    'meta:',
    '  updated: 2024-01-01T00:00:00',
    '  source: web',
    '  tags:',
    '    - a',
    '    - b',
    'meta.updated: 2024-02-02',
    'created: 2023-01-01',
  ].join('\n');

  it('returns the input untouched without paths', () => {
    expect(removeNestedKeyLines(block, [])).toBe(block);
  });

  it('drops only the excluded nested key; siblings and the dotted flat key stay', () => {
    expect(removeNestedKeyLines(block, [['meta', 'updated']])).toBe(
      [
        'title: Test',
        'meta:',
        '  source: web',
        '  tags:',
        '    - a',
        '    - b',
        'meta.updated: 2024-02-02',
        'created: 2023-01-01',
      ].join('\n'),
    );
  });

  it('drops a nested key with its deeper lines', () => {
    expect(removeNestedKeyLines(block, [['meta', 'tags']])).toBe(
      [
        'title: Test',
        'meta:',
        '  updated: 2024-01-01T00:00:00',
        '  source: web',
        'meta.updated: 2024-02-02',
        'created: 2023-01-01',
      ].join('\n'),
    );
  });

  it('handles depth and several paths', () => {
    const deep = [
      'parent:',
      '  meta:',
      '    viewed: 2024-01-01',
      '    keep: 1',
      '  other: 2',
      'meta:',
      '  updated: 2024-01-02',
    ].join('\n');
    expect(
      removeNestedKeyLines(deep, [
        ['parent', 'meta', 'viewed'],
        ['meta', 'updated'],
      ]),
    ).toBe(['parent:', '  meta:', '    keep: 1', '  other: 2'].join('\n'));
  });

  it('a key inside a list item never matches a group path', () => {
    const listForm = ['meta:', '  - updated: 2024-01-01', '    other: 1'].join(
      '\n',
    );
    expect(
      removeNestedKeyLines(listForm, [
        ['meta', 'updated'],
        ['meta', 'other'],
      ]),
    ).toBe(listForm);
  });

  it('text inside a block scalar is never read as a key', () => {
    const scalar = [
      'meta:',
      '  note: |',
      '    updated: not a key',
      '  updated: 2024-01-01',
    ].join('\n');
    expect(removeNestedKeyLines(scalar, [['meta', 'updated']])).toBe(
      ['meta:', '  note: |', '    updated: not a key'].join('\n'),
    );
  });

  it('an inline group is left in place (documented residual)', () => {
    const inline = 'meta: {updated: 2024-01-01, x: 1}';
    expect(removeNestedKeyLines(inline, [['meta', 'updated']])).toBe(inline);
  });

  it('the output does not depend on whether the excluded key comes last', () => {
    const last = 'meta:\n  source: web\n  updated: x\n';
    const first = 'meta:\n  updated: x\n  source: web\n';
    const absent = 'meta:\n  source: web\n';
    const paths = [['meta', 'updated']];
    expect(removeNestedKeyLines(last, paths)).toBe(absent);
    expect(removeNestedKeyLines(first, paths)).toBe(absent);
  });

  it('blank lines inside a dropped block go with it', () => {
    expect(
      removeNestedKeyLines('meta:\n  updated: |\n    a\n\n    b\n  keep: 1', [
        ['meta', 'updated'],
      ]),
    ).toBe('meta:\n  keep: 1');
  });

  it('normalizes CRLF to LF', () => {
    expect(
      removeNestedKeyLines('meta:\r\n  updated: x\r\n  keep: y', [
        ['meta', 'updated'],
      ]),
    ).toBe('meta:\n  keep: y');
  });
});

describe('own properties only (configured names are outside input)', () => {
  it('`__proto__ > updated` writes into the note, never into Object.prototype', () => {
    const fm: Record<string, unknown> = { title: 'x' };
    expect(writePath(fm, ['__proto__', 'updated'], 'd')).toEqual({
      kind: 'written',
    });
    expect(Object.getPrototypeOf(fm)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(fm, '__proto__')).toBe(true);
    expect(({} as Record<string, unknown>).updated).toBeUndefined();
    expect(readPath(fm, ['__proto__', 'updated'])).toEqual({
      kind: 'value',
      value: 'd',
    });
  });

  it('a flat `__proto__` name is an own key too', () => {
    const fm: Record<string, unknown> = {};
    writePath(fm, ['__proto__'], 'd');
    expect(Object.getPrototypeOf(fm)).toBe(Object.prototype);
    expect(readPath(fm, ['__proto__'])).toEqual({ kind: 'value', value: 'd' });
  });

  it('inherited members are not stored values', () => {
    expect(readPath({}, ['constructor']).kind).toBe('missing');
    expect(readPath({}, ['toString']).kind).toBe('missing');
    expect(readPath({}, ['__proto__', 'updated']).kind).toBe('missing');
  });
});

describe('groups shared through YAML references', () => {
  it('refuses to write into a group another property refers to', () => {
    const base: Record<string, unknown> = { source: 'web' };
    const fm: Record<string, unknown> = { base, meta: base };
    expect(writePath(fm, ['meta', 'updated'], 'u')).toEqual({
      kind: 'blocked',
      reason: 'shared-group',
      parent: 'meta',
    });
    expect(base).toEqual({ source: 'web' });
    expect(readPath(fm, ['base', 'updated'])).toEqual({
      kind: 'blocked',
      reason: 'shared-group',
      parent: 'base',
    });
  });

  it('a shared group deeper in the path blocks it as well', () => {
    const inner: Record<string, unknown> = {};
    const fm: Record<string, unknown> = {
      parent: { meta: inner },
      other: inner,
    };
    expect(writePath(fm, ['parent', 'meta', 'viewed'], 'v')).toEqual({
      kind: 'blocked',
      reason: 'shared-group',
      parent: 'parent > meta',
    });
  });

  it('shared objects elsewhere do not block an unrelated path', () => {
    const list = ['a'];
    const fm: Record<string, unknown> = { tags: list, more: list, meta: {} };
    expect(writePath(fm, ['meta', 'updated'], 'u')).toEqual({
      kind: 'written',
    });
  });
});

describe('readTarget / writeTarget', () => {
  const target = (name: string, path: string[] | null, invalid = false) => ({
    name,
    path,
    invalid,
  });

  it('an invalid target reads as an invalid-name skip, a blank one as nothing', () => {
    expect(readTarget({}, target('meta >', null, true))).toEqual({
      value: undefined,
      skip: { name: 'meta >', reason: 'invalid-name' },
    });
    expect(readTarget({}, target('', null))).toEqual({
      value: undefined,
      skip: null,
    });
  });

  it('reads a value, or the reason it cannot be written', () => {
    expect(readTarget({ a: { b: 1 } }, target('a > b', ['a', 'b']))).toEqual({
      value: 1,
      skip: null,
    });
    expect(readTarget({ a: [1] }, target('a', ['a']))).toEqual({
      value: undefined,
      skip: { name: 'a', reason: 'holds-container' },
    });
  });

  it('writes, refuses with a reason, or does nothing without a path', () => {
    const fm: Record<string, unknown> = { meta: 'draft' };
    expect(writeTarget(fm, target('x', ['x']), 1)).toEqual({
      written: true,
      skip: null,
    });
    expect(writeTarget(fm, target('meta > u', ['meta', 'u']), 1)).toEqual({
      written: false,
      skip: { name: 'meta > u', reason: 'parent-not-group', parent: 'meta' },
    });
    expect(writeTarget(fm, target('', null), 1)).toEqual({
      written: false,
      skip: null,
    });
  });
});

describe('removeNestedKeyLines - review cases', () => {
  const paths = [['meta', 'lastSync']];

  it("drops list items written at the excluded key's own indent", () => {
    expect(
      removeNestedKeyLines(
        'meta:\n  lastSync:\n  - a\n  - b\n  keep: 1',
        paths,
      ),
    ).toBe('meta:\n  keep: 1');
  });

  it('a comment between the excluded key and its list items does not end the drop', () => {
    expect(
      removeNestedKeyLines(
        'meta:\n  lastSync:\n  # synced by another device\n  - a\n  keep: 1',
        paths,
      ),
    ).toBe('meta:\n  keep: 1');
    // A comment after the dropped block is kept, as before.
    expect(
      removeNestedKeyLines('meta:\n  lastSync: x\n  # note\n  keep: 1', paths),
    ).toBe('meta:\n  # note\n  keep: 1');
  });

  it('a tag together with an anchor still opens a group', () => {
    expect(
      removeNestedKeyLines(
        'meta: !!map &dates\n  lastSync: x\n  keep: 1',
        paths,
      ),
    ).toBe('meta: !!map &dates\n  keep: 1');
    expect(
      removeNestedKeyLines(
        'meta: &dates !!map\n  lastSync: x\n  keep: 1',
        paths,
      ),
    ).toBe('meta: &dates !!map\n  keep: 1');
  });

  it('never reads the continuation of a quoted value as a key', () => {
    const quoted = 'meta: "draft\n  lastSync: one\n  end"';
    expect(removeNestedKeyLines(quoted, paths)).toBe(quoted);
  });

  it('a group left with only excluded keys goes too, so a first write keeps the hash', () => {
    expect(removeNestedKeyLines('title: t\nmeta:\n  lastSync: x', paths)).toBe(
      'title: t',
    );
    expect(
      removeNestedKeyLines('parent:\n  meta:\n    viewed: v\ntitle: t', [
        ['parent', 'meta', 'viewed'],
      ]),
    ).toBe('title: t');
  });

  it('keeps a group that still has content, and an empty group nobody touched', () => {
    expect(
      removeNestedKeyLines('meta:\n  lastSync: x\n  source: web', paths),
    ).toBe('meta:\n  source: web');
    expect(removeNestedKeyLines('meta:\ntitle: t', paths)).toBe(
      'meta:\ntitle: t',
    );
  });
});

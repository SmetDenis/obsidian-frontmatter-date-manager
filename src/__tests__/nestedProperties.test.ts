import { describe, it, expect, vi } from 'vitest';
import { TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS, FrontmatterDateManagerSettings } from '../Settings';
import { strings } from '../i18n';

// Nested property paths through the real handleFileChange / handleFileOpen /
// computeFrontmatterUpdates, with a mocked Obsidian app. The write callback
// runs against a deep copy of `live` (the on-disk frontmatter), which defaults
// to the cached frontmatter - tests that need the cache to lag pass both.

const T = new Date('2026-06-14T12:00:00Z').getTime();

function createTFile(path = 'notes/test.md'): TFile {
  const f = new TFile();
  f.path = path;
  f.name = path.split('/').pop() ?? '';
  f.extension = 'md';
  f.basename = f.name.replace(/\.md$/, '');
  f.stat = { ctime: T - 86_400_000, mtime: T - 1000, size: 50 };
  return f;
}

function setup(
  settings: Partial<FrontmatterDateManagerSettings>,
  cached: Record<string, unknown>,
  live: Record<string, unknown> = cached,
) {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = {
    ...DEFAULT_SETTINGS,
    enableAutoUpdate: true,
    enableContentHashCheck: false,
    timezone: 'UTC',
    ...settings,
  };
  plugin.recompileFilterRules();
  const writes: Record<string, unknown>[] = [];
  const processFrontMatter = vi.fn(
    (_file: TFile, cb: (fm: Record<string, unknown>) => void) => {
      const fm = structuredClone(live);
      cb(fm);
      writes.push(fm);
      return Promise.resolve();
    },
  );
  plugin.app = {
    vault: {
      read: vi.fn().mockResolvedValue('---\nx: 1\n---\nbody'),
      cachedRead: vi.fn().mockResolvedValue(''),
    },
    fileManager: { processFrontMatter },
    metadataCache: { getFileCache: () => ({ frontmatter: cached }) },
    workspace: { getLeavesOfType: () => [] },
  } as unknown as FrontmatterDateManagerPlugin['app'];
  (
    plugin as unknown as { populateCacheForFile: () => Promise<void> }
  ).populateCacheForFile = vi.fn().mockResolvedValue(undefined);
  const notices: string[] = [];
  plugin._noticeFactory = (m) => {
    notices.push(m);
  };
  return { plugin, processFrontMatter, writes, notices, file: createTFile() };
}

const OLD = '2020-01-01T00:00:00';

describe('nested property paths in the automatic pipeline', () => {
  it('creates a missing group at the end and writes the date inside it', async () => {
    const { plugin, writes, file } = setup(
      { headerUpdated: 'meta > updated' },
      { title: 't', created: OLD },
    );
    const result = await plugin.handleFileChange(file);
    expect(result).toEqual({ status: 'ok', wrote: true });
    expect(Object.keys(writes[0]!)).toEqual(['title', 'created', 'meta']);
    expect((writes[0]!.meta as Record<string, unknown>).updated).toMatch(
      /^2026-06-14T/,
    );
  });

  it('appends to an existing group, keeping its other keys and their order', async () => {
    const { plugin, writes, file } = setup(
      { headerUpdated: 'meta > updated' },
      { created: OLD, meta: { source: 'web', tags: ['a'] } },
    );
    await plugin.handleFileChange(file);
    const meta = writes[0]!.meta as Record<string, unknown>;
    expect(Object.keys(meta)).toEqual(['source', 'tags', 'updated']);
    expect(meta.source).toBe('web');
    expect(meta.tags).toEqual(['a']);
  });

  it('mixes flat and deep names in one write', async () => {
    const { plugin, writes, file } = setup(
      { headerCreated: 'created', headerUpdated: 'parent > meta > updated' },
      {},
    );
    await plugin.handleFileChange(file);
    expect(writes[0]!.created).toMatch(/^2026-06-13T/);
    expect(
      (
        (writes[0]!.parent as Record<string, unknown>).meta as Record<
          string,
          unknown
        >
      ).updated,
    ).toMatch(/^2026-06-14T/);
  });

  it('an empty parent (meta:) becomes a group', async () => {
    const { plugin, writes, file } = setup(
      { headerUpdated: 'meta > updated' },
      { created: OLD, meta: null },
    );
    await plugin.handleFileChange(file);
    expect(writes[0]!.meta).toEqual({
      updated: expect.stringMatching(/^2026/),
    });
  });

  it('reads an existing nested value: a fresh one is kept (no write)', async () => {
    const { plugin, processFrontMatter, file } = setup(
      { headerUpdated: 'meta > updated' },
      { created: OLD, meta: { updated: '2026-06-14T11:59:59' } },
    );
    const result = await plugin.handleFileChange(file);
    expect(processFrontMatter).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'ok', wrote: false });
  });

  describe('a parent that is not a group', () => {
    it('skips only that key, writes the others, and tells the user once', async () => {
      const { plugin, writes, notices, file } = setup(
        { headerCreated: 'created', headerUpdated: 'meta > updated' },
        { meta: 'draft' },
      );
      const result = await plugin.handleFileChange(file);
      expect(result).toEqual({
        status: 'ok',
        wrote: true,
        skipped: [
          {
            name: 'meta > updated',
            reason: 'parent-not-group',
            parent: 'meta',
          },
        ],
      });
      expect(writes[0]!.meta).toBe('draft');
      expect(writes[0]!.created).toMatch(/^2026/);
      expect(notices).toHaveLength(1);
      expect(notices[0]).toContain('notes/test.md');
      expect(notices[0]).toContain('"meta"');

      await plugin.handleFileChange(file);
      expect(notices).toHaveLength(1);
    });

    it('writes nothing at all when every key is blocked', async () => {
      const { plugin, processFrontMatter, file } = setup(
        { headerCreated: 'meta > created', headerUpdated: 'meta > updated' },
        { meta: ['a'] },
      );
      const result = await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(result.status === 'ok' && result.wrote).toBe(false);
      expect(result.status === 'ok' && result.skipped).toHaveLength(2);
    });

    it('the manual command reports the skip but never shows the session notice', async () => {
      const { plugin, notices, file } = setup(
        { headerUpdated: 'meta > updated' },
        { created: OLD, meta: 3 },
      );
      const result = await plugin.handleFileChange(file, 'manual');
      expect(result.status === 'ok' && result.skipped).toHaveLength(1);
      expect(notices).toHaveLength(0);
    });

    it('the counter is not written when the date it rides on is skipped', async () => {
      const { plugin, processFrontMatter, file } = setup(
        {
          headerUpdated: 'meta > updated',
          countUpdatesEnabled: true,
          headerUpdateCount: 'edits',
        },
        { created: OLD, meta: 'draft', edits: 4 },
      );
      await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('the out-of-order fix needs both dates writable', async () => {
      const { plugin, processFrontMatter, file } = setup(
        {
          headerCreated: 'meta > created',
          headerUpdated: 'updated',
          inversionFixStrategy: 'max-all',
        },
        { meta: 'draft', updated: '2026-06-14T11:59:59' },
      );
      const result = await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(result.status === 'ok' && result.wrote).toBe(false);
    });
  });

  describe('a group or list in the value place is never replaced', () => {
    it.each([
      ['list at a flat name', 'updated', { updated: ['2024-01-01'] }],
      ['group at a flat name', 'updated', { updated: { a: 1 } }],
      ['group at a nested name', 'meta > updated', { meta: { updated: {} } }],
    ])('%s', async (_label, name, fm) => {
      const { plugin, processFrontMatter, file } = setup(
        { headerUpdated: name },
        { created: OLD, ...fm },
      );
      const result = await plugin.handleFileChange(file, 'manual');
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(result.status === 'ok' && result.skipped?.[0]?.reason).toBe(
        'holds-container',
      );
    });

    it('a list at the counter is left alone while the date is written', async () => {
      const { plugin, writes, file } = setup(
        {
          countUpdatesEnabled: true,
          headerUpdateCount: 'meta > edits',
        },
        { created: OLD, meta: { edits: [1, 2] } },
      );
      const result = await plugin.handleFileChange(file);
      expect(writes[0]!.updated).toMatch(/^2026/);
      expect((writes[0]!.meta as Record<string, unknown>).edits).toEqual([
        1, 2,
      ]);
      expect(result.status === 'ok' && result.skipped?.[0]?.name).toBe(
        'meta > edits',
      );
    });
  });

  it('the counter in a nested group increments as a number', async () => {
    const { plugin, writes, file } = setup(
      { countUpdatesEnabled: true, headerUpdateCount: 'meta > edits' },
      { created: OLD, meta: { edits: 4 } },
    );
    await plugin.handleFileChange(file);
    expect((writes[0]!.meta as Record<string, unknown>).edits).toBe(5);
  });

  it('a counter nested inside a date name is refused at the write boundary', async () => {
    const { plugin, writes, file } = setup(
      {
        headerUpdated: 'meta',
        countUpdatesEnabled: true,
        headerUpdateCount: 'meta > edits',
      },
      { created: OLD },
    );
    await plugin.handleFileChange(file);
    expect(typeof writes[0]!.meta).toBe('string');
  });

  it('two date names where one is inside the other: the longer one is dropped', async () => {
    const { plugin, writes, file } = setup(
      { headerCreated: 'meta', headerUpdated: 'meta > updated' },
      {},
    );
    await plugin.handleFileChange(file);
    expect(typeof writes[0]!.meta).toBe('string');
  });

  it('the live frontmatter wins over a stale cache', async () => {
    const { plugin, writes, file } = setup(
      { headerCreated: 'created', headerUpdated: 'meta > updated' },
      {},
      { meta: 'draft' },
    );
    const result = await plugin.handleFileChange(file, 'manual');
    expect(writes[0]!.meta).toBe('draft');
    expect(result).toEqual({
      status: 'ok',
      wrote: true,
      skipped: [
        { name: 'meta > updated', reason: 'parent-not-group', parent: 'meta' },
      ],
    });
  });

  it('wrote is false when the live frontmatter refuses every write', async () => {
    const { plugin, file } = setup(
      { headerUpdated: 'meta > updated' },
      { created: OLD },
      { created: OLD, meta: 'draft' },
    );
    const result = await plugin.handleFileChange(file, 'manual');
    expect(result.status === 'ok' && result.wrote).toBe(false);
  });

  describe('invalid names from the settings file', () => {
    it('both dates invalid: the pass is ignored with its own reason', async () => {
      const { plugin, processFrontMatter, file } = setup(
        { headerCreated: 'meta >', headerUpdated: '> updated' },
        {},
      );
      const result = await plugin.handleFileChange(file);
      expect(result).toEqual({
        status: 'ignored',
        reason: 'invalid-property-name',
      });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('one invalid: the other is written and the manual command names the invalid one', async () => {
      const { plugin, writes, notices, file } = setup(
        { headerCreated: 'created', headerUpdated: 'meta >> updated' },
        {},
      );
      const result = await plugin.handleFileChange(file, 'manual');
      expect(writes[0]!.created).toMatch(/^2026/);
      expect(Object.keys(writes[0]!)).toEqual(['created']);
      expect(result.status === 'ok' && result.skipped).toEqual([
        { name: 'meta >> updated', reason: 'invalid-name' },
      ]);
      expect(notices).toHaveLength(0);
    });

    it('an invalid name stays silent in automatic mode', async () => {
      const { plugin, notices, file } = setup(
        { headerCreated: 'created', headerUpdated: 'meta >' },
        {},
      );
      await plugin.handleFileChange(file);
      expect(notices).toHaveLength(0);
    });
  });
});

describe('nested property paths for the last-opened date', () => {
  function openSetup(
    cached: Record<string, unknown>,
    live: Record<string, unknown> = cached,
  ) {
    const s = setup(
      { enableLastViewed: true, headerLastViewed: 'parent > meta > viewed' },
      cached,
      live,
    );
    const open = (f: TFile) =>
      (
        s.plugin as unknown as { handleFileOpen(f: TFile): Promise<void> }
      ).handleFileOpen(f);
    return { ...s, open };
  }

  it('writes the stamp into nested groups', async () => {
    const { writes, file, open } = openSetup({ title: 't' });
    await open(file);
    const parent = writes[0]!.parent as Record<string, unknown>;
    expect((parent.meta as Record<string, unknown>).viewed).toMatch(/^\d{4}-/);
    expect(Object.keys(writes[0]!)).toEqual(['title', 'parent']);
  });

  it('a blocked path writes nothing and tells the user once', async () => {
    const { processFrontMatter, notices, file, open } = openSetup({
      parent: { meta: 'x' },
    });
    await open(file);
    await open(file);
    expect(processFrontMatter).not.toHaveBeenCalled();
    expect(notices).toHaveLength(1);
    expect(notices[0]).toContain('parent > meta');
  });

  it('a stale cache: the live refusal is reported and the file is never re-serialized', async () => {
    const { plugin, processFrontMatter, writes, notices, file, open } =
      openSetup({}, { parent: 'text' });
    await open(file);
    expect(processFrontMatter).toHaveBeenCalledTimes(1);
    // The callback threw before Obsidian could re-serialize: nothing written.
    expect(writes).toHaveLength(0);
    expect(plugin.lastPluginWriteMtime.has(file.path)).toBe(false);
    expect(notices).toHaveLength(1);
  });
});

describe('manual command notice text', () => {
  it('uses the shared skip messages', () => {
    expect(strings.notices.skippedParentNotGroup).toContain('{parent}');
    expect(strings.notices.skippedHoldsContainer).toContain('{name}');
    expect(strings.notices.skippedInvalidName).toContain('{name}');
  });
});

describe('review fixes in the automatic pipeline', () => {
  it('a live refusal of every value never re-serializes the note and records no self-write', async () => {
    const { plugin, processFrontMatter, writes, file } = setup(
      { headerUpdated: 'meta > updated' },
      { created: OLD },
      { created: OLD, meta: 'draft' },
    );
    const result = await plugin.handleFileChange(file, 'manual');
    expect(processFrontMatter).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(0);
    expect(plugin.lastPluginWriteMtime.has(file.path)).toBe(false);
    expect(result).toEqual({
      status: 'ok',
      wrote: false,
      skipped: [
        { name: 'meta > updated', reason: 'parent-not-group', parent: 'meta' },
      ],
    });
  });

  it('a group shared through a YAML reference is never written into', async () => {
    const base = { source: 'web' };
    const { plugin, processFrontMatter, file } = setup(
      { headerUpdated: 'meta > updated' },
      { created: OLD, base, meta: base },
    );
    const result = await plugin.handleFileChange(file, 'manual');
    expect(processFrontMatter).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'ok',
      wrote: false,
      skipped: [
        { name: 'meta > updated', reason: 'shared-group', parent: 'meta' },
      ],
    });
  });

  it('the out-of-order fix is dropped, and not announced, when the live frontmatter refuses one date', async () => {
    const { plugin, writes, notices, file } = setup(
      {
        headerCreated: 'meta > created',
        headerUpdated: 'updated',
        inversionFixStrategy: 'max-all',
      },
      { meta: { created: '2030-01-01T00:00:00' }, updated: OLD },
      { meta: 'draft', updated: OLD },
    );
    const result = await plugin.handleFileChange(file);
    // The ordinary `updated` stamp is still written; `created` is left alone.
    expect(writes[0]!.meta).toBe('draft');
    expect(writes[0]!.updated).toMatch(/^2026-06-14T/);
    expect(result.status === 'ok' && result.wrote).toBe(true);
    expect(
      notices.some((n) => n === strings.notices.inversionDetectedAndFixed),
    ).toBe(false);
  });

  it('a dropped out-of-order fix still reports the refusal, never "already up to date"', async () => {
    // `updated` already equals what an ordinary pass would write, so the fix
    // was the only change - and the live frontmatter refuses one of its dates.
    const { plugin, processFrontMatter, writes, file } = setup(
      {
        headerCreated: 'meta > created',
        headerUpdated: 'updated',
        inversionFixStrategy: 'max-all',
      },
      {
        meta: { created: '2030-01-01T00:00:00' },
        updated: '2026-06-14T11:59:59',
      },
      { meta: 'draft', updated: '2026-06-14T11:59:59' },
    );
    const result = await plugin.handleFileChange(file, 'manual');
    expect(processFrontMatter).toHaveBeenCalledTimes(1);
    expect(writes).toHaveLength(0);
    expect(result).toEqual({
      status: 'ok',
      wrote: false,
      skipped: [
        { name: 'meta > created', reason: 'parent-not-group', parent: 'meta' },
      ],
    });
  });

  it('an enabled counter with an invalid name is reported by the manual command', async () => {
    const { plugin, writes, file } = setup(
      { countUpdatesEnabled: true, headerUpdateCount: 'meta >' },
      { created: OLD },
    );
    const result = await plugin.handleFileChange(file, 'manual');
    expect(writes[0]!.updated).toMatch(/^2026/);
    expect(result.status === 'ok' && result.skipped).toEqual([
      { name: 'meta >', reason: 'invalid-name' },
    ]);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as obsidian from 'obsidian';
import { TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS, FrontmatterDateManagerSettings } from '../Settings';

// Direct unit coverage for `handleFileChange` - the core auto-stamping entry
// point. It wires together three data-safety-critical guards (self-trigger
// suppression, malformed-YAML handling, rate-limit retry) that previously had
// no unit coverage (only manual e2e, which is not in CI). Tests drive the REAL
// computeFrontmatterUpdates + shouldFileBeIgnored through a mocked Obsidian app.

const T = new Date('2026-06-14T12:00:00Z').getTime();

function createTFile(path = 'notes/test.md'): TFile {
  const f = new TFile();
  f.path = path;
  const name = path.split('/').pop() ?? '';
  f.name = name;
  f.extension = name.split('.').pop() ?? '';
  f.basename = name.replace(/\.[^.]+$/, '');
  f.stat = { ctime: T - 86_400_000, mtime: T - 1000, size: 50 };
  return f;
}

interface SetupOpts {
  settings?: Partial<FrontmatterDateManagerSettings>;
  frontmatter?: Record<string, unknown>;
  fileContent?: string;
  processFrontMatterImpl?: (
    file: TFile,
    cb: (fm: Record<string, unknown>) => void,
  ) => Promise<void>;
}

function setup(opts: SetupOpts = {}) {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = {
    ...DEFAULT_SETTINGS,
    enableAutoUpdate: true,
    // Take the content-hash branch out of the picture: these tests exercise the
    // write-vs-defer branching, not change detection. shouldFileBeIgnored then
    // only does the path/empty checks and returns { ignored: false }.
    enableContentHashCheck: false,
    ...opts.settings,
  };
  plugin.recompileFilterRules();

  const file = createTFile();
  const frontmatter = opts.frontmatter ?? {};

  // Capture every frontmatter object the plugin mutates, so tests can assert
  // exactly which keys were written.
  const writes: Record<string, unknown>[] = [];
  const defaultImpl = (
    _file: TFile,
    cb: (fm: Record<string, unknown>) => void,
  ) => {
    const fm = { ...frontmatter };
    cb(fm);
    writes.push(fm);
    return Promise.resolve();
  };
  const processFrontMatter = vi.fn(opts.processFrontMatterImpl ?? defaultImpl);

  plugin.app = {
    vault: {
      read: vi
        .fn()
        .mockResolvedValue(opts.fileContent ?? '---\nx: 1\n---\nbody'),
    },
    fileManager: { processFrontMatter },
    metadataCache: { getFileCache: () => ({ frontmatter }) },
  } as unknown as FrontmatterDateManagerPlugin['app'];

  // Avoid real hash-cache I/O; these tests do not assert cache contents.
  (
    plugin as unknown as { populateCacheForFile: () => Promise<void> }
  ).populateCacheForFile = vi.fn().mockResolvedValue(undefined);

  const timers = (plugin as unknown as { modifyTimers: Map<string, unknown> })
    .modifyTimers;
  const lastWrite = (
    plugin as unknown as { lastPluginWriteMtime: Map<string, number> }
  ).lastPluginWriteMtime;

  return { plugin, processFrontMatter, file, writes, timers, lastWrite };
}

describe('handleFileChange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rate-limited updated alongside a missing created (variant E)', () => {
    // Bug: when `created` is missing (createdValue set) AND `updated` is present
    // and rate-limited (retryAfterMs set), the old write branch wrote `created`,
    // silently dropped retryAfterMs, and refreshed the hash - permanently losing
    // the `updated` bump for that edit. The fix defers the whole update (incl. the
    // non-urgent created fill) to the proven retry path instead of writing now.
    function bugSetup() {
      return setup({
        settings: { minSecondsBetweenSaves: 30 },
        // created absent -> createdValue set; updated present & fresh -> rate-limited.
        frontmatter: { updated: T - 5000 },
      });
    }

    it('defers the write instead of stamping created and dropping the updated retry', async () => {
      const { plugin, processFrontMatter, file, timers } = bugSetup();

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok' });
      // Nothing is written now - the rate-limited update is not partially applied.
      expect(processFrontMatter).not.toHaveBeenCalled();
      // A retry is scheduled so the deferred update lands once the limit expires.
      expect(timers.has(file.path)).toBe(true);
    });

    it('writes both created and updated in one pass once the limit expires', async () => {
      const { plugin, processFrontMatter, file, writes } = bugSetup();

      await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();

      // Rate limit (30s) elapses; the scheduled retry fires.
      await vi.advanceTimersByTimeAsync(31_000);

      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes).toHaveLength(1);
      expect(writes[0]).toHaveProperty('created');
      expect(writes[0]).toHaveProperty('updated');
    });
  });

  describe('regressions the fix must preserve', () => {
    it('still writes immediately when nothing is rate-limited', async () => {
      // created absent + updated absent -> both set, no retry.
      const { plugin, processFrontMatter, file, writes } = setup({
        frontmatter: {},
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok' });
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]).toHaveProperty('created');
      expect(writes[0]).toHaveProperty('updated');
    });

    it('schedules a retry without writing when only updated is rate-limited', async () => {
      // created present + updated present & fresh -> retryAfterMs only, no write.
      const { plugin, processFrontMatter, file, timers } = setup({
        settings: { minSecondsBetweenSaves: 30 },
        frontmatter: { created: T - 86_400_000, updated: T - 5000 },
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok' });
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(timers.has(file.path)).toBe(true);
    });
  });

  describe('self-trigger suppression (guard 1)', () => {
    it('skips a self-triggered modify event when mtime matches the last plugin write', async () => {
      // Empty frontmatter would otherwise trigger a write of created + updated;
      // the guard must suppress it so the plugin does not re-stamp its own write.
      const { plugin, processFrontMatter, file, lastWrite } = setup({
        frontmatter: {},
      });
      lastWrite.set(file.path, file.stat.mtime);

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok' });
      expect(processFrontMatter).not.toHaveBeenCalled();
      // The token is one-shot: consumed whether or not it matched.
      expect(lastWrite.has(file.path)).toBe(false);
    });

    it('processes a real edit arriving after a plugin write when mtime differs', async () => {
      const { plugin, processFrontMatter, file, lastWrite } = setup({
        frontmatter: {},
      });
      // Stale token from a previous plugin write, but the file changed since.
      lastWrite.set(file.path, file.stat.mtime + 1);

      await plugin.handleFileChange(file);

      // A genuine post-write edit must not be dropped: the stale token differs
      // from the current mtime, so the guard falls through to the write. (The
      // write then re-arms lastPluginWriteMtime for the next self-trigger, so
      // the token's presence afterwards is a write artifact, not the guard's.)
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
    });
  });

  describe('malformed YAML handling (guard 2)', () => {
    it('surfaces a YAMLParseError as an error result with a notice, without throwing', async () => {
      const noticeSpy = vi.spyOn(obsidian, 'Notice');
      const yamlErr = new Error('bad mapping');
      yamlErr.name = 'YAMLParseError';
      const { plugin, file } = setup({
        frontmatter: {}, // ensures a write is attempted
        processFrontMatterImpl: () => Promise.reject(yamlErr),
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'error', error: yamlErr });
      // The user is told which file is malformed - not pointed at an empty console.
      expect(noticeSpy).toHaveBeenCalledTimes(1);
      expect(String(noticeSpy.mock.calls[0]?.[0])).toContain(file.path);
      noticeSpy.mockRestore();
    });

    it('returns an error result for a non-YAML write failure', async () => {
      const err = new Error('disk full');
      const { plugin, file } = setup({
        frontmatter: {},
        processFrontMatterImpl: () => Promise.reject(err),
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'error', error: err });
    });
  });

  describe('ignore checks', () => {
    it('returns ignored for a non-markdown file without writing', async () => {
      const { plugin, processFrontMatter } = setup({});
      const png = createTFile('notes/image.png');

      const result = await plugin.handleFileChange(png);

      expect(result).toEqual({ status: 'ignored' });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });
  });

  // Edit-activity counter (updated_count). The counter rides ONLY the `updated`
  // write of a Counted edit, in the same processFrontMatter call, as a native
  // number. It must never count a created-only fill, the inversion-fix service
  // write, or its own write; it must defer atomically with a rate-limited
  // `updated`; and it must read its base from the callback frontmatter.
  describe('edit-activity counter (updated_count)', () => {
    const ENABLED = {
      countUpdatesEnabled: true,
      headerUpdateCount: 'updated_count',
    };

    it('AC-1: with the counter OFF (default), an edit never writes the count', async () => {
      const { plugin, file, writes } = setup({ frontmatter: {} });

      await plugin.handleFileChange(file);

      expect(writes).toHaveLength(1);
      expect(writes[0]).toHaveProperty('updated');
      expect(writes[0]).not.toHaveProperty('updated_count');
    });

    it('AC-2: first counted edit on a note without the property writes updated_count: 1 (native number)', async () => {
      const { plugin, file, writes } = setup({
        settings: ENABLED,
        frontmatter: {},
      });

      await plugin.handleFileChange(file);

      expect(writes).toHaveLength(1);
      expect(writes[0]).toHaveProperty('updated');
      expect(writes[0]!.updated_count).toBe(1);
      expect(typeof writes[0]!.updated_count).toBe('number');
    });

    it('AC-3: an existing count increments by exactly 1 in the same write as updated', async () => {
      const { plugin, file, writes, processFrontMatter } = setup({
        settings: ENABLED,
        frontmatter: {
          created: T - 86_400_000,
          updated: T - 60_000,
          updated_count: 4,
        },
      });

      await plugin.handleFileChange(file);

      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]!.updated_count).toBe(5);
      expect(writes[0]).toHaveProperty('updated');
    });

    it('R11: the base is read from the callback frontmatter (external 45 -> 46), as a native number', async () => {
      const { plugin, file, writes } = setup({
        settings: ENABLED,
        frontmatter: {
          created: T - 86_400_000,
          updated: T - 60_000,
          updated_count: 45,
        },
      });

      await plugin.handleFileChange(file);

      expect(writes[0]!.updated_count).toBe(46);
      expect(typeof writes[0]!.updated_count).toBe('number');
    });

    it('smart-coerces a corrupt existing value (string "12x" -> 1)', async () => {
      const { plugin, file, writes } = setup({
        settings: ENABLED,
        frontmatter: {
          created: T - 86_400_000,
          updated: T - 60_000,
          updated_count: '12x',
        },
      });

      await plugin.handleFileChange(file);

      // "12x" is not a clean number -> coerceCount -> 0 -> +1 -> 1 (self-heals).
      expect(writes[0]!.updated_count).toBe(1);
    });

    it('AC-5: a created-only fill (modified-time tracking off) does NOT increment', async () => {
      const { plugin, file, writes } = setup({
        settings: { ...ENABLED, enableModifiedTime: false },
        frontmatter: {}, // created absent -> createdValue set; no updated write
      });

      await plugin.handleFileChange(file);

      expect(writes).toHaveLength(1);
      expect(writes[0]).toHaveProperty('created');
      expect(writes[0]).not.toHaveProperty('updated_count');
    });

    it('R16: an inversion-fix service write of updated does NOT increment the counter', async () => {
      // Modified-time tracking off so the modified block sets no countedEdit; the
      // inversion fix still rewrites `updated` - which must NOT move the counter.
      const { plugin, file, writes } = setup({
        settings: {
          ...ENABLED,
          enableModifiedTime: false,
          inversionFixStrategy: 'updated-to-created',
        },
        // updated earlier than created -> inversion detected and fixed.
        frontmatter: { created: T, updated: T - 100_000, updated_count: 3 },
      });

      await plugin.handleFileChange(file);

      expect(writes).toHaveLength(1);
      expect(writes[0]).toHaveProperty('updated'); // the fix was applied
      expect(writes[0]!.updated_count).toBe(3); // unchanged - not a Counted edit
    });

    it('R3: a rate-limited edit defers the count, then increments exactly once on retry', async () => {
      const { plugin, file, writes, processFrontMatter } = setup({
        settings: { ...ENABLED, minSecondsBetweenSaves: 30 },
        frontmatter: {
          created: T - 86_400_000,
          updated: T - 5000,
          updated_count: 7,
        },
      });

      await plugin.handleFileChange(file);
      // Deferred: nothing written this pass, so the count is not applied early.
      expect(processFrontMatter).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(31_000);

      // Applied exactly once on the retry: 7 -> 8, never +2.
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]!.updated_count).toBe(8);
    });

    it('R1: a self-triggered modify event does not re-increment', async () => {
      const { plugin, file, writes, lastWrite } = setup({
        settings: ENABLED,
        frontmatter: {
          created: T - 86_400_000,
          updated: T - 60_000,
          updated_count: 9,
        },
      });
      lastWrite.set(file.path, file.stat.mtime);

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok' });
      expect(writes).toHaveLength(0); // no write at all -> no second increment
    });

    it('respects the name-collision guard at the write boundary (counter name == updated key -> no count write)', async () => {
      const { plugin, file, writes } = setup({
        settings: { countUpdatesEnabled: true, headerUpdateCount: 'updated' },
        frontmatter: {},
      });

      await plugin.handleFileChange(file);

      // The counter key equals the updated key; the guard returns null so only
      // the date is written, never a clobbering double-write.
      expect(writes[0]).toHaveProperty('updated');
      expect(writes[0]!.updated).not.toBe(1);
    });
  });
});

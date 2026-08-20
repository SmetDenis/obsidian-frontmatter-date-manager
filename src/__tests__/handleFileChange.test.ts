import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as obsidian from 'obsidian';
import { TFile } from 'obsidian';
import FrontmatterDateManagerPlugin, { ignoreReasonToNotice } from '../main';
import { DEFAULT_SETTINGS, FrontmatterDateManagerSettings } from '../Settings';
import { strings } from '../i18n';

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
  // One entry per Markdown leaf showing the file. `dirty` is the private flag
  // Obsidian's TextFileView sets while a buffer holds unsaved changes; a
  // non-boolean simulates API drift and drives the public fallback comparison.
  // `viewData` feeds that fallback (compared against `diskData`).
  leaves?: Array<{ dirty?: unknown; viewData?: string; throwOnRead?: boolean }>;
  // One entry per open Excalidraw view. Field shapes mirror the public members
  // of ExcalidrawView the guard reads through `unknown` casts; the sentinel
  // values simulate API drift, which must fail closed.
  excalidrawLeaves?: Array<{
    path?: string | number;
    isDirty?: boolean | 'missing' | 'throws' | 'non-boolean';
    saving?: boolean;
    autosaving?: boolean;
    // 'missing' = the field is absent, 'null' = explicitly null, 'empty' = an
    // object without the semaphore fields (partial API drift). All must block.
    semaphores?: 'missing' | 'null' | 'empty';
    // 'missing' = excalidrawAPI absent/null (view not mounted yet),
    // 'primitive' = present but not an object (drift). Both must block.
    api?: 'missing' | 'primitive';
  }>;
  // What vault.cachedRead returns for the fallback comparison.
  diskData?: string;
  processFrontMatterImpl?: (
    file: TFile,
    cb: (fm: Record<string, unknown>) => void,
    options?: unknown,
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
    _options?: unknown,
  ) => {
    const fm = { ...frontmatter };
    cb(fm);
    writes.push(fm);
    return Promise.resolve();
  };
  const processFrontMatter = vi.fn(opts.processFrontMatterImpl ?? defaultImpl);

  // Simulate the workspace: getLeavesOfType('markdown') returns one leaf per
  // opts.leaves entry, each carrying the private `dirty` flag the write guard
  // reads (and getViewData for the public fallback).
  const openLeaves = (opts.leaves ?? []).map((spec) => {
    const view = Object.assign(new obsidian.MarkdownView(), {
      file,
      getViewData: () => {
        if (spec.throwOnRead) throw new Error('buffer unreadable');
        return spec.viewData ?? '';
      },
    });
    // Read through to the spec so a test can flip `dirty` mid-run (a buffer
    // going clean between the deferred pass and its retry).
    Object.defineProperty(view, 'dirty', { get: () => spec.dirty });
    return { view };
  });

  // Simulate open Excalidraw drawing views (view type 'excalidraw'). The view
  // objects are plain shapes - the guard reads them structurally through
  // `unknown` casts, exactly as in production.
  const excalidrawLeaves = (opts.excalidrawLeaves ?? []).map((spec) => {
    const view: Record<string, unknown> = {
      file: { path: spec.path ?? file.path },
    };
    if (spec.semaphores === 'null') {
      view.semaphores = null;
    } else if (spec.semaphores === 'empty') {
      view.semaphores = {};
    } else if (spec.semaphores !== 'missing') {
      view.semaphores = {
        saving: spec.saving ?? false,
        autosaving: spec.autosaving ?? false,
      };
    }
    if (spec.api === 'primitive') {
      view.excalidrawAPI = 'mounted';
    } else if (spec.api !== 'missing') {
      view.excalidrawAPI = {};
    }
    const dirtySpec = spec.isDirty ?? false;
    if (dirtySpec !== 'missing') {
      view.isDirty = () => {
        if (dirtySpec === 'throws') throw new Error('view unloaded');
        if (dirtySpec === 'non-boolean') return 'maybe';
        return dirtySpec;
      };
    }
    return { view };
  });

  plugin.app = {
    vault: {
      read: vi
        .fn()
        .mockResolvedValue(opts.fileContent ?? '---\nx: 1\n---\nbody'),
      cachedRead: vi.fn().mockResolvedValue(opts.diskData ?? ''),
    },
    fileManager: { processFrontMatter },
    metadataCache: { getFileCache: () => ({ frontmatter }) },
    workspace: {
      // Type-aware, like the real workspace: Markdown leaves must never be
      // handed to the Excalidraw guard branch (it would fail closed on them).
      getLeavesOfType: vi.fn((type: string) =>
        type === 'markdown'
          ? openLeaves
          : type === 'excalidraw'
            ? excalidrawLeaves
            : [],
      ),
    },
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
        // created absent -> createdValue set; updated present, >FRESHNESS_SEC behind
        // mtime but within the 30s throttle -> rate-limited (not the freshness skip).
        frontmatter: { updated: T - 20000 },
      });
    }

    it('defers the write instead of stamping created and dropping the updated retry', async () => {
      const { plugin, processFrontMatter, file, timers } = bugSetup();

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
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

      expect(result).toEqual({ status: 'ok', wrote: true });
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]).toHaveProperty('created');
      expect(writes[0]).toHaveProperty('updated');
    });

    it('schedules a retry without writing when only updated is rate-limited', async () => {
      // created present + updated >FRESHNESS_SEC behind mtime, within the 30s
      // throttle -> retryAfterMs only, no write.
      const { plugin, processFrontMatter, file, timers } = setup({
        settings: { minSecondsBetweenSaves: 30 },
        frontmatter: { created: T - 86_400_000, updated: T - 20000 },
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
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

      expect(result).toEqual({ status: 'ok', wrote: false });
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

  // Dirty-buffer guard (issue #10). Obsidian's TextFileView 3-way-merges any
  // vault write of its own file into the live buffer - fuzzy diff-match-patch,
  // per-hunk failure flags discarded - and shows "modified externally" IFF its
  // `dirty` flag is set when the modify arrives. mtime is never consulted there,
  // so the plugin must simply not write while any leaf is dirty.
  describe('dirty editor buffer defers the write', () => {
    it('defers instead of writing when the only leaf is dirty', async () => {
      const { plugin, processFrontMatter, file, timers } = setup({
        frontmatter: {},
        leaves: [{ dirty: true }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(timers.has(file.path)).toBe(true);
    });

    it('writes when every leaf is clean, with no write options', async () => {
      const { plugin, processFrontMatter, file } = setup({
        frontmatter: {},
        leaves: [{ dirty: false }, { dirty: false }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: true });
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      // No { ctime, mtime } pin: it never prevented the merge, and it made a
      // size-neutral re-stamp emit no event at all (the editor then reverted it).
      expect(processFrontMatter.mock.calls[0]?.[2]).toBeUndefined();
    });

    it('blocks the write when ONE leaf among clean ones is dirty', async () => {
      const { plugin, processFrontMatter, file } = setup({
        frontmatter: {},
        leaves: [{ dirty: false }, { dirty: true }, { dirty: false }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('falls back to comparing the buffer with disk when `dirty` is not a boolean', async () => {
      const drifted = setup({
        frontmatter: {},
        leaves: [{ dirty: undefined, viewData: 'buffer text' }],
        diskData: 'disk text',
      });

      expect(await drifted.plugin.handleFileChange(drifted.file)).toEqual({
        status: 'ok',
        wrote: false,
        deferred: true,
      });
      expect(drifted.processFrontMatter).not.toHaveBeenCalled();

      const matching = setup({
        frontmatter: {},
        leaves: [{ dirty: 'yes', viewData: 'same text' }],
        diskData: 'same text',
      });

      expect(await matching.plugin.handleFileChange(matching.file)).toEqual({
        status: 'ok',
        wrote: true,
      });
    });

    // The fallback's NORMAL answer must be "clean". A clean buffer equals disk
    // by construction, so if `dirty` ever disappears the plugin keeps stamping
    // instead of deferring forever - the deferral has no cap, so a fallback
    // that answered "dirty" for clean buffers would silently stop all stamping
    // and re-arm its timer indefinitely.
    it('lets the write through when `dirty` is absent but the buffer matches disk', async () => {
      const { plugin, processFrontMatter, file, timers } = setup({
        frontmatter: {},
        leaves: [{ dirty: undefined, viewData: 'identical content' }],
        diskData: 'identical content',
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: true });
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(timers.has(file.path)).toBe(false);
    });

    it('fails closed when the buffer cannot be read', async () => {
      const { plugin, processFrontMatter, file } = setup({
        frontmatter: {},
        leaves: [{ dirty: null, throwOnRead: true }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('does not refresh the hash cache or stack timers while deferring', async () => {
      const { plugin, processFrontMatter, file, timers } = setup({
        settings: { enableContentHashCheck: true },
        frontmatter: {},
        leaves: [{ dirty: true }],
      });
      const populate = (
        plugin as unknown as { populateCacheForFile: ReturnType<typeof vi.fn> }
      ).populateCacheForFile;

      await plugin.handleFileChange(file);
      const firstTimer = timers.get(file.path);
      await plugin.handleFileChange(file);

      // Refreshing the hash would absorb the pending change and lose it.
      expect(populate).not.toHaveBeenCalled();
      // The per-file timer is coalesced, never stacked.
      expect(timers.get(file.path)).toBe(firstTimer);
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('writes exactly one counter increment once the buffer goes clean', async () => {
      const dirtyLeaf = { dirty: true as unknown };
      const { plugin, processFrontMatter, file, writes } = setup({
        settings: {
          countUpdatesEnabled: true,
          headerUpdateCount: 'updated_count',
        },
        frontmatter: { updated_count: 4 },
        leaves: [dirtyLeaf],
      });

      await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();

      dirtyLeaf.dirty = false;
      await vi.advanceTimersByTimeAsync(3000);

      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]?.updated_count).toBe(5);
    });
  });

  // A dirty/busy/unknown Excalidraw view of the file DROPS the pass (no write,
  // no hash refresh, NO retry timer) - Excalidraw can stay dirty for hours, so
  // a fixed-interval retry would read+hash the file forever; its own next save
  // fires `modify` and re-triggers the pipeline. The danger being guarded: an
  // external write into a drawing idle > 5 min triggers Excalidraw's
  // reload(true) + clearDirty(), discarding unsaved strokes.
  describe('open Excalidraw view blocks the write', () => {
    it('writes when the only Excalidraw view of the file is mounted, idle, and clean', async () => {
      const { plugin, processFrontMatter, file } = setup({
        excalidrawLeaves: [{ isDirty: false }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: true });
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['dirty view', { isDirty: true }],
      ['isDirty missing (API drift)', { isDirty: 'missing' }],
      ['isDirty throwing (view unloading)', { isDirty: 'throws' }],
      ['isDirty returning a non-boolean', { isDirty: 'non-boolean' }],
      ['semaphores missing (API drift)', { semaphores: 'missing' }],
      ['semaphores null', { semaphores: 'null' }],
      ['semaphores present but empty (partial drift)', { semaphores: 'empty' }],
      ['view not mounted (excalidrawAPI null)', { api: 'missing' }],
      ['excalidrawAPI not an object', { api: 'primitive' }],
      ['view.file.path not a string', { path: 42 }],
    ] as const)(
      'drops the pass without a timer on a %s',
      async (_label, leaf) => {
        const { plugin, processFrontMatter, file, timers } = setup({
          excalidrawLeaves: [
            leaf as NonNullable<SetupOpts['excalidrawLeaves']>[0],
          ],
        });
        const populate = (
          plugin as unknown as {
            populateCacheForFile: ReturnType<typeof vi.fn>;
          }
        ).populateCacheForFile;

        const result = await plugin.handleFileChange(file);

        expect(result).toEqual({
          status: 'ok',
          wrote: false,
          blocked: 'excalidraw',
        });
        expect(processFrontMatter).not.toHaveBeenCalled();
        // No hash refresh: the pending change must stay detectable for the pass
        // Excalidraw's own next save triggers.
        expect(populate).not.toHaveBeenCalled();
        // No retry timer: the resume is modify-driven, not polled.
        expect(timers.has(file.path)).toBe(false);
      },
    );

    // A save in flight is short-lived, and the `modify` of that very save may
    // already have been delivered - so this state DEFERS on the normal timer
    // instead of dropping, or the update could be stranded until the next edit.
    it.each([
      ['saving semaphore', { saving: true }],
      ['autosaving semaphore', { autosaving: true }],
    ] as const)(
      'defers with a timer while the drawing is %s',
      async (_label, leaf) => {
        const { plugin, processFrontMatter, file, timers } = setup({
          excalidrawLeaves: [
            leaf as NonNullable<SetupOpts['excalidrawLeaves']>[0],
          ],
        });

        const result = await plugin.handleFileChange(file);

        expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
        expect(processFrontMatter).not.toHaveBeenCalled();
        expect(timers.has(file.path)).toBe(true);
      },
    );

    it('ignores an Excalidraw view showing a different file', async () => {
      const { plugin, processFrontMatter, file } = setup({
        excalidrawLeaves: [{ path: 'other/drawing.md', isDirty: true }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: true });
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
    });

    it('blocks when Markdown leaves are clean but an Excalidraw view is dirty', async () => {
      const { plugin, processFrontMatter, file } = setup({
        leaves: [{ dirty: false }],
        excalidrawLeaves: [{ isDirty: true }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({
        status: 'ok',
        wrote: false,
        blocked: 'excalidraw',
      });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('a dirty Markdown leaf wins over the Excalidraw block (defers with a timer)', async () => {
      const { plugin, file, timers } = setup({
        leaves: [{ dirty: true }],
        excalidrawLeaves: [{ isDirty: true }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
      expect(timers.has(file.path)).toBe(true);
    });
  });

  // The "out-of-order dates were detected and fixed" notice must follow a real
  // write, never precede it: computeFrontmatterUpdates only flags the fix.
  describe('inversion notice follows the write', () => {
    const INVERTED = {
      settings: {
        inversionFixStrategy: 'max-all' as const,
        inversionToleranceSec: 0,
        timezone: 'UTC',
        // No throttle: `updated` must actually be written this pass, so the
        // inversion branch is reached and the write really happens.
        minSecondsBetweenSaves: 0,
      },
      // created far ahead of updated -> an inversion the strategy must fix.
      frontmatter: { created: '2030-01-01T00:00:00', updated: T - 20000 },
    };

    it('shows the notice after a successful write', async () => {
      const { plugin, file, processFrontMatter } = setup(INVERTED);
      const noticeSpy = vi.fn();
      (plugin as unknown as { _noticeFactory: unknown })._noticeFactory =
        noticeSpy;

      await plugin.handleFileChange(file);

      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(noticeSpy).toHaveBeenCalledTimes(1);
    });

    it('stays silent when the pass defers on a dirty buffer', async () => {
      const { plugin, file, processFrontMatter } = setup({
        ...INVERTED,
        leaves: [{ dirty: true }],
      });
      const noticeSpy = vi.fn();
      (plugin as unknown as { _noticeFactory: unknown })._noticeFactory =
        noticeSpy;

      await plugin.handleFileChange(file);

      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(noticeSpy).not.toHaveBeenCalled();
    });

    it('stays silent when the write fails', async () => {
      const { plugin, file } = setup({
        ...INVERTED,
        processFrontMatterImpl: () => Promise.reject(new Error('disk full')),
      });
      const noticeSpy = vi.fn();
      (plugin as unknown as { _noticeFactory: unknown })._noticeFactory =
        noticeSpy;

      await plugin.handleFileChange(file);

      expect(noticeSpy).not.toHaveBeenCalled();
    });
  });

  // The manual command routes through processFileWithLock so it can never race
  // an in-flight automatic pass. A locked file reports `deferred` (the
  // rescheduled pass will apply the change) - not a false "already up to date".
  describe('processFileWithLock result mapping', () => {
    it('returns the write result when the file is not locked', async () => {
      const { plugin, file, processFrontMatter } = setup({ frontmatter: {} });

      const result = await (
        plugin as unknown as {
          processFileWithLock: (f: TFile) => Promise<unknown>;
        }
      ).processFileWithLock(file);

      expect(result).toEqual({ status: 'ok', wrote: true });
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
    });

    it('returns deferred and reschedules when the file is already being processed', async () => {
      const { plugin, file, processFrontMatter, timers } = setup({
        frontmatter: {},
      });
      (
        plugin as unknown as { processingFiles: Set<string> }
      ).processingFiles.add(file.path);

      const result = await (
        plugin as unknown as {
          processFileWithLock: (f: TFile) => Promise<unknown>;
        }
      ).processFileWithLock(file);

      expect(result).toEqual({ status: 'ok', wrote: false, deferred: true });
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(timers.has(file.path)).toBe(true);
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

      expect(result).toEqual({ status: 'ignored', reason: 'not-markdown' });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('returns reason no-date-keys when both date property names are blank', async () => {
      const { plugin, processFrontMatter, file } = setup({
        settings: { headerCreated: '  ', headerUpdated: '' },
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({ status: 'ignored', reason: 'no-date-keys' });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('returns reason invalid-file-times when file timestamps cannot be parsed', async () => {
      const { plugin, processFrontMatter, file } = setup({});
      file.stat = { ctime: NaN, mtime: NaN, size: 50 };

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({
        status: 'ignored',
        reason: 'invalid-file-times',
      });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });
  });

  // Each ignore cause maps to its own honest notice - the shared "ignored by
  // plugin settings" text was the misleading half of issue #15. Exhaustive: a
  // new reason without a dedicated string is a compile error in main.ts, and
  // this table pins each existing mapping.
  describe('ignoreReasonToNotice', () => {
    it.each([
      ['excalidraw', strings.notices.ignoredExcalidraw],
      ['filter-rule', strings.notices.ignoredByFilterRule],
      ['canvas', strings.notices.ignoredCanvas],
      ['empty', strings.notices.ignoredEmpty],
      ['unchanged', strings.notices.ignoredUnchanged],
      ['no-date-keys', strings.notices.ignoredNoDateKeys],
      ['invalid-file-times', strings.notices.ignoredInvalidFileTimes],
      ['no-path', strings.notices.ignoredNotMarkdown],
      ['not-markdown', strings.notices.ignoredNotMarkdown],
      ['not-a-file', strings.notices.ignoredNotMarkdown],
    ] as const)('maps %s to its dedicated notice', (reason, expected) => {
      expect(ignoreReasonToNotice(reason)).toBe(expected);
    });

    // The blocked result is not an ignore reason - it is an 'ok' pass that
    // wrote nothing - so the command picks its notice from `blocked`. Pinned
    // here so the two never drift apart (only e2e X6 covered it before).
    it('reports a blocked Excalidraw pass with its own notice, not a false success', async () => {
      const { plugin, file } = setup({
        excalidrawLeaves: [{ isDirty: true }],
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({
        status: 'ok',
        wrote: false,
        blocked: 'excalidraw',
      });
      // Mirrors the command's mapping in setupCommands().
      const notice =
        result.status === 'ok' && result.blocked === 'excalidraw'
          ? strings.notices.excalidrawHasUnsavedChanges
          : strings.notices.timestampsAlreadyCurrent;
      expect(notice).toBe(strings.notices.excalidrawHasUnsavedChanges);
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
          updated: T - 20000,
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

      expect(result).toEqual({ status: 'ok', wrote: false });
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

  describe('updated freshness / no-op-write guard', () => {
    // A probe run tells us exactly what FDM would write for this file's mtime
    // (T - 1000), host-timezone-independently, so we can pre-seed that value.
    function mtimeValue(settings?: Partial<FrontmatterDateManagerSettings>) {
      const probe = setup({ settings });
      return probe.plugin.formatDate(new Date(probe.file.stat.mtime));
    }

    // The "no write" cases advance the clock 60s past the file's mtime so the
    // pre-existing rate-limiter (now vs updated + minSecondsBetweenSaves = 30s)
    // would OTHERWISE fire a write - which isolates the new guard: without it
    // these scenarios write (or defer with a retry timer); with it they resolve
    // on the first pass, so processFrontMatter is never called AND no retry timer
    // is scheduled (timers stays empty).
    const NOW_PAST_LIMIT = T + 60_000;

    it('does not write when updated already equals formatDate(mtime) [raw identity]', async () => {
      vi.setSystemTime(NOW_PAST_LIMIT);
      const val = mtimeValue();
      const { plugin, processFrontMatter, file, timers } = setup({
        frontmatter: { created: 'x', updated: val },
      });
      const result = await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(timers.size).toBe(0);
      expect(result.status).toBe('ok');
    });

    it('does not write for a numeric non-epoch format (yyyyMMdd) [H2]', async () => {
      vi.setSystemTime(NOW_PAST_LIMIT);
      const s = { enableNumberProperties: true, dateFormat: 'yyyyMMdd' };
      const val = mtimeValue(s); // a number like 20260614
      expect(typeof val).toBe('number');
      const { plugin, processFrontMatter, file, timers } = setup({
        settings: s,
        frontmatter: { created: 'x', updated: val },
      });
      await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(timers.size).toBe(0);
    });

    it('does not write when updated is 2s behind mtime [freshness / script drift]', async () => {
      vi.setSystemTime(NOW_PAST_LIMIT);
      const probe = setup();
      const behind = probe.plugin.formatDate(
        new Date(probe.file.stat.mtime - 2000),
      );
      const { plugin, processFrontMatter, file, timers } = setup({
        frontmatter: { created: 'x', updated: behind },
      });
      await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(timers.size).toBe(0);
    });

    it('does not clobber an updated dated in the future [freshness asymmetry]', async () => {
      vi.setSystemTime(NOW_PAST_LIMIT);
      const probe = setup();
      const future = probe.plugin.formatDate(
        new Date(probe.file.stat.mtime + 3_600_000),
      );
      const { plugin, processFrontMatter, file, timers } = setup({
        frontmatter: { created: 'x', updated: future },
      });
      await plugin.handleFileChange(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
      // A future-dated value is inherently rate-limited too, so the write signal
      // alone would pass without the guard; the empty timer set proves the guard
      // resolved it immediately instead of scheduling a retry.
      expect(timers.size).toBe(0);
    });

    it('absorbs a genuine edit 3s after the last stamp within the window [H1, documented]', async () => {
      vi.setSystemTime(NOW_PAST_LIMIT);
      const probe = setup();
      const threeAgo = probe.plugin.formatDate(
        new Date(probe.file.stat.mtime - 3000),
      );
      const { plugin, processFrontMatter, file, timers } = setup({
        settings: {
          countUpdatesEnabled: true,
          headerUpdateCount: 'updated_count',
        },
        frontmatter: { created: 'x', updated: threeAgo, updated_count: 4 },
      });
      await plugin.handleFileChange(file);
      // Accepted precision loss: no write, so the counter is not bumped either.
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(timers.size).toBe(0);
    });

    it('re-stamps when mtime is far ahead of updated [genuinely stale]', async () => {
      const probe = setup();
      const stale = probe.plugin.formatDate(
        new Date(probe.file.stat.mtime - 60_000),
      );
      const expected = probe.plugin.formatDate(new Date(probe.file.stat.mtime));
      const { plugin, processFrontMatter, file, writes } = setup({
        frontmatter: { created: 'x', updated: stale },
      });
      await plugin.handleFileChange(file);
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]!.updated).toEqual(expected);
    });

    it('makes one legitimate re-stamp across a coarse-format day boundary [M1]', async () => {
      const s = { dateFormat: 'yyyy-MM-dd' };
      const expected = mtimeValue(s); // e.g. '2026-06-14'
      const { plugin, processFrontMatter, file, writes } = setup({
        settings: s,
        frontmatter: { created: 'x', updated: '2026-06-13' },
      });
      await plugin.handleFileChange(file);
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]!.updated).toEqual(expected);
    });

    it('fills a missing created while leaving a fresh updated untouched', async () => {
      const val = mtimeValue();
      const { plugin, processFrontMatter, file, writes } = setup({
        frontmatter: { updated: val }, // created missing
      });
      await plugin.handleFileChange(file);
      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(writes[0]!.created).toBeDefined();
      expect(writes[0]!.updated).toEqual(val); // unchanged
    });

    it('reports wrote:false when the freshness guard skips the write', async () => {
      const probe = setup();
      const val = probe.plugin.formatDate(new Date(probe.file.stat.mtime));
      const { plugin, file } = setup({
        frontmatter: { created: 'x', updated: val },
      });
      const result = await plugin.handleFileChange(file);
      expect(result).toEqual({ status: 'ok', wrote: false });
    });
  });
});

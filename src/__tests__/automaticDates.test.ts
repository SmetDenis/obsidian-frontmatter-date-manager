import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as obsidian from 'obsidian';
import { TFile } from 'obsidian';
import FrontmatterDateManagerPlugin, { ignoreReasonToNotice } from '../main';
import { DEFAULT_SETTINGS, FrontmatterDateManagerSettings } from '../Settings';
import { MODIFY_DEBOUNCE_MS } from '../constants';
import { strings } from '../i18n';

// Issue #24: the "Automatic dates" master switch (persisted as
// enableAutoUpdate) and the timed pause must stop automatic writes at the
// moment they would happen, not only when an event arrives - while work the
// user asked for explicitly (the manual command, including its own deferred
// retries) keeps running. Also covers the manual command's fill-missing mode
// and the status bar indicator.

const T = new Date('2026-06-14T12:00:00Z').getTime();
const BODY = '---\nx: 1\n---\nbody';

function createTFile(path = 'notes/test.md'): TFile {
  const f = new TFile();
  f.path = path;
  const name = path.split('/').pop() ?? '';
  f.name = name;
  f.extension = 'md';
  f.basename = name.replace(/\.md$/, '');
  f.stat = { ctime: T - 86_400_000, mtime: T - 60_000, size: 50 };
  return f;
}

interface Opts {
  settings?: Partial<FrontmatterDateManagerSettings>;
  frontmatter?: Record<string, unknown>;
  // One Markdown leaf with this private `dirty` flag (read live, so a test can
  // flip it between a deferred pass and its retry).
  dirty?: { value: boolean };
  // Seeds the hash cache with the hash of BODY, i.e. "content unchanged".
  cached?: boolean;
  onRead?: () => void;
}

function setup(opts: Opts = {}) {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = {
    ...DEFAULT_SETTINGS,
    enableContentHashCheck: opts.cached === true,
    ...opts.settings,
  };
  plugin.recompileFilterRules();
  const file = createTFile();
  const frontmatter = opts.frontmatter ?? {};
  const writes: Record<string, unknown>[] = [];
  const processFrontMatter = vi.fn(
    (_f: TFile, cb: (fm: Record<string, unknown>) => void) => {
      const fm = { ...frontmatter };
      cb(fm);
      writes.push(fm);
      return Promise.resolve();
    },
  );
  const leaves = opts.dirty
    ? [
        {
          view: Object.defineProperty(
            Object.assign(new obsidian.MarkdownView(), {
              file,
              getViewData: () => BODY,
            }),
            'dirty',
            { get: () => opts.dirty?.value },
          ),
        },
      ]
    : [];
  plugin.app = {
    vault: {
      read: vi.fn(() => {
        opts.onRead?.();
        return Promise.resolve(BODY);
      }),
      cachedRead: vi.fn().mockResolvedValue(BODY),
      on: () => ({}),
    },
    fileManager: { processFrontMatter },
    metadataCache: { getFileCache: () => ({ frontmatter }) },
    workspace: {
      getLeavesOfType: (type: string) => (type === 'markdown' ? leaves : []),
    },
  } as unknown as FrontmatterDateManagerPlugin['app'];
  const populate = vi.fn().mockResolvedValue(undefined);
  (
    plugin as unknown as { populateCacheForFile: typeof populate }
  ).populateCacheForFile = populate;
  if (opts.cached) {
    plugin.hashCache[file.path] = {
      hash: plugin.hashString(plugin.getContentForHashing(BODY)),
      lastAccessed: 0,
    };
  }
  const internals = plugin as unknown as {
    processFileWithLock: (
      f: TFile,
      origin?: 'auto' | 'manual',
    ) => Promise<unknown>;
    modifyTimers: Map<string, number>;
    manualPending: Set<string>;
    _pausedUntil: number;
  };
  return { plugin, file, processFrontMatter, writes, internals, populate };
}

describe('automatic dates master switch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('execution-time gate', () => {
    it('drops automatic work when the switch is off, without refreshing the hash', async () => {
      const { plugin, file, processFrontMatter, populate } = setup({
        settings: { enableAutoUpdate: false },
      });

      const result = await plugin.handleFileChange(file);

      expect(result).toEqual({
        status: 'ignored',
        reason: 'automatic-dates-off',
      });
      expect(processFrontMatter).not.toHaveBeenCalled();
      expect(populate).not.toHaveBeenCalled();
      // Gated before any I/O: a dropped pass must not read the note.
      expect(plugin.app.vault.read).not.toHaveBeenCalled();
    });

    it('drops automatic work while paused', async () => {
      const { plugin, file, processFrontMatter, internals } = setup();
      internals._pausedUntil = T + 60_000;

      const result = await plugin.handleFileChange(file);

      expect(result).toMatchObject({ reason: 'automatic-dates-off' });
      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('re-checks right before writing (switched off while the file was read)', async () => {
      const ctx = setup({
        onRead: () => {
          ctx.plugin.settings.enableAutoUpdate = false;
        },
      });

      const result = await ctx.plugin.handleFileChange(ctx.file);

      expect(result).toMatchObject({ reason: 'automatic-dates-off' });
      expect(ctx.processFrontMatter).not.toHaveBeenCalled();
    });

    it('a dirty-buffer retry scheduled before the switch went off never writes', async () => {
      const dirty = { value: true };
      const { plugin, file, processFrontMatter, internals } = setup({ dirty });

      await plugin.handleFileChange(file);
      expect(internals.modifyTimers.has(file.path)).toBe(true);

      plugin.settings.enableAutoUpdate = false;
      dirty.value = false;
      await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS);

      expect(processFrontMatter).not.toHaveBeenCalled();
    });

    it('manual work runs while the switch is off, and its deferred retry still writes', async () => {
      const dirty = { value: true };
      const { plugin, file, processFrontMatter, internals } = setup({
        settings: { enableAutoUpdate: false },
        dirty,
      });

      const first = await internals.processFileWithLock(file, 'manual');
      expect(first).toEqual({ status: 'ok', wrote: false, deferred: true });
      expect(internals.manualPending.has(file.path)).toBe(true);

      dirty.value = false;
      await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS);

      expect(processFrontMatter).toHaveBeenCalledTimes(1);
      expect(internals.manualPending.has(file.path)).toBe(false);
      expect(plugin.settings.enableAutoUpdate).toBe(false);
    });

    it('an automatic debounce re-arming the timer does not downgrade a pending manual retry', async () => {
      const dirty = { value: true };
      const { plugin, file, processFrontMatter, internals } = setup({ dirty });

      let modify: ((f: TFile) => void) | undefined;
      (plugin.app.vault as unknown as { on: unknown }).on = (
        event: string,
        cb: (f: TFile) => void,
      ) => {
        if (event === 'modify') modify = cb;
        return { event };
      };
      plugin.setupOnEditHandler();

      await internals.processFileWithLock(file, 'manual');
      const manualTimer = internals.modifyTimers.get(file.path);
      // The user keeps typing: an automatic modify event clears and re-arms
      // the same per-file timer, then automatic dates are switched off.
      modify?.(file);
      expect(internals.modifyTimers.get(file.path)).not.toBe(manualTimer);
      plugin.settings.enableAutoUpdate = false;
      dirty.value = false;
      await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS);

      expect(processFrontMatter).toHaveBeenCalledTimes(1);
    });

    it('handleFileOpen re-checks the gate before writing viewed', async () => {
      const ctx = setup({
        settings: { enableLastViewed: true },
        onRead: () => {
          ctx.plugin.settings.enableAutoUpdate = false;
        },
      });

      await (
        ctx.plugin as unknown as { handleFileOpen: (f: TFile) => Promise<void> }
      ).handleFileOpen(ctx.file);

      expect(ctx.processFrontMatter).not.toHaveBeenCalled();
    });

    it('maps the new reason to its own notice', () => {
      expect(ignoreReasonToNotice('automatic-dates-off')).toBe(
        strings.notices.automaticDatesOffSkipped,
      );
    });
  });

  describe('pending work follows a rename', () => {
    function renameHarness() {
      const ctx = setup({ dirty: { value: true } });
      const handlers: Record<string, (...args: unknown[]) => void> = {};
      (ctx.plugin.app.vault as unknown as { on: unknown }).on = (
        event: string,
        cb: (...args: unknown[]) => void,
      ) => {
        handlers[event] = cb;
        return { event };
      };
      ctx.plugin.setupOnEditHandler();
      return { ...ctx, handlers };
    }

    it('re-keys a pending retry to the new path, keeping its manual origin', async () => {
      const { file, internals, handlers, plugin } = renameHarness();
      const spy = vi.spyOn(internals, 'processFileWithLock');
      await internals.processFileWithLock(file, 'manual');
      spy.mockClear();
      spy.mockResolvedValue(undefined);

      const oldPath = file.path;
      file.path = 'notes/renamed.md';
      handlers.rename?.(file, oldPath);
      plugin.settings.enableAutoUpdate = false;

      expect(internals.modifyTimers.has(oldPath)).toBe(false);
      expect(internals.modifyTimers.has(file.path)).toBe(true);
      await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS);
      expect(spy).toHaveBeenCalledWith(file, 'manual');
    });

    it('delete clears a pending manual request', async () => {
      const { file, internals, handlers } = renameHarness();
      await internals.processFileWithLock(file, 'manual');

      handlers.delete?.(file);

      expect(internals.manualPending.has(file.path)).toBe(false);
      expect(internals.modifyTimers.has(file.path)).toBe(false);
    });
  });
});

describe('manual command fill-missing on unchanged content', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a deleted created without touching an existing updated', async () => {
    const { file, internals, writes } = setup({
      cached: true,
      frontmatter: { updated: '2020-01-01T00:00:00' },
    });

    const result = await internals.processFileWithLock(file, 'manual');

    expect(result).toEqual({ status: 'ok', wrote: true });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toHaveProperty('created');
    expect(writes[0]?.updated).toBe('2020-01-01T00:00:00');
  });

  it('fills a missing updated without moving the edit counter', async () => {
    const { file, internals, writes } = setup({
      cached: true,
      settings: { countUpdatesEnabled: true },
      frontmatter: { created: '2020-01-01T00:00:00', updated_count: 4 },
    });

    await internals.processFileWithLock(file, 'manual');

    expect(writes[0]).toHaveProperty('updated');
    expect(writes[0]?.updated_count).toBe(4);
  });

  it('does not apply the out-of-order fix without a content change', async () => {
    const { file, internals, writes } = setup({
      cached: true,
      settings: { inversionFixStrategy: 'created-to-updated' },
      // updated earlier than the created value the fill would add
      frontmatter: { updated: '2000-01-01T00:00:00' },
    });

    await internals.processFileWithLock(file, 'manual');

    expect(writes[0]?.updated).toBe('2000-01-01T00:00:00');
  });

  it('reports unchanged when every date is already present', async () => {
    const { file, internals, processFrontMatter } = setup({
      cached: true,
      frontmatter: {
        created: '2020-01-01T00:00:00',
        updated: '2020-01-01T00:00:00',
      },
    });

    const result = await internals.processFileWithLock(file, 'manual');

    expect(result).toEqual({ status: 'ignored', reason: 'unchanged' });
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('automatic work on unchanged content is still stopped by the hash gate', async () => {
    const { plugin, file, processFrontMatter } = setup({ cached: true });

    const result = await plugin.handleFileChange(file);

    expect(result).toEqual({ status: 'ignored', reason: 'unchanged' });
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('a manual run on changed content keeps the full update behavior', async () => {
    const ctx = setup({
      cached: true,
      frontmatter: {
        created: '2020-01-01T00:00:00',
        updated: '2020-01-01T00:00:00',
      },
    });
    ctx.plugin.hashCache[ctx.file.path] = { hash: 'stale', lastAccessed: 0 };

    await ctx.internals.processFileWithLock(ctx.file, 'manual');

    expect(ctx.writes[0]?.updated).not.toBe('2020-01-01T00:00:00');
  });
});

describe('status bar indicator and switch commands', () => {
  function statusHarness(
    settings: Partial<FrontmatterDateManagerSettings> = {},
  ) {
    const plugin = new FrontmatterDateManagerPlugin();
    plugin.settings = { ...DEFAULT_SETTINGS, ...settings };
    const el = {
      text: '',
      hidden: false,
      setText(t: string) {
        this.text = t;
      },
      toggleClass(_cls: string, on: boolean) {
        this.hidden = on;
      },
    };
    plugin.statusBarEl = el as unknown as HTMLElement;
    const internals = plugin as unknown as { _pausedUntil: number };
    return { plugin, el, internals };
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    ['always', true, false, strings.statusBar.on, false],
    ['always', false, false, strings.statusBar.off, false],
    ['when-inactive', true, false, '', true],
    ['when-inactive', false, false, strings.statusBar.off, false],
    ['when-inactive', true, true, 'FDM: paused (5m)', false],
    ['never', false, false, '', true],
    ['never', true, true, '', true],
  ] as const)(
    'mode %s, on=%s, paused=%s -> "%s" (hidden=%s)',
    (mode, on, paused, text, hidden) => {
      vi.useFakeTimers();
      vi.setSystemTime(T);
      const { plugin, el, internals } = statusHarness({
        statusBarMode: mode,
        enableAutoUpdate: on,
      });
      if (paused) internals._pausedUntil = T + 5 * 60_000;

      plugin.updateStatusBar();

      expect(el.text).toBe(text);
      expect(el.hidden).toBe(hidden);
    },
  );

  it('off wins over a running pause', () => {
    vi.useFakeTimers();
    vi.setSystemTime(T);
    const { plugin, el, internals } = statusHarness({
      enableAutoUpdate: false,
    });
    internals._pausedUntil = T + 60_000;

    plugin.updateStatusBar();

    expect(el.text).toBe(strings.statusBar.off);
  });

  it('setAutomaticDates saves, refreshes the open settings tab and cancels rename suppression', async () => {
    const { plugin } = statusHarness();
    const save = vi.spyOn(plugin, 'saveSettings').mockResolvedValue(undefined);
    const cancel = vi.spyOn(plugin, 'cancelRenameSuppression');
    const update = vi.fn();
    plugin.settingsTab = { update } as unknown as typeof plugin.settingsTab;

    await plugin.setAutomaticDates(false);

    expect(plugin.settings.enableAutoUpdate).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  function commands(plugin: FrontmatterDateManagerPlugin) {
    const registered: Record<string, () => void> = {};
    plugin.addCommand = ((cmd: { id: string; callback?: () => void }) => {
      if (cmd.callback) registered[cmd.id] = cmd.callback;
      return cmd;
    }) as unknown as typeof plugin.addCommand;
    (plugin as unknown as { setupCommands: () => void }).setupCommands();
    return registered;
  }

  it('pause while automatic dates are off is a no-op with its own notice', () => {
    const notice = vi.spyOn(obsidian, 'Notice');
    const { plugin, internals } = statusHarness({ enableAutoUpdate: false });

    commands(plugin)['pause-auto-update']?.();

    expect(internals._pausedUntil).toBe(0);
    expect(notice).toHaveBeenCalledWith(strings.notices.nothingToPause);
  });

  it('the resume notice is skipped when automatic dates were switched off during the pause', () => {
    vi.useFakeTimers();
    const notice = vi.spyOn(obsidian, 'Notice');
    const { plugin } = statusHarness();

    commands(plugin)['pause-auto-update']?.();
    plugin.settings.enableAutoUpdate = false;
    vi.advanceTimersByTime(5 * 60_000);

    expect(notice).not.toHaveBeenCalledWith(
      strings.notices.automaticDatesResumed,
    );
  });

  it('the resume notice is shown when automatic dates are still on', () => {
    vi.useFakeTimers();
    const notice = vi.spyOn(obsidian, 'Notice');
    const { plugin } = statusHarness();

    commands(plugin)['pause-auto-update']?.();
    vi.advanceTimersByTime(5 * 60_000);

    expect(notice).toHaveBeenCalledWith(strings.notices.automaticDatesResumed);
  });
});

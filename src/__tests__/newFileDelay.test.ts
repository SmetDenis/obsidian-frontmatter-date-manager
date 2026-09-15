import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS } from '../Settings';
import { MODIFY_DEBOUNCE_MS } from '../constants';
import { TFile } from 'obsidian';

// Wire up the real create/modify event handlers and capture the callbacks
// that setupOnEditHandler registers, so the new-file delay path is exercised
// end-to-end rather than re-simulated.
function setupHandlers(delayForNewFiles = 5000): {
  plugin: FrontmatterDateManagerPlugin;
  handlers: Record<string, (...args: any[]) => void>;
  file: TFile;
  process: ReturnType<typeof vi.spyOn>;
} {
  const handlers: Record<string, (...args: any[]) => void> = {};
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = {
    ...DEFAULT_SETTINGS,
    enableAutoUpdate: true,
    delayForNewFiles,
  };

  const file = new TFile();
  file.path = 'notes/new.md';
  file.stat = { ctime: 1000, mtime: 2000, size: 10 };

  plugin.app = {
    vault: {
      on: (event: string, cb: (...args: any[]) => void) => {
        handlers[event] = cb;
        return { event };
      },
      getAbstractFileByPath: vi.fn().mockReturnValue(file),
    },
    workspace: { on: vi.fn() },
  } as any;

  // Isolate the unit under test: the delay path should funnel into
  // processFileWithLock; stub it so we observe scheduling, not the full pipeline.
  const process = vi
    .spyOn(plugin as any, 'processFileWithLock')
    .mockResolvedValue(undefined);

  plugin.setupOnEditHandler();
  // onload registers this inside workspace.onLayoutReady (covered below).
  plugin.setupCreateHandler();
  return { plugin, handlers, file, process };
}

describe('new file delay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('processes a new file that was populated during the delay window', () => {
    const { handlers, file, process } = setupHandlers(5000);

    handlers.create(file);
    // A template plugin populates the file inside the delay window.
    handlers.modify(file);

    // Still within the window - nothing should run yet.
    expect(process).not.toHaveBeenCalled();

    // Window expires.
    vi.advanceTimersByTime(5000);

    // The settled file must be processed once it is safe to do so.
    expect(process).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledWith(file, 'auto');
  });

  it('leaves an untouched new file alone (matches no-delay behavior)', () => {
    const { handlers, file, process } = setupHandlers(5000);

    handlers.create(file);
    // No modify event - the file was created but never edited.
    vi.advanceTimersByTime(5000);

    expect(process).not.toHaveBeenCalled();
  });

  it('does not process a deferred new file after the plugin unloads', () => {
    const { plugin, handlers, file, process } = setupHandlers(5000);

    handlers.create(file);
    handlers.modify(file);

    plugin.onunload();
    vi.advanceTimersByTime(5000);

    expect(process).not.toHaveBeenCalled();
  });
  it('keeps the window and its remembered modify when the note is renamed inside it', () => {
    const { handlers, file, process } = setupHandlers(5000);

    handlers.create(file);
    handlers.modify(file); // the template lands
    vi.advanceTimersByTime(2000);

    // The user types a title: Obsidian renames by mutating the same TFile.
    const oldPath = file.path;
    file.path = 'notes/My note.md';
    handlers.rename(file, oldPath);

    // Only the REMAINING time is waited, not a fresh window.
    vi.advanceTimersByTime(2999);
    expect(process).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(process).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledWith(file, 'auto');
  });

  it('still remembers a modify inside the window during a bulk run, and waits for the run to end', () => {
    const { plugin, handlers, file, process } = setupHandlers(5000);

    handlers.create(file);
    plugin.bulkRunning = true;
    handlers.modify(file);

    vi.advanceTimersByTime(5000);
    expect(process).not.toHaveBeenCalled();

    plugin.bulkRunning = false;
    vi.advanceTimersByTime(MODIFY_DEBOUNCE_MS);
    expect(process).toHaveBeenCalledTimes(1);
  });

  it('does not remember a modify inside the window while automatic dates are off', () => {
    const { plugin, handlers, file, process } = setupHandlers(5000);
    plugin.settings.enableAutoUpdate = false;

    handlers.create(file);
    handlers.modify(file);
    vi.advanceTimersByTime(5000);

    expect(process).not.toHaveBeenCalled();
  });

  it('setupOnEditHandler alone never listens for create (startup create burst)', () => {
    const handlers: Record<string, unknown> = {};
    const plugin = new FrontmatterDateManagerPlugin();
    plugin.settings = { ...DEFAULT_SETTINGS };
    plugin.app = {
      vault: {
        on: (event: string, cb: unknown) => {
          handlers[event] = cb;
          return { event };
        },
      },
    } as any;

    plugin.setupOnEditHandler();

    expect(handlers.create).toBeUndefined();
    expect(handlers.modify).toBeTypeOf('function');
  });

  it('onload registers the create listener only once the layout is ready', async () => {
    const events: string[] = [];
    const layoutReady: Array<() => void> = [];
    const plugin = new FrontmatterDateManagerPlugin();
    plugin.app = {
      vault: {
        on: (event: string) => {
          events.push(event);
          return { event };
        },
        adapter: { read: () => Promise.reject(new Error('no cache')) },
        getMarkdownFiles: () => [],
      },
      workspace: {
        on: () => ({}),
        onLayoutReady: (cb: () => void) => layoutReady.push(cb),
      },
    } as any;

    await plugin.onload();
    expect(events).not.toContain('create');

    for (const cb of layoutReady) cb();
    expect(events).toContain('create');
    plugin.onunload();
  });
});

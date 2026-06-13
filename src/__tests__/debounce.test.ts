import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS } from '../Settings';
import { MODIFY_DEBOUNCE_MS } from '../constants';
import { TFile } from 'obsidian';

// These tests drive the REAL `modify` handler that setupOnEditHandler registers,
// not a hand-copied reimplementation of the debounce. We capture the callbacks
// passed to `vault.on` and invoke `handlers.modify` directly (the same pattern
// as newFileDelay.test.ts), so the real `window.clearTimeout` collapse, the real
// `file.path` keying, and the real MODIFY_DEBOUNCE_MS timing are exercised - if
// the handler regressed (dropped clearTimeout, changed the timer key, lost the
// delay), these tests fail. processFileWithLock is stubbed so we observe the
// scheduling/collapse, not the full pipeline (that seam is covered by
// handleFileChange.test.ts).

function setupHandlers(): {
  plugin: FrontmatterDateManagerPlugin;
  handlers: Record<string, (...args: any[]) => void>;
  process: ReturnType<typeof vi.spyOn>;
  makeFile: (path: string, name?: string) => TFile;
} {
  const handlers: Record<string, (...args: any[]) => void> = {};
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, enableAutoUpdate: true };

  plugin.app = {
    vault: {
      on: (event: string, cb: (...args: any[]) => void) => {
        handlers[event] = cb;
        return { event };
      },
    },
  } as any;

  // Isolate the unit under test: the debounce timer funnels into
  // processFileWithLock. Stub it so we count scheduled calls, not pipeline work.
  const process = vi
    .spyOn(plugin as any, 'processFileWithLock')
    .mockResolvedValue(undefined);

  plugin.setupOnEditHandler();

  const makeFile = (path: string, name?: string): TFile => {
    const file = new TFile();
    file.path = path;
    if (name !== undefined) {
      file.name = name;
      file.basename = name.replace(/\.md$/, '');
    }
    file.stat = { ctime: 1000, mtime: 2000, size: 10 };
    return file;
  };

  return { plugin, handlers, process, makeFile };
}

function getTimers(
  plugin: FrontmatterDateManagerPlugin,
): Map<string, ReturnType<typeof setTimeout>> {
  return (plugin as any).modifyTimers;
}

describe('modify debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules one processFileWithLock per modify, only after the full delay', async () => {
    const { handlers, process, makeFile } = setupHandlers();
    // Guard: a wiring regression must surface as a failed expectation here, not
    // as a TypeError from calling undefined.
    expect(handlers.modify).toBeTypeOf('function');

    const file = makeFile('notes/test.md');
    handlers.modify(file);

    // One millisecond before the window closes: nothing has run yet. This pins
    // the delay - a handler that fired early (e.g. setTimeout(..., 0)) fails.
    await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS - 1);
    expect(process).not.toHaveBeenCalled();

    // Window closes: exactly one call, for that file.
    await vi.advanceTimersByTimeAsync(1);
    expect(process).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledWith(file);
  });

  it('collapses rapid modify events for the same file into a single call', async () => {
    const { handlers, process, makeFile } = setupHandlers();
    const file = makeFile('notes/rapid.md');

    // Three quick edits inside one window. Each must clear the previous timer
    // (drop the clearTimeout and all three survive -> three calls).
    handlers.modify(file);
    handlers.modify(file);
    handlers.modify(file);

    await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS);

    expect(process).toHaveBeenCalledTimes(1);
    expect(process).toHaveBeenCalledWith(file);
  });

  it('keys timers by file path so different files run independently', async () => {
    const { handlers, process, makeFile } = setupHandlers();
    const a = makeFile('notes/a.md');
    const b = makeFile('notes/b.md');

    handlers.modify(a);
    handlers.modify(b);

    await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS);

    // A shared/constant key would collapse these to one call.
    expect(process).toHaveBeenCalledTimes(2);
    expect(process).toHaveBeenCalledWith(a);
    expect(process).toHaveBeenCalledWith(b);
  });

  it('distinguishes same-named files in different folders (path, not name)', async () => {
    const { handlers, process, makeFile } = setupHandlers();
    // Same basename/name, different folders: a `file.name`-keyed timer would
    // wrongly collapse these; keying by `file.path` keeps them independent.
    const a = makeFile('folderA/note.md', 'note.md');
    const b = makeFile('folderB/note.md', 'note.md');

    handlers.modify(a);
    handlers.modify(b);

    await vi.advanceTimersByTimeAsync(MODIFY_DEBOUNCE_MS);

    expect(process).toHaveBeenCalledTimes(2);
    expect(process).toHaveBeenCalledWith(a);
    expect(process).toHaveBeenCalledWith(b);
  });

  it('onunload clears all pending timers', () => {
    const { plugin } = setupHandlers();
    const timers = getTimers(plugin);
    const callback = vi.fn();

    timers.set('a.md', setTimeout(callback, MODIFY_DEBOUNCE_MS));
    timers.set('b.md', setTimeout(callback, MODIFY_DEBOUNCE_MS));
    expect(timers.size).toBe(2);

    plugin.onunload();

    expect(timers.size).toBe(0);
    vi.advanceTimersByTime(MODIFY_DEBOUNCE_MS + 1000);
    expect(callback).not.toHaveBeenCalled();
  });
});

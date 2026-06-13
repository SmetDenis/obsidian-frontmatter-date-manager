import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS } from '../Settings';
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
    expect(process).toHaveBeenCalledWith(file);
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
});

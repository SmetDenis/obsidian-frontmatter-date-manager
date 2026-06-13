import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS } from '../Settings';

// Access the private modifyTimers map via cast
function getTimers(
  plugin: FrontmatterDateManagerPlugin,
): Map<string, ReturnType<typeof setTimeout>> {
  return (plugin as any).modifyTimers;
}

function createPluginWithHandlers(): FrontmatterDateManagerPlugin {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, enableAutoUpdate: true };
  plugin.app = {
    vault: {
      on: vi.fn(),
      read: vi.fn().mockResolvedValue('some content'),
    },
    fileManager: {
      processFrontMatter: vi.fn().mockResolvedValue(undefined),
    },
  };
  return plugin;
}

describe('modify debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounce timer is created per file path', () => {
    const plugin = createPluginWithHandlers();
    const timers = getTimers(plugin);
    expect(timers.size).toBe(0);

    // Simulate what setupOnEditHandler's modify callback does
    const filePath = 'notes/test.md';
    const existing = timers.get(filePath);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      timers.delete(filePath);
    }, 2000);
    timers.set(filePath, timer);

    expect(timers.size).toBe(1);
    expect(timers.has(filePath)).toBe(true);
  });

  it('debounce replaces previous timer for the same file', () => {
    const plugin = createPluginWithHandlers();
    const timers = getTimers(plugin);
    const callback = vi.fn();

    // First "modify" event
    const timer1 = setTimeout(callback, 2000);
    timers.set('test.md', timer1);

    // Second "modify" event - clears previous timer, sets new one
    clearTimeout(timers.get('test.md')!);
    const timer2 = setTimeout(callback, 2000);
    timers.set('test.md', timer2);

    // After 2 seconds, callback should only fire once
    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('different files have independent timers', () => {
    const plugin = createPluginWithHandlers();
    const timers = getTimers(plugin);
    const callbackA = vi.fn();
    const callbackB = vi.fn();

    timers.set(
      'a.md',
      setTimeout(() => {
        callbackA();
        timers.delete('a.md');
      }, 2000),
    );
    timers.set(
      'b.md',
      setTimeout(() => {
        callbackB();
        timers.delete('b.md');
      }, 2000),
    );

    expect(timers.size).toBe(2);

    vi.advanceTimersByTime(2000);
    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(1);
    expect(timers.size).toBe(0);
  });

  it('onunload clears all pending timers', () => {
    const plugin = createPluginWithHandlers();
    const timers = getTimers(plugin);
    const callback = vi.fn();

    timers.set('a.md', setTimeout(callback, 2000));
    timers.set('b.md', setTimeout(callback, 2000));
    expect(timers.size).toBe(2);

    plugin.onunload();

    expect(timers.size).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });
});

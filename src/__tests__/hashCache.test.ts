import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPlugin } from './helpers';
import type { HashCacheEntry } from '../main';

describe('hash cache debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('markHashCacheDirty sets dirty flag', () => {
    const plugin = createPlugin();
    expect(plugin['_hashCacheDirty']).toBe(false);
    plugin.markHashCacheDirty();
    expect(plugin['_hashCacheDirty']).toBe(true);
  });

  it('markHashCacheDirty starts a timer', () => {
    const plugin = createPlugin();
    expect(plugin['_hashCacheSaveTimer']).toBeNull();
    plugin.markHashCacheDirty();
    expect(plugin['_hashCacheSaveTimer']).not.toBeNull();
  });

  it('multiple markHashCacheDirty calls replace the timer (debounce)', () => {
    const plugin = createPlugin();
    plugin.markHashCacheDirty();
    const firstTimer = plugin['_hashCacheSaveTimer'];
    plugin.markHashCacheDirty();
    expect(plugin['_hashCacheSaveTimer']).not.toBe(firstTimer);
  });

  it('records _hashCacheFirstDirtyAt on first dirty mark', () => {
    const plugin = createPlugin();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    expect(plugin['_hashCacheFirstDirtyAt']).toBeNull();
    plugin.markHashCacheDirty();
    expect(plugin['_hashCacheFirstDirtyAt']).toBe(Date.now());
  });

  it('does not reset _hashCacheFirstDirtyAt on subsequent dirty marks', () => {
    const plugin = createPlugin();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    plugin.markHashCacheDirty();
    const firstDirtyAt = plugin['_hashCacheFirstDirtyAt'];

    vi.advanceTimersByTime(5000);
    plugin.markHashCacheDirty();
    expect(plugin['_hashCacheFirstDirtyAt']).toBe(firstDirtyAt);
  });

  it('flush does not occur before debounce period', () => {
    const plugin = createPlugin();
    const writeSpy = vi.fn().mockResolvedValue(undefined);
    plugin.app = {
      vault: { adapter: { write: writeSpy } },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    plugin.markHashCacheDirty();
    vi.advanceTimersByTime(29_999);
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('flush occurs after debounce period of inactivity', () => {
    const plugin = createPlugin();
    const writeSpy = vi.fn().mockResolvedValue(undefined);
    plugin.app = {
      vault: { adapter: { write: writeSpy } },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    plugin.markHashCacheDirty();
    vi.advanceTimersByTime(30_000);
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  it('debounce restarts on each dirty mark', () => {
    const plugin = createPlugin();
    const writeSpy = vi.fn().mockResolvedValue(undefined);
    plugin.app = {
      vault: { adapter: { write: writeSpy } },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    plugin.markHashCacheDirty();
    vi.advanceTimersByTime(20_000);
    plugin.markHashCacheDirty(); // restart debounce
    vi.advanceTimersByTime(20_000);
    // 40s total, but only 20s since last dirty - no flush yet
    expect(writeSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(10_000);
    // 30s since last dirty - flush
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  it('max cap forces flush during continuous activity', () => {
    const plugin = createPlugin();
    const writeSpy = vi.fn().mockResolvedValue(undefined);
    plugin.app = {
      vault: { adapter: { write: writeSpy } },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    // Simulate continuous editing: dirty mark every 10 seconds
    for (let i = 0; i < 30; i++) {
      plugin.markHashCacheDirty();
      vi.advanceTimersByTime(10_000);
    }
    // After 300s (5 min) the max cap should have forced a flush
    expect(writeSpy).toHaveBeenCalled();
  });

  it('flushHashCache resets dirty flag and _hashCacheFirstDirtyAt', async () => {
    const plugin = createPlugin();
    plugin.app = {
      vault: {
        adapter: {
          write: vi.fn().mockResolvedValue(undefined),
          read: vi.fn().mockResolvedValue('{}'),
        },
      },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    plugin['_hashCacheDirty'] = true;
    plugin['_hashCacheFirstDirtyAt'] = Date.now();
    await plugin.flushHashCache();
    expect(plugin['_hashCacheDirty']).toBe(false);
    expect(plugin['_hashCacheFirstDirtyAt']).toBeNull();
  });

  it('re-marks dirty when debounced flush fails', async () => {
    const plugin = createPlugin();
    const writeError = new Error('disk full');
    const writeSpy = vi.fn().mockRejectedValue(writeError);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    plugin.app = {
      vault: { adapter: { write: writeSpy } },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    plugin.markHashCacheDirty();
    vi.advanceTimersByTime(30_000);

    // Wait for the rejected promise to settle
    await vi.waitFor(() => {
      expect(writeSpy).toHaveBeenCalledTimes(1);
    });
    // Allow microtask (.catch handler) to execute
    await Promise.resolve();

    expect(plugin['_hashCacheDirty']).toBe(true);
    errorSpy.mockRestore();
  });

  it('flushHashCache does nothing when not dirty', async () => {
    const plugin = createPlugin();
    const writeSpy = vi.fn();
    plugin.app = {
      vault: { adapter: { write: writeSpy } },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    await plugin.flushHashCache();
    expect(writeSpy).not.toHaveBeenCalled();
  });
});

describe('garbage collection', () => {
  it('removes orphaned entries whose files no longer exist', () => {
    const plugin = createPlugin();
    plugin.hashCache = {
      'exists.md': { hash: 'aaa', lastAccessed: 1000 },
      'deleted.md': { hash: 'bbb', lastAccessed: 2000 },
      'also-exists.md': { hash: 'ccc', lastAccessed: 3000 },
    };
    plugin.app = {
      vault: {
        getAbstractFileByPath: (path: string) => {
          if (path === 'exists.md' || path === 'also-exists.md')
            return { path };
          return null;
        },
      },
    } as any;

    plugin['garbageCollectHashCache']();

    expect(Object.keys(plugin.hashCache)).toEqual([
      'exists.md',
      'also-exists.md',
    ]);
    expect(plugin['_hashCacheDirty']).toBe(true);
  });

  it('does not mark dirty when no entries removed', () => {
    const plugin = createPlugin();
    plugin.hashCache = {
      'a.md': { hash: 'aaa', lastAccessed: 1000 },
    };
    plugin.app = {
      vault: {
        getAbstractFileByPath: () => ({ path: 'a.md' }),
      },
    } as any;

    plugin['garbageCollectHashCache']();

    expect(Object.keys(plugin.hashCache)).toEqual(['a.md']);
    expect(plugin['_hashCacheDirty']).toBe(false);
  });

  it('handles empty cache', () => {
    const plugin = createPlugin();
    plugin.hashCache = {};
    plugin.app = {
      vault: { getAbstractFileByPath: () => null },
    } as any;

    plugin['garbageCollectHashCache']();
    expect(plugin.hashCache).toEqual({});
    expect(plugin['_hashCacheDirty']).toBe(false);
  });
});

describe('LRU eviction', () => {
  it('evicts oldest entries when cache exceeds maxSize', () => {
    const plugin = createPlugin({ hashCacheMaxSize: 3 });
    plugin.hashCache = {
      'old.md': { hash: 'a', lastAccessed: 100 },
      'older.md': { hash: 'b', lastAccessed: 50 },
      'recent.md': { hash: 'c', lastAccessed: 300 },
      'mid.md': { hash: 'd', lastAccessed: 200 },
      'newest.md': { hash: 'e', lastAccessed: 500 },
    };

    plugin.evictOldestCacheEntries();

    expect(Object.keys(plugin.hashCache).sort()).toEqual([
      'mid.md',
      'newest.md',
      'recent.md',
    ]);
  });

  it('does nothing when cache is within limit', () => {
    const plugin = createPlugin({ hashCacheMaxSize: 10 });
    plugin.hashCache = {
      'a.md': { hash: 'a', lastAccessed: 100 },
      'b.md': { hash: 'b', lastAccessed: 200 },
    };

    plugin.evictOldestCacheEntries();

    expect(Object.keys(plugin.hashCache)).toEqual(['a.md', 'b.md']);
  });

  it('does not evict when maxSize is 0 (unlimited)', () => {
    const plugin = createPlugin({ hashCacheMaxSize: 0 });
    plugin.hashCache = {
      'a.md': { hash: 'a', lastAccessed: 100 },
      'b.md': { hash: 'b', lastAccessed: 200 },
      'c.md': { hash: 'c', lastAccessed: 300 },
    };

    plugin.evictOldestCacheEntries();

    expect(Object.keys(plugin.hashCache).length).toBe(3);
  });

  it('evicts down to exactly maxSize', () => {
    const plugin = createPlugin({ hashCacheMaxSize: 2 });
    plugin.hashCache = {
      'a.md': { hash: 'a', lastAccessed: 10 },
      'b.md': { hash: 'b', lastAccessed: 20 },
      'c.md': { hash: 'c', lastAccessed: 30 },
      'd.md': { hash: 'd', lastAccessed: 40 },
      'e.md': { hash: 'e', lastAccessed: 50 },
    };

    plugin.evictOldestCacheEntries();

    expect(Object.keys(plugin.hashCache).length).toBe(2);
    expect(plugin.hashCache['d.md']).toBeDefined();
    expect(plugin.hashCache['e.md']).toBeDefined();
  });
});

describe('hash cache loading', () => {
  it('loads valid format', async () => {
    const plugin = createPlugin();
    const newFormat: Record<string, HashCacheEntry> = {
      'file1.md': { hash: 'hash1', lastAccessed: 1000 },
    };
    plugin.app = {
      vault: {
        adapter: {
          read: vi.fn().mockResolvedValue(JSON.stringify(newFormat)),
        },
      },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    await plugin['loadHashCache']();

    expect(plugin.hashCache['file1.md']).toEqual({
      hash: 'hash1',
      lastAccessed: 1000,
    });
    expect(plugin['_hashCacheDirty']).toBe(false);
  });

  it('returns empty cache when file does not exist', async () => {
    const plugin = createPlugin();
    plugin.app = {
      vault: {
        adapter: {
          read: vi.fn().mockRejectedValue(new Error('File not found')),
        },
      },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    await plugin['loadHashCache']();

    expect(plugin.hashCache).toEqual({});
  });

  it('filters out entries with invalid structure', async () => {
    const plugin = createPlugin();
    const corruptedData = JSON.stringify({
      'valid.md': { hash: 'abc123', lastAccessed: 1000 },
      'missing-hash.md': { lastAccessed: 2000 },
      'wrong-type.md': { hash: 123, lastAccessed: 3000 },
      'null-entry.md': null,
      'string-entry.md': 'not-an-object',
    });
    plugin.app = {
      vault: {
        adapter: {
          read: vi.fn().mockResolvedValue(corruptedData),
        },
      },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    await plugin['loadHashCache']();

    // Only the valid entry should survive
    expect(Object.keys(plugin.hashCache)).toEqual(['valid.md']);
    expect(plugin.hashCache['valid.md']).toEqual({
      hash: 'abc123',
      lastAccessed: 1000,
    });
    expect(plugin['_hashCacheDirty']).toBe(true);
  });

  it('returns empty cache for JSON array', async () => {
    const plugin = createPlugin();
    plugin.app = {
      vault: {
        adapter: {
          read: vi.fn().mockResolvedValue('[1, 2, 3]'),
        },
      },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    await plugin['loadHashCache']();

    expect(plugin.hashCache).toEqual({});
  });

  it('returns empty cache for JSON null', async () => {
    const plugin = createPlugin();
    plugin.app = {
      vault: {
        adapter: {
          read: vi.fn().mockResolvedValue('null'),
        },
      },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    await plugin['loadHashCache']();

    expect(plugin.hashCache).toEqual({});
  });

  it('does not mark dirty when all entries are valid', async () => {
    const plugin = createPlugin();
    const validData = JSON.stringify({
      'a.md': { hash: 'h1', lastAccessed: 100 },
      'b.md': { hash: 'h2', lastAccessed: 200 },
    });
    plugin.app = {
      vault: {
        adapter: {
          read: vi.fn().mockResolvedValue(validData),
        },
      },
    } as any;
    plugin['manifest'] = { dir: 'test-plugin' } as any;

    await plugin['loadHashCache']();

    expect(Object.keys(plugin.hashCache).length).toBe(2);
    expect(plugin['_hashCacheDirty']).toBe(false);
  });
});

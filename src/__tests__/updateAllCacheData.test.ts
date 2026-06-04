import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TFile } from 'obsidian';
import { UpdateAllCacheData } from '../UpdateAllCacheData';
import { createPlugin } from './helpers';

describe('UpdateAllCacheData (rebuild hash cache)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips the content hash check so already-cached files are not filtered out', () => {
    // Contract (CLAUDE.md "Bulk operations and hash bypass"): rebuilding the
    // cache must bypass the per-file hash check, otherwise files whose cached
    // hash already matches the current content are dropped from the rebuild.
    const modal = new UpdateAllCacheData(
      {} as unknown as never,
      createPlugin(),
    );
    expect(
      (modal as unknown as { skipHashCheck(): boolean }).skipHashCheck(),
    ).toBe(true);
  });

  it('persists the rebuilt cache to disk after completion', async () => {
    const plugin = createPlugin();
    const writeSpy = vi.fn().mockResolvedValue(undefined);
    plugin.app = {
      vault: {
        read: vi.fn().mockResolvedValue('# note body\n'),
        adapter: { write: writeSpy },
      },
    } as never;
    plugin['manifest'] = { dir: 'test-plugin' } as never;

    const modal = new UpdateAllCacheData(
      {} as unknown as never,
      plugin,
    ) as unknown as {
      processFile(file: TFile): Promise<void>;
      onComplete(): Promise<void>;
    };
    const file = { path: 'note.md' } as unknown as TFile;

    await modal.processFile(file);
    // Sanity: the rebuild updated the in-memory cache.
    expect(plugin.hashCache['note.md']).toBeDefined();

    await modal.onComplete();

    // Root cause: onComplete must mark the cache dirty before flushing,
    // otherwise flushHashCache() short-circuits on its `!_hashCacheDirty`
    // guard and the rebuilt cache is never written — lost on next reload.
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const persisted = JSON.parse(
      writeSpy.mock.calls[0]![1] as string,
    ) as Record<string, unknown>;
    expect(persisted['note.md']).toBeDefined();
  });
});

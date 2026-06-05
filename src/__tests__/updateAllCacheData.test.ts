import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';
import { UpdateAllCacheData } from '../UpdateAllCacheData';

function mockFile(path: string): TFile {
  return { path, stat: { ctime: 0, mtime: 0, size: 0 } } as unknown as TFile;
}

class Testable extends UpdateAllCacheData {
  public setFiles(files: TFile[]) {
    (this as any).files = files;
  }
  public forceOpen() {
    (this as any).opened = true;
  }
  public run() {
    return this.rebuildAll(() => {});
  }
}

describe('UpdateAllCacheData rebuild', () => {
  it('rebuilds the cache for every file and flushes on completion', async () => {
    const plugin = createPlugin();
    const direct: string[] = [];
    let evicted = false;
    let markedDirty = false;
    let flushed = false;
    (plugin as any).populateCacheForFileDirect = async (f: TFile) => {
      direct.push(f.path);
    };
    (plugin as any).evictOldestCacheEntries = () => {
      evicted = true;
    };
    (plugin as any).markHashCacheDirty = () => {
      markedDirty = true;
    };
    (plugin as any).flushHashCache = async () => {
      flushed = true;
    };

    const modal = new Testable({} as any, plugin);
    modal.forceOpen();
    modal.setFiles([mockFile('a.md'), mockFile('b.md')]);
    const res = await modal.run();

    expect(direct).toEqual(['a.md', 'b.md']);
    expect(res).toEqual({ processed: 2, errors: 0 });
    expect(evicted).toBe(true);
    expect(markedDirty).toBe(true);
    expect(flushed).toBe(true);
    expect(plugin.bulkRunning).toBe(false);
  });

  it('still flushes when the file list is empty', async () => {
    const plugin = createPlugin();
    let flushed = false;
    (plugin as any).evictOldestCacheEntries = () => {};
    (plugin as any).markHashCacheDirty = () => {};
    (plugin as any).flushHashCache = async () => {
      flushed = true;
    };

    const modal = new Testable({} as any, plugin);
    modal.forceOpen();
    modal.setFiles([]);
    const res = await modal.run();

    expect(res).toEqual({ processed: 0, errors: 0 });
    expect(flushed).toBe(true);
  });
});

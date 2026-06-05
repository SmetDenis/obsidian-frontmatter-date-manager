import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from '../helpers';
import { applyFrontmatterWrite } from '../../bulk/write';

function createMockFile(path: string): TFile {
  return {
    path,
    stat: { ctime: 1000, mtime: 2000, size: 100 },
    basename: path.replace(/\.md$/, ''),
    extension: 'md',
    name: path.split('/').pop() ?? path,
    vault: {} as any,
    parent: null,
  } as unknown as TFile;
}

function createApp(capture: { argCount?: number; options?: unknown }) {
  return {
    fileManager: {
      processFrontMatter: async (...args: unknown[]) => {
        capture.argCount = args.length;
        capture.options = args[2];
        (args[1] as (fm: Record<string, unknown>) => void)({});
      },
    },
  } as any;
}

describe('applyFrontmatterWrite', () => {
  it('writes without an options argument, sets the self-trigger guard, refreshes cache', async () => {
    const plugin = createPlugin({ enableContentHashCheck: true });
    const cacheCalls: string[] = [];
    (plugin as any).populateCacheForFile = async (f: TFile) => {
      cacheCalls.push(f.path);
    };
    const file = createMockFile('a.md');
    const capture: { argCount?: number; options?: unknown } = {};
    const app = createApp(capture);

    await applyFrontmatterWrite(app, plugin, file, (fm) => {
      fm.created = 'x';
    });

    expect(capture.options).toBeUndefined();
    expect(capture.argCount).toBe(2);
    expect(plugin.lastPluginWriteMtime.get('a.md')).toBe(2000);
    expect(cacheCalls).toContain('a.md');
  });

  it('skips the cache refresh when content hash check is disabled', async () => {
    const plugin = createPlugin({ enableContentHashCheck: false });
    const cacheCalls: string[] = [];
    (plugin as any).populateCacheForFile = async (f: TFile) => {
      cacheCalls.push(f.path);
    };
    const file = createMockFile('b.md');
    const app = createApp({});

    await applyFrontmatterWrite(app, plugin, file, () => {});

    expect(plugin.lastPluginWriteMtime.get('b.md')).toBe(2000);
    expect(cacheCalls).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import * as obsidian from 'obsidian';
import { TFile } from 'obsidian';
import { createPlugin } from '../helpers';
import { applyFrontmatterWrite, BulkSkipped } from '../../bulk/write';

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

  // A bulk run must never merge into a live buffer. It SKIPS visibly instead of
  // deferring: a run can be cancelled or its modal closed, and a later silent
  // write would break the mandatory dry-run preview contract.
  it('throws BulkSkipped and writes nothing when the note has unsaved changes', async () => {
    const plugin = createPlugin({ enableContentHashCheck: true });
    const file = createMockFile('c.md');
    (plugin as any).app = {
      workspace: {
        getLeavesOfType: () => [
          {
            view: Object.assign(new obsidian.MarkdownView(), {
              file,
              dirty: true,
            }),
          },
        ],
      },
    };
    const capture: { argCount?: number } = {};
    const app = createApp(capture);

    await expect(
      applyFrontmatterWrite(app, plugin, file, () => {}),
    ).rejects.toBeInstanceOf(BulkSkipped);

    expect(capture.argCount).toBeUndefined();
    expect(plugin.lastPluginWriteMtime.has('c.md')).toBe(false);
  });
});

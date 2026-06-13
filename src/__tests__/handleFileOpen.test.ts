import { describe, it, expect, vi } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';
import { FrontmatterDateManagerSettings } from '../Settings';

function createTFile(path: string): TFile {
  const name = path.split('/').pop() || '';
  return {
    path,
    name,
    extension: name.split('.').pop() || '',
    basename: name.replace(/\.[^.]+$/, ''),
    stat: { ctime: 0, mtime: 0, size: 1 },
    vault: {} as any,
    parent: null,
  } as unknown as TFile;
}

function setupOpenPlugin(
  overrides: Partial<FrontmatterDateManagerSettings> = {},
) {
  const plugin = createPlugin({ timezone: 'UTC', ...overrides });
  plugin.recompileFilterRules();
  const processFrontMatter = vi.fn(
    (_file: TFile, cb: (fm: Record<string, unknown>) => void) => {
      cb({});
      return Promise.resolve();
    },
  );
  plugin.app = {
    vault: { read: vi.fn().mockResolvedValue('# note body') },
    fileManager: { processFrontMatter },
    metadataCache: { getFileCache: () => ({ frontmatter: {} }) },
  } as any;
  // enableContentHashCheck defaults to true → handleFileOpen refreshes the
  // hash cache after writing. Stub it so the test does not touch real cache I/O.
  (plugin as any).populateCacheForFile = vi.fn().mockResolvedValue(undefined);
  return { plugin, processFrontMatter };
}

describe('handleFileOpen - viewed stamping respects shouldFileBeIgnored', () => {
  it('does not write frontmatter when opening Canvas.md', async () => {
    const { plugin, processFrontMatter } = setupOpenPlugin();
    await (plugin as any).handleFileOpen(createTFile('Canvas.md'));
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('does not write frontmatter when opening canvas.md (lowercase)', async () => {
    const { plugin, processFrontMatter } = setupOpenPlugin();
    await (plugin as any).handleFileOpen(createTFile('canvas.md'));
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('writes viewed frontmatter when opening a normal markdown file', async () => {
    const { plugin, processFrontMatter } = setupOpenPlugin();
    await (plugin as any).handleFileOpen(createTFile('notes/daily.md'));
    expect(processFrontMatter).toHaveBeenCalledOnce();
  });
});

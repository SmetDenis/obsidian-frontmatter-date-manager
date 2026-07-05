import { describe, it, expect, vi } from 'vitest';
import * as obsidian from 'obsidian';
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
  openFile?: TFile,
) {
  const plugin = createPlugin({ timezone: 'UTC', ...overrides });
  plugin.recompileFilterRules();
  const processFrontMatter = vi.fn(
    (
      _file: TFile,
      cb: (fm: Record<string, unknown>) => void,
      _options?: unknown,
    ) => {
      cb({});
      return Promise.resolve();
    },
  );
  // When openFile is provided the workspace reports it as open in a Markdown
  // editor leaf, so handleFileOpen pins ctime/mtime (viewing must not reload the
  // just-opened editor). Otherwise no leaf is open.
  const openLeaves = openFile
    ? [{ view: Object.assign(new obsidian.MarkdownView(), { file: openFile }) }]
    : [];
  plugin.app = {
    vault: { read: vi.fn().mockResolvedValue('# note body') },
    fileManager: { processFrontMatter },
    metadataCache: { getFileCache: () => ({ frontmatter: {} }) },
    workspace: { getLeavesOfType: vi.fn(() => openLeaves) },
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

  it('pins ctime/mtime when the opened note is loaded in an editor, so viewing does not reload it', async () => {
    const file = createTFile('notes/daily.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file);
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).toHaveBeenCalledOnce();
    expect(processFrontMatter.mock.calls[0]?.[2]).toEqual({
      ctime: file.stat.ctime,
      mtime: file.stat.mtime,
    });
  });
});

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
  leafDirty: unknown[] = [],
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
  // When openFile is provided the workspace reports it as open in Markdown
  // leaves - one per `leafDirty` entry (its value becomes the leaf's private
  // `dirty` flag), or a single clean leaf when the list is empty.
  const dirtyFlags = leafDirty.length > 0 ? leafDirty : [false];
  const openLeaves = openFile
    ? dirtyFlags.map((dirty) => ({
        view: Object.assign(new obsidian.MarkdownView(), {
          file: openFile,
          dirty,
          getViewData: () => '# note body',
        }),
      }))
    : [];
  plugin.app = {
    vault: {
      read: vi.fn().mockResolvedValue('# note body'),
      cachedRead: vi.fn().mockResolvedValue('# note body'),
    },
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

  it('stamps a clean open note with no write options', async () => {
    const file = createTFile('notes/daily.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file);
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).toHaveBeenCalledOnce();
    // No { ctime, mtime } pin: on a clean buffer the editor absorbs the write,
    // and the pin previously made a size-neutral write invisible to it.
    // Accepted: with last-viewed on, opening a note moves its mtime.
    expect(processFrontMatter.mock.calls[0]?.[2]).toBeUndefined();
  });

  // The viewed stamp is DROPPED (not deferred) when a buffer is dirty: `viewed`
  // means "at open", so a later write would record a false time.
  it('drops the viewed stamp when ANOTHER leaf of the same file is dirty', async () => {
    const file = createTFile('notes/daily.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file, [
      false,
      true,
    ]);
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('fails closed when a leaf reports a non-boolean dirty and its buffer differs from disk', async () => {
    const file = createTFile('notes/daily.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file, [
      undefined,
    ]);
    (plugin as any).app.vault.cachedRead = vi
      .fn()
      .mockResolvedValue('different on disk');
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).not.toHaveBeenCalled();
  });
});

describe('handleFileOpen - viewed no-op-write guard', () => {
  it('does not rewrite viewed when the formatted value is unchanged [coarse format]', async () => {
    const s = { headerLastViewed: 'viewed', dateFormat: 'yyyy-MM-dd' };
    const { plugin, processFrontMatter } = setupOpenPlugin(s);
    // Under a coarse format, "now" formats to the same value already stored, so
    // re-opening the note the same day would otherwise rewrite the same value.
    const today = plugin.formatDate(new Date()); // e.g. '2026-06-14'
    (plugin as any).app.metadataCache = {
      getFileCache: () => ({ frontmatter: { viewed: today } }),
    };
    await (plugin as any).handleFileOpen(createTFile('notes/daily.md'));
    expect(processFrontMatter).not.toHaveBeenCalled();
  });
});

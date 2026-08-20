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
  opts: {
    // `null` simulates a metadataCache miss (file not indexed yet).
    frontmatter?: Record<string, unknown> | null;
    // Raw text vault.read returns - the cache-miss fallback reads it.
    fileContent?: string;
    // Open Excalidraw views: shapes mirroring the public ExcalidrawView
    // members the guard reads. Sentinels simulate API drift (fails closed).
    excalidrawLeaves?: Array<{
      path?: string;
      isDirty?: boolean | 'missing';
      saving?: boolean;
    }>;
  } = {},
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
  const excalidrawLeaves = (opts.excalidrawLeaves ?? []).map((spec) => {
    const view: Record<string, unknown> = {
      file: { path: spec.path ?? openFile?.path },
      semaphores: { saving: spec.saving ?? false, autosaving: false },
      excalidrawAPI: {},
    };
    if (spec.isDirty !== 'missing') {
      view.isDirty = () => spec.isDirty ?? false;
    }
    return { view };
  });
  plugin.app = {
    vault: {
      read: vi.fn().mockResolvedValue(opts.fileContent ?? '# note body'),
      cachedRead: vi.fn().mockResolvedValue(opts.fileContent ?? '# note body'),
    },
    fileManager: { processFrontMatter },
    metadataCache: {
      getFileCache: () =>
        opts.frontmatter === null
          ? null
          : { frontmatter: opts.frontmatter ?? {} },
    },
    workspace: {
      // Type-aware like the real workspace: Markdown leaves must never reach
      // the Excalidraw guard branch (it would fail closed on them).
      getLeavesOfType: vi.fn((type: string) =>
        type === 'markdown'
          ? openLeaves
          : type === 'excalidraw'
            ? excalidrawLeaves
            : [],
      ),
    },
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

describe('handleFileOpen - Excalidraw drawings never get a viewed stamp', () => {
  // The file-open write is the ONLY FDM write that can land on a drawing idle
  // > 5 min, which triggers Excalidraw's full reload(true) (flash, scene
  // re-parse, undo loss). So `viewed` is excluded for drawings regardless of
  // the trackExcalidraw toggle - a deliberate scope cut.
  const DRAWING = { 'excalidraw-plugin': 'parsed' };

  it.each([[true], [false]])(
    'does not stamp a drawing when trackExcalidraw is %s',
    async (trackExcalidraw) => {
      const file = createTFile('art/sketch.md');
      const { plugin, processFrontMatter } = setupOpenPlugin(
        { trackExcalidraw },
        file,
        [],
        { frontmatter: DRAWING },
      );
      await (plugin as any).handleFileOpen(file);
      expect(processFrontMatter).not.toHaveBeenCalled();
    },
  );

  it('does not stamp a drawing whose marker is not in metadataCache yet', async () => {
    // Cold cache right after startup: the marker is invisible to
    // metadataCache, so classification falls back to the file text. Without
    // that fallback the first open of a drawing after a restart would stamp
    // it - the one write aimed at an idle drawing.
    const file = createTFile('art/unindexed.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file, [], {
      frontmatter: null,
      fileContent: '---\nexcalidraw-plugin: parsed\n---\n\ndrawing body',
    });
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('still stamps an ordinary note whose cache entry is missing', async () => {
    const file = createTFile('notes/unindexed.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file, [], {
      frontmatter: null,
      fileContent: '---\ntitle: plain\n---\n\nbody',
    });
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).toHaveBeenCalledOnce();
  });

  it('still stamps a plain note (control)', async () => {
    const file = createTFile('notes/plain.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file);
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).toHaveBeenCalledOnce();
  });
});

describe('handleFileOpen - Excalidraw views of a note block the viewed stamp', () => {
  // A Markdown note can also be open in an Excalidraw view only in exotic
  // setups, but the guard is shared (getWriteBlock): a dirty/unknown drawing
  // view of the file must drop the stamp, and a clean one must not.
  it('drops the stamp when a dirty Excalidraw view shows the file', async () => {
    const file = createTFile('notes/plain.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file, [], {
      excalidrawLeaves: [{ isDirty: true }],
    });
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('fails closed when the Excalidraw view lacks isDirty (API drift)', async () => {
    const file = createTFile('notes/plain.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file, [], {
      excalidrawLeaves: [{ isDirty: 'missing' }],
    });
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).not.toHaveBeenCalled();
  });

  it('stamps when the Excalidraw view is mounted, idle, and clean', async () => {
    const file = createTFile('notes/plain.md');
    const { plugin, processFrontMatter } = setupOpenPlugin({}, file, [], {
      excalidrawLeaves: [{ isDirty: false }],
    });
    await (plugin as any).handleFileOpen(file);
    expect(processFrontMatter).toHaveBeenCalledOnce();
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

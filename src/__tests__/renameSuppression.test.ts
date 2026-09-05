import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS, FrontmatterDateManagerSettings } from '../Settings';
import {
  RENAME_SUPPRESSION_MAX_BYTES,
  RENAME_SUPPRESSION_MAX_SOURCES,
} from '../constants';

// Coverage for the experimental "skip the date after a rename" machinery
// (issue #18): the arming preconditions, every disarm path, and the byte-exact
// verification. The invariant under test throughout is that anything unexpected
// leaves the content hash alone, so the normal pipeline stamps the note exactly
// as it does today.

function tfile(path: string): TFile {
  const f = new TFile();
  f.path = path;
  const name = path.split('/').pop() ?? '';
  f.name = name;
  f.extension = name.split('.').pop() ?? '';
  f.basename = name.replace(/\.[^.]+$/, '');
  f.stat = { ctime: 0, mtime: 0, size: 0 };
  return f;
}

interface FileSpec {
  /** File text; link references are derived from it by a tiny scanner. */
  content: string;
  /** Text the file holds AFTER Obsidian rewrote the links. */
  after?: string;
}

interface SetupOpts {
  settings?: Partial<FrontmatterDateManagerSettings>;
  files: Record<string, FileSpec>;
  /** sourcePath -> linked target path, as metadataCache.resolvedLinks holds it. */
  resolvedLinks?: Record<string, Record<string, number>>;
  /** null makes the rename look like a plain Vault.rename (no link rewrite). */
  inProgressUpdates?: unknown;
  /** What fileToLinktext returns for the renamed file. */
  linktext?: string;
  /** Skip seeding the hash cache for these paths. */
  withoutHashFor?: string[];
}

const WIKILINK_SCAN = /!?\[\[[^\]]*]]|\[[^\]]*]\([^)]*\)/g;

// Stand-in for the metadata cache: finds every wikilink / markdown link in the
// text with their real offsets, exactly the shape snapshotRefs consumes.
function scanRefs(content: string) {
  const links = [];
  for (const m of content.matchAll(WIKILINK_SCAN)) {
    const original = m[0];
    const start = m.index;
    const inner = original.startsWith('[[')
      ? original.slice(2, -2)
      : original.startsWith('![[')
        ? original.slice(3, -2)
        : (/\(([^)]*)\)/.exec(original)?.[1] ?? '');
    const link = inner.split('|')[0] ?? '';
    links.push({
      original,
      link,
      position: {
        start: { offset: start, line: 0, col: 0 },
        end: { offset: start + original.length, line: 0, col: 0 },
      },
    });
  }
  return links;
}

function setup(opts: SetupOpts) {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = {
    ...DEFAULT_SETTINGS,
    enableAutoUpdate: true,
    experimentalSkipRenameLinkUpdates: true,
    ...opts.settings,
  };
  plugin.recompileFilterRules();

  const disk = new Map<string, string>();
  const files = new Map<string, TFile>();
  for (const [path, spec] of Object.entries(opts.files)) {
    disk.set(path, spec.content);
    files.set(path, tfile(path));
  }

  // Resolves once the "link update queue" is released - the stand-in for
  // Obsidian's fileManager.updateQueue.promise.
  let release!: () => void;
  const queuePromise = new Promise<void>((r) => {
    release = r;
  });

  plugin.app = {
    vault: {
      getAbstractFileByPath: (p: string) => files.get(p) ?? null,
      read: async (f: TFile) => {
        const c = disk.get(f.path);
        if (c === undefined) throw new Error(`missing ${f.path}`);
        return c;
      },
      cachedRead: async (f: TFile) => disk.get(f.path) ?? '',
    },
    workspace: { getLeavesOfType: () => [] },
    metadataCache: {
      resolvedLinks: opts.resolvedLinks ?? {},
      getFileCache: (f: TFile) => {
        const spec = opts.files[f.path];
        if (!spec) return null;
        return { links: scanRefs(spec.content), embeds: [] };
      },
      fileToLinktext: () => opts.linktext ?? 'New',
    },
    fileManager: {
      inProgressUpdates:
        'inProgressUpdates' in opts ? opts.inProgressUpdates : [],
      updateQueue: { promise: queuePromise },
    },
  } as unknown as FrontmatterDateManagerPlugin['app'];

  for (const [path, spec] of Object.entries(opts.files)) {
    if (opts.withoutHashFor?.includes(path)) continue;
    plugin.hashCache[path] = {
      hash: plugin.hashString(plugin.getContentForHashing(spec.content.trim())),
      lastAccessed: Date.now(),
    };
  }

  // Applies the rewrite Obsidian would have performed, then releases the queue.
  const finishRewrite = async () => {
    for (const [path, spec] of Object.entries(opts.files)) {
      if (spec.after !== undefined) disk.set(path, spec.after);
    }
    release();
    // Two macrotask turns: one for the queue await, one for the per-file
    // verification chain.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  };

  // A folder (or non-Markdown) rename event, which carries no TFile.
  const renameNonFile = (oldPath: string) => {
    const folder = { path: oldPath, name: oldPath } as unknown as Parameters<
      typeof plugin.armRenameSuppression
    >[0];
    plugin.armRenameSuppression(folder, oldPath);
  };

  const rename = (oldPath: string, newPath: string) => {
    const f = files.get(oldPath);
    if (!f) throw new Error(`no file ${oldPath}`);
    files.delete(oldPath);
    const content = disk.get(oldPath) ?? '';
    disk.delete(oldPath);
    f.path = newPath;
    files.set(newPath, f);
    disk.set(newPath, content);
    plugin.armRenameSuppression(f, oldPath);
  };

  return { plugin, rename, renameNonFile, finishRewrite, disk, files };
}

/** Does the plugin now consider this file unchanged (i.e. no stamp incoming)? */
async function isUnchanged(
  plugin: FrontmatterDateManagerPlugin,
  path: string,
  disk: Map<string, string>,
): Promise<boolean> {
  const entry = plugin.hashCache[path];
  if (!entry) return false;
  const current = plugin.hashString(
    plugin.getContentForHashing((disk.get(path) ?? '').trim()),
  );
  return current === entry.hash;
}

const LINKING = {
  content: '---\ncreated: 2020-01-01\n---\n\nsee [[Old]] here\n',
  after: '---\ncreated: 2020-01-01\n---\n\nsee [[New]] here\n',
};

function baseOpts(over: Partial<SetupOpts> = {}): SetupOpts {
  return {
    files: { 'Old.md': { content: '# old\n' }, 'src.md': { ...LINKING } },
    resolvedLinks: { 'src.md': { 'Old.md': 1 } },
    linktext: 'New',
    ...over,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('rename suppression - the happy path', () => {
  it('refreshes the hash when the rewrite matches the prediction exactly', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(baseOpts());
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(true);
  });

  it('handles an alias, an embed and a subpath in one file', async () => {
    const content =
      'a [[Folder/Old|Old]] b ![[Folder/Old]] c [[Folder/Old#Head]] d\n';
    const after =
      'a [[Folder/New|New]] b ![[Folder/New]] c [[Folder/New#Head]] d\n';
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({
        files: {
          'Folder/Old.md': { content: '# old\n' },
          'src.md': { content, after },
        },
        resolvedLinks: { 'src.md': { 'Folder/Old.md': 3 } },
        linktext: 'Folder/New',
      }),
    );
    rename('Folder/Old.md', 'Folder/New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(true);
  });

  it('leaves links to other notes alone', async () => {
    const content = 'see [[Old]] and [[Other]]\n';
    const after = 'see [[New]] and [[Other]]\n';
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({
        files: {
          'Old.md': { content: '# old\n' },
          'Other.md': { content: '# other\n' },
          'src.md': { content, after },
        },
        resolvedLinks: { 'src.md': { 'Old.md': 1, 'Other.md': 1 } },
      }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(true);
  });
});

describe('rename suppression - arming preconditions', () => {
  it('arms nothing when the setting is off', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({ settings: { experimentalSkipRenameLinkUpdates: false } }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('arms nothing when auto-update is off', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({ settings: { enableAutoUpdate: false } }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('arms nothing for a plain Vault.rename (inProgressUpdates is null)', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({ inProgressUpdates: null }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('arms nothing while a bulk operation is running', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(baseOpts());
    plugin.bulkRunning = true;
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('arms nothing when the candidate count exceeds the cap', async () => {
    const files: Record<string, FileSpec> = {
      'Old.md': { content: '# old\n' },
    };
    const resolvedLinks: Record<string, Record<string, number>> = {};
    for (let i = 0; i <= RENAME_SUPPRESSION_MAX_SOURCES; i++) {
      files[`s${i}.md`] = { ...LINKING };
      resolvedLinks[`s${i}.md`] = { 'Old.md': 1 };
    }
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({ files, resolvedLinks }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 's0.md', disk)).toBe(false);
  });

  it('cancels the batch when a second rename arrives (folder move)', async () => {
    const { plugin, rename, finishRewrite, disk, files } = setup(
      baseOpts({
        files: {
          'F/Old.md': { content: '# old\n' },
          'F/Second.md': { content: '# second\n' },
          'src.md': { ...LINKING },
        },
        resolvedLinks: { 'src.md': { 'F/Old.md': 1 } },
      }),
    );
    rename('F/Old.md', 'G/Old.md');
    // The moved sibling fires its own rename event; that cancels the batch.
    const second = files.get('F/Second.md')!;
    plugin.armRenameSuppression(second, 'F/Second.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('skips a source with no hash-cache baseline', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({ withoutHashFor: ['src.md'] }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('skips a source whose baseline hash is stale', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(baseOpts());
    plugin.hashCache['src.md'] = { hash: 'stale', lastAccessed: Date.now() };
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('skips a source that is mid-write', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(baseOpts());
    (plugin as unknown as { processingFiles: Set<string> }).processingFiles.add(
      'src.md',
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('skips a source whose editor buffer holds unsaved changes', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(baseOpts());
    vi.spyOn(plugin, 'getWriteBlock').mockResolvedValue('markdown');
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('disarms after a rename where every candidate was skipped', async () => {
    // Regression: an early return that left the batch armed made the NEXT
    // rename look like a folder move, so the feature silently skipped it.
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({ withoutHashFor: ['src.md'] }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
    // Nothing is left armed, so the next rename arms on its own merits rather
    // than cancelling itself.
    expect(
      (plugin as unknown as { renameSuppression: unknown }).renameSuppression,
    ).toBeNull();
  });

  it('arms nothing when content-hash change detection is off', async () => {
    // The only thing suppression does is refresh the hash cache, and
    // shouldFileBeIgnored reads that cache only when this setting is on - so
    // with it off the feature could do all the work and still change nothing.
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({ settings: { enableContentHashCheck: false } }),
    );
    const refresh = vi.spyOn(plugin, 'populateCacheForFile');
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(refresh).not.toHaveBeenCalled();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('latches a folder move shut, even when only a later child is linked', async () => {
    // Regression: the exclusion used to CLEAR the slot instead of latching it,
    // and a child with no backlinks returned before taking the slot at all. So
    // in a folder move where the source links only to the LAST child, every
    // earlier child stepped aside and that child armed and suppressed.
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({
        files: {
          'F/a.md': { content: '# a\n' },
          'F/b.md': { content: '# b\n' },
          'F/c.md': { content: '# c\n' },
          'src.md': {
            content: '---\ncreated: 2020-01-01\n---\n\nsee [[F/c]] here\n',
            after: '---\ncreated: 2020-01-01\n---\n\nsee [[G/c]] here\n',
          },
        },
        resolvedLinks: { 'src.md': { 'F/c.md': 1 } },
        linktext: 'G/c',
      }),
    );
    rename('F/a.md', 'G/a.md');
    rename('F/b.md', 'G/b.md');
    rename('F/c.md', 'G/c.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('latches on the folder event itself', async () => {
    const { plugin, rename, renameNonFile, finishRewrite, disk } = setup(
      baseOpts({
        files: {
          'F/Old.md': { content: '# old\n' },
          'src.md': {
            content: '---\ncreated: 2020-01-01\n---\n\nsee [[F/Old]] here\n',
            after: '---\ncreated: 2020-01-01\n---\n\nsee [[G/Old]] here\n',
          },
        },
        resolvedLinks: { 'src.md': { 'F/Old.md': 1 } },
        linktext: 'G/Old',
      }),
    );
    // Obsidian fires the folder's own rename event alongside its children.
    renameNonFile('F');
    rename('F/Old.md', 'G/Old.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('skips a candidate larger than the memory budget', async () => {
    const { plugin, rename, finishRewrite, disk, files } = setup(baseOpts());
    files.get('src.md')!.stat.size = RENAME_SUPPRESSION_MAX_BYTES + 1;
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('aborts mid-verify when the batch is cancelled before the cache write', async () => {
    // onunload / a settings change must be able to stop a verify loop already
    // in flight - otherwise a suppression landing after unload re-arms the
    // hash-cache flush timer that unload had just cleared.
    const { plugin, rename, finishRewrite, disk } = setup(baseOpts());
    const real = plugin.getWriteBlock.bind(plugin);
    let calls = 0;
    vi.spyOn(plugin, 'getWriteBlock').mockImplementation(async (f) => {
      calls++;
      // Call 1 is the arm-time gate; call 2 is Phase C for the same file.
      if (calls === 2) plugin.cancelRenameSuppression();
      return real(f);
    });
    const refresh = vi.spyOn(plugin, 'populateCacheForFile');
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(refresh).not.toHaveBeenCalled();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('suppresses nothing once the generation is bumped', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(baseOpts());
    rename('Old.md', 'New.md');
    plugin.cancelRenameSuppression();
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });
});

describe('rename suppression - verification', () => {
  it('suppresses nothing when the file differs from the prediction', async () => {
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({
        files: {
          'Old.md': { content: '# old\n' },
          'src.md': {
            content: LINKING.content,
            // The user typed while the "update links?" modal was open.
            after: LINKING.after.replace('here', 'here, and typed'),
          },
        },
      }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('suppresses nothing when a markdown link points at the renamed note', async () => {
    const content = 'see [label](Old.md) here\n';
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({
        files: {
          'Old.md': { content: '# old\n' },
          'src.md': { content, after: 'see [label](New.md) here\n' },
        },
      }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('suppresses nothing when an escaped pipe points at the renamed note', async () => {
    const content = 'see [[Old\\|x]] here\n';
    const { plugin, rename, finishRewrite, disk } = setup(
      baseOpts({
        files: {
          'Old.md': { content: '# old\n' },
          'src.md': { content, after: 'see [[New\\|x]] here\n' },
        },
      }),
    );
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(await isUnchanged(plugin, 'src.md', disk)).toBe(false);
  });

  it('emits no replacement when the link text would not change', async () => {
    // fileToLinktext returns the text the link already carries, so Obsidian
    // rewrites nothing - and the prediction must not either, or the byte
    // comparison would drift. With zero replacements the cache is left alone.
    const { plugin, rename, finishRewrite } = setup(
      baseOpts({
        files: {
          'Old.md': { content: '# old\n' },
          'src.md': { content: LINKING.content },
        },
        linktext: 'Old',
      }),
    );
    const refresh = vi.spyOn(plugin, 'populateCacheForFile');
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes the hash from the content it validated, not a re-read', async () => {
    const { plugin, rename, finishRewrite } = setup(baseOpts());
    const refresh = vi.spyOn(plugin, 'populateCacheForFile');
    rename('Old.md', 'New.md');
    await finishRewrite();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh.mock.calls[0]?.[1]).toBe(LINKING.after.trim());
  });
});

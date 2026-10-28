import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';
import {
  BulkPopulateTimestampsModal,
  OverrideMode,
  PopulateMode,
} from '../BulkPopulateTimestampsModal';
import { ReformatDateModal, ReformatScope } from '../ReformatDateModal';
import { FindInversionsModal } from '../FindInversionsModal';
import { FrontmatterDateManagerSettings } from '../Settings';
import { BulkSkipped } from '../bulk/write';

// The three date-writing bulk tools with nested property paths: they read
// through the same paths the automatic pipeline writes, never propose a value
// whose place cannot take it, and re-check the live frontmatter at write time.

const ts2023 = new Date(2023, 5, 20, 14, 0).getTime();
const ts2024 = new Date(2024, 0, 15, 10, 30).getTime();

function realFile(path = 'notes/a.md'): TFile {
  return Object.assign(new TFile(), {
    path,
    name: path.split('/').pop() ?? path,
    basename: 'a',
    extension: 'md',
    stat: { ctime: ts2023, mtime: ts2024, size: 100 },
  });
}

function makeApp(
  file: TFile,
  cached: Record<string, unknown>,
  live: Record<string, unknown> = cached,
) {
  const writes: Record<string, unknown>[] = [];
  const app = {
    metadataCache: { getFileCache: () => ({ frontmatter: cached }) },
    vault: { getAbstractFileByPath: () => file },
    workspace: { getLeavesOfType: () => [] },
    fileManager: {
      processFrontMatter: async (
        _f: TFile,
        cb: (fm: Record<string, unknown>) => void,
      ) => {
        const fm = structuredClone(live);
        cb(fm);
        writes.push(fm);
      },
    },
  } as any;
  return { app, writes };
}

function plugin(settings: Partial<FrontmatterDateManagerSettings>) {
  const p = createPlugin({ enableContentHashCheck: false, ...settings });
  return p;
}

class Populate extends BulkPopulateTimestampsModal {
  set(populate: PopulateMode, override: OverrideMode) {
    (this as any).populateMode = populate;
    (this as any).overrideMode = override;
  }
  preview(file: TFile) {
    return this.computePreviewEntry(file);
  }
  apply(entry: ReturnType<Populate['preview']>) {
    return this.applyTimestamps(entry);
  }
  get notWrittenRows() {
    return (this as any).notWritten as Array<{ label: string; reason: string }>;
  }
}

describe('Populate dates from file system with nested paths', () => {
  it('proposes and writes into a nested group, keeping other keys', async () => {
    const file = realFile();
    const { app, writes } = makeApp(file, { meta: { source: 'web' } });
    const modal = new Populate(
      app,
      plugin({ headerCreated: 'meta > created', headerUpdated: 'updated' }),
    );
    modal.set('both', 'fill-missing');
    const entry = modal.preview(file);
    expect(entry.willChange).toBe(true);
    expect(entry.skipped).toEqual([]);
    await modal.apply(entry);
    expect(writes[0]!.meta).toEqual({
      source: 'web',
      created: entry.proposedCreated,
    });
    expect(writes[0]!.updated).toBe(entry.proposedUpdated);
  });

  it('reads an existing nested value, so fill-missing keeps it', () => {
    const file = realFile();
    const { app } = makeApp(file, { meta: { created: '2020-01-01' } });
    const modal = new Populate(
      app,
      plugin({ headerCreated: 'meta > created' }),
    );
    modal.set('created', 'fill-missing');
    const entry = modal.preview(file);
    expect(entry.existingCreated).toBe('2020-01-01');
    expect(entry.willChange).toBe(false);
  });

  it('a parent that is not a group: nothing proposed for it, the reason is listed', () => {
    const file = realFile();
    const { app } = makeApp(file, { meta: 'draft' });
    const modal = new Populate(
      app,
      plugin({ headerCreated: 'meta > created', headerUpdated: 'updated' }),
    );
    modal.set('both', 'fill-missing');
    const entry = modal.preview(file);
    expect(entry.proposedCreated).toBeNull();
    expect(entry.proposedUpdated).not.toBeNull();
    expect(entry.skipped).toHaveLength(1);
    expect(entry.skipped[0]).toContain('"meta"');
  });

  it('overwrite-all never replaces a list sitting at a flat date name', () => {
    const file = realFile();
    const { app } = makeApp(file, { updated: ['2024-01-01', '2024-02-01'] });
    const modal = new Populate(app, plugin({}));
    modal.set('updated', 'overwrite-all');
    const entry = modal.preview(file);
    expect(entry.proposedUpdated).toBeNull();
    expect(entry.willChange).toBe(false);
    expect(entry.skipped).toHaveLength(1);
  });

  it('a stale cache refusing every value: the note is skipped, never re-serialized', async () => {
    const file = realFile();
    const { app, writes } = makeApp(file, {}, { meta: 'draft' });
    const modal = new Populate(
      app,
      plugin({ headerCreated: 'meta > created' }),
    );
    modal.set('created', 'fill-missing');
    await expect(modal.apply(modal.preview(file))).rejects.toBeInstanceOf(
      BulkSkipped,
    );
    expect(writes).toHaveLength(0);
  });

  it('a stale cache: the live refusal is reported, the rest is written', async () => {
    const file = realFile();
    const { app, writes } = makeApp(file, {}, { meta: 'draft' });
    const modal = new Populate(
      app,
      plugin({ headerCreated: 'meta > created', headerUpdated: 'updated' }),
    );
    modal.set('both', 'fill-missing');
    await modal.apply(modal.preview(file));
    expect(writes[0]!.meta).toBe('draft');
    expect(writes[0]!.updated).toBeDefined();
    expect(modal.notWrittenRows).toHaveLength(1);
    expect(modal.notWrittenRows[0]!.label).toBe('notes/a.md');
  });
});

class Reformat extends ReformatDateModal {
  setScope(scope: ReformatScope) {
    (this as any).reformatScope = scope;
  }
  preview(file: TFile) {
    return this.computePreviewEntry(file);
  }
  apply(file: TFile, entry: ReturnType<Reformat['preview']>) {
    return this.applyReformat(file, entry);
  }
}

describe('Reformat dates with nested paths', () => {
  it('converts and rewrites a nested value in place', async () => {
    const file = realFile();
    const { app, writes } = makeApp(file, {
      meta: { updated: '2024-01-15', other: 1 },
    });
    const modal = new Reformat(
      app,
      plugin({ headerUpdated: 'meta > updated' }),
    );
    modal.setScope('updated');
    const entry = modal.preview(file);
    expect(entry.updatedOldValue).toBe('2024-01-15');
    expect(entry.updatedNewValue).toBe('2024-01-15T00:00:00');
    await modal.apply(file, entry);
    expect(writes[0]!.meta).toEqual({
      updated: '2024-01-15T00:00:00',
      other: 1,
    });
  });

  it('a group at the date is a skip with its reason, not an unreadable date', () => {
    const file = realFile();
    const { app } = makeApp(file, { updated: { a: 1 } });
    const modal = new Reformat(app, plugin({}));
    modal.setScope('updated');
    const entry = modal.preview(file);
    expect(entry.updatedError).toBe(false);
    expect(entry.willChange).toBe(false);
    expect(entry.skipped).toHaveLength(1);
  });
});

class Inversions extends FindInversionsModal {
  set(strategy: string, entries: unknown[]) {
    (this as any).selectedStrategy = strategy;
    (this as any).invertedEntries = entries;
  }
}

describe('Find out-of-order dates with nested paths', () => {
  const inverted = {
    meta: { created: '2024-06-01T00:00:00', updated: '2024-01-01T00:00:00' },
  };

  it('detects an inversion stored in a nested group and fixes both in place', async () => {
    const file = realFile();
    const { app, writes } = makeApp(file, inverted);
    const modal = new Inversions(
      app,
      plugin({
        headerCreated: 'meta > created',
        headerUpdated: 'meta > updated',
      }),
    );
    const found = modal.computeInvertedFiles([file]);
    expect(found).toHaveLength(1);
    modal.set('updated-to-created', found);
    await modal.processFile(file);
    expect(writes[0]!.meta).toEqual({
      created: '2024-06-01T00:00:00',
      updated: '2024-06-01T00:00:00',
    });
  });

  it('a date that is not a plain value leaves the note out of the report', () => {
    const file = realFile();
    const { app } = makeApp(file, {
      created: '2024-06-01T00:00:00',
      updated: ['2024-01-01T00:00:00'],
    });
    const modal = new Inversions(app, plugin({}));
    expect(modal.computeInvertedFiles([file])).toHaveLength(0);
  });

  it('both or neither: a live refusal of one date writes neither', async () => {
    const file = realFile();
    const { app, writes } = makeApp(file, inverted, {
      meta: { created: '2024-06-01T00:00:00', updated: { x: 1 } },
    });
    const modal = new Inversions(
      app,
      plugin({
        headerCreated: 'meta > created',
        headerUpdated: 'meta > updated',
      }),
    );
    modal.set('max-all', modal.computeInvertedFiles([file]));
    // Skipped visibly (the run lists it with the reason), nothing written.
    await expect(modal.processFile(file)).rejects.toBeInstanceOf(BulkSkipped);
    expect(writes).toHaveLength(0);
  });

  it('a date name cleared between the scan and the run skips the note, writing neither date', async () => {
    const file = realFile();
    const { app, writes } = makeApp(file, inverted);
    const p = plugin({
      headerCreated: 'meta > created',
      headerUpdated: 'meta > updated',
    });
    const modal = new Inversions(app, p);
    modal.set('created-to-updated', modal.computeInvertedFiles([file]));
    // A settings sync blanks one name while the preview is open.
    p.settings.headerCreated = '';
    await expect(modal.processFile(file)).rejects.toBeInstanceOf(BulkSkipped);
    expect(writes).toHaveLength(0);
  });
});

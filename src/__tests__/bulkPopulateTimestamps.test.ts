import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';
import {
  BulkPopulateTimestampsModal,
  PopulateMode,
  OverrideMode,
} from '../BulkPopulateTimestampsModal';

function createMockFile(path: string, ctime: number, mtime: number): TFile {
  return {
    path,
    stat: { ctime, mtime, size: 100 },
    basename: path.replace(/\.md$/, ''),
    extension: 'md',
    name: path.split('/').pop() ?? path,
    vault: {} as any,
    parent: null,
  } as unknown as TFile;
}

class TestableBulkPopulate extends BulkPopulateTimestampsModal {
  public testComputePreviewEntry(file: TFile) {
    return this.computePreviewEntry(file);
  }

  public setModes(populate: PopulateMode, override: OverrideMode) {
    // Access private fields via type assertion
    (this as any).populateMode = populate;
    (this as any).overrideMode = override;
  }
}

function createModal(
  populateMode: PopulateMode = 'both',
  overrideMode: OverrideMode = 'fill-missing',
  settingsOverrides: Record<string, any> = {},
  frontmatterCache: Record<string, Record<string, any>> = {},
) {
  const plugin = createPlugin(settingsOverrides);

  const app = {
    metadataCache: {
      getFileCache: (file: TFile) => {
        const fm = frontmatterCache[file.path];
        return fm ? { frontmatter: fm } : {};
      },
    },
  } as any;

  const modal = new TestableBulkPopulate(app, plugin);
  modal.setModes(populateMode, overrideMode);
  return modal;
}

describe('BulkPopulateTimestampsModal - computePreviewEntry', () => {
  const ts2024 = new Date(2024, 0, 15, 10, 30).getTime();
  const ts2023 = new Date(2023, 5, 20, 14, 0).getTime();

  describe('fill-missing mode', () => {
    it('proposes both values when no frontmatter exists', () => {
      const modal = createModal('both', 'fill-missing');
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(true);
      expect(entry.proposedCreated).not.toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
      expect(entry.existingCreated).toBeNull();
      expect(entry.existingUpdated).toBeNull();
    });

    it('skips created when it already exists', () => {
      const modal = createModal(
        'both',
        'fill-missing',
        {},
        {
          'notes/test.md': { created: '2023-01-01T00:00:00' },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(true);
      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
      expect(entry.existingCreated).toBe('2023-01-01T00:00:00');
    });

    it('skips updated when it already exists', () => {
      const modal = createModal(
        'both',
        'fill-missing',
        {},
        {
          'notes/test.md': { updated: '2024-01-01T00:00:00' },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(true);
      expect(entry.proposedCreated).not.toBeNull();
      expect(entry.proposedUpdated).toBeNull();
      expect(entry.existingUpdated).toBe('2024-01-01T00:00:00');
    });

    it('willChange is false when both already exist', () => {
      const modal = createModal(
        'both',
        'fill-missing',
        {},
        {
          'notes/test.md': {
            created: '2023-01-01T00:00:00',
            updated: '2024-01-01T00:00:00',
          },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(false);
      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).toBeNull();
    });
  });

  describe('overwrite-all mode', () => {
    it('proposes new values even when both already exist', () => {
      const modal = createModal(
        'both',
        'overwrite-all',
        {},
        {
          'notes/test.md': {
            created: '2020-01-01T00:00:00',
            updated: '2020-06-01T00:00:00',
          },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(true);
      expect(entry.proposedCreated).not.toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
      expect(entry.existingCreated).toBe('2020-01-01T00:00:00');
      expect(entry.existingUpdated).toBe('2020-06-01T00:00:00');
    });

    it('proposes values when no frontmatter exists', () => {
      const modal = createModal('both', 'overwrite-all');
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(true);
      expect(entry.proposedCreated).not.toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
    });
  });

  describe('mode=created only', () => {
    it('never proposes updated regardless of override mode', () => {
      const modal = createModal('created', 'overwrite-all');
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.proposedCreated).not.toBeNull();
      expect(entry.proposedUpdated).toBeNull();
    });

    it('fill-missing skips when created already exists', () => {
      const modal = createModal(
        'created',
        'fill-missing',
        {},
        {
          'notes/test.md': { created: '2023-01-01T00:00:00' },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(false);
      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).toBeNull();
    });
  });

  describe('mode=updated only', () => {
    it('never proposes created regardless of override mode', () => {
      const modal = createModal('updated', 'overwrite-all');
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
    });

    it('fill-missing skips when updated already exists', () => {
      const modal = createModal(
        'updated',
        'fill-missing',
        {},
        {
          'notes/test.md': { updated: '2024-01-01T00:00:00' },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(false);
      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).toBeNull();
    });
  });

  describe('empty settings', () => {
    it('gracefully skips when headerCreated is empty', () => {
      const modal = createModal('both', 'fill-missing', {
        headerCreated: '',
      });
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
    });

    it('gracefully skips when headerUpdated is empty', () => {
      const modal = createModal('both', 'fill-missing', {
        headerUpdated: '',
      });
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.proposedCreated).not.toBeNull();
      expect(entry.proposedUpdated).toBeNull();
    });

    it('willChange is false when both headers are empty', () => {
      const modal = createModal('both', 'fill-missing', {
        headerCreated: '',
        headerUpdated: '',
      });
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(false);
    });
  });

  describe('same-value suppression', () => {
    it('willChange is false when both proposed values equal existing', () => {
      const modal = createModal(
        'both',
        'overwrite-all',
        {},
        {
          'notes/test.md': {
            created: '2023-06-20T14:00:00',
            updated: '2024-01-15T10:30:00',
          },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(false);
      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).toBeNull();
    });

    it('suppresses only created when it matches, updated still proposed', () => {
      const modal = createModal(
        'both',
        'overwrite-all',
        {},
        {
          'notes/test.md': {
            created: '2023-06-20T14:00:00',
            updated: '2020-01-01T00:00:00',
          },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(true);
      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
    });

    it('suppresses only updated when it matches, created still proposed', () => {
      const modal = createModal(
        'both',
        'overwrite-all',
        {},
        {
          'notes/test.md': {
            created: '2020-01-01T00:00:00',
            updated: '2024-01-15T10:30:00',
          },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(true);
      expect(entry.proposedCreated).not.toBeNull();
      expect(entry.proposedUpdated).toBeNull();
    });

    it('handles cross-type equality via String() coercion', () => {
      const tsRound = new Date(2024, 0, 15).getTime();
      const modal = createModal(
        'created',
        'overwrite-all',
        {
          dateFormat: 'yyyyMMdd',
          enableNumberProperties: true,
        },
        {
          'notes/test.md': { created: '20240115' },
        },
      );
      const file = createMockFile('notes/test.md', tsRound, tsRound);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.willChange).toBe(false);
      expect(entry.proposedCreated).toBeNull();
    });
  });

  describe('formatting', () => {
    it('proposed values use plugin formatDate output', () => {
      const modal = createModal('both', 'fill-missing', {
        dateFormat: 'yyyy/MM/dd HH:mm:ss',
      });
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.proposedCreated).toMatch(/^\d{4}\/\d{2}\/\d{2}/);
      expect(entry.proposedUpdated).toMatch(/^\d{4}\/\d{2}\/\d{2}/);
    });

    it('uses custom frontmatter key names', () => {
      const modal = createModal(
        'both',
        'fill-missing',
        {
          headerCreated: 'date_created',
          headerUpdated: 'date_modified',
        },
        {
          'notes/test.md': { date_created: '2023-01-01T00:00:00' },
        },
      );
      const file = createMockFile('notes/test.md', ts2023, ts2024);
      const entry = modal.testComputePreviewEntry(file);

      expect(entry.existingCreated).toBe('2023-01-01T00:00:00');
      expect(entry.proposedCreated).toBeNull();
      expect(entry.proposedUpdated).not.toBeNull();
    });
  });
});

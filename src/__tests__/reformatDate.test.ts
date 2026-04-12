import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';
import { ReformatDateModal, ReformatScope } from '../ReformatDateModal';

function createMockFile(path: string): TFile {
  return {
    path,
    stat: { ctime: Date.now(), mtime: Date.now(), size: 100 },
    basename: path.replace(/\.md$/, ''),
    extension: 'md',
    name: path.split('/').pop() ?? path,
    vault: {} as any,
    parent: null,
  } as unknown as TFile;
}

class TestableReformatDate extends ReformatDateModal {
  public testComputePreviewEntry(file: TFile) {
    return this.computePreviewEntry(file);
  }

  public testTryParseDate(value: string | number) {
    return this.tryParseDate(value);
  }

  public setScope(scope: ReformatScope) {
    (this as any).reformatScope = scope;
  }
}

function createModal(
  scope: ReformatScope = 'both',
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

  const modal = new TestableReformatDate(app, plugin);
  modal.setScope(scope);
  return modal;
}

describe('ReformatDateModal - tryParseDate', () => {
  it('parses ISO 8601 datetime', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('2024-01-15T10:30:00');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
    expect(date!.getHours()).toBe(10);
    expect(date!.getMinutes()).toBe(30);
  });

  it('parses ISO 8601 date only', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('2024-01-15');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
  });

  it('parses European dot format (dd.MM.yyyy)', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('15.01.2024');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
  });

  it('parses European dot format with time', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('15.01.2024 10:30:00');

    expect(date).toBeDefined();
    expect(date!.getHours()).toBe(10);
    expect(date!.getMinutes()).toBe(30);
  });

  it('parses numeric timestamp', () => {
    const ts = new Date(2024, 0, 15).getTime();
    const modal = createModal();
    const date = modal.testTryParseDate(ts);

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
  });

  it('returns undefined for NaN numeric input', () => {
    const modal = createModal();
    const date = modal.testTryParseDate(NaN);

    expect(date).toBeUndefined();
  });

  it('returns undefined for unparseable string', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('not-a-date');

    expect(date).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('');

    expect(date).toBeUndefined();
  });

  it('parses slash-separated format (yyyy/MM/dd)', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('2024/01/15');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getDate()).toBe(15);
  });

  it('parses compact format (yyyyMMdd)', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('20240115');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
  });
});

describe('ReformatDateModal - computePreviewEntry', () => {
  it('converts ISO date to new format', () => {
    const modal = createModal(
      'both',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': {
          created: '2024-01-15T10:30:00',
          updated: '2024-06-20T14:00:00',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('15.01.2024');
    expect(entry.updatedNewValue).toBe('20.06.2024');
    expect(entry.createdError).toBe(false);
    expect(entry.updatedError).toBe(false);
  });

  it('marks error for unparseable dates', () => {
    const modal = createModal(
      'both',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: 'garbage', updated: '2024-06-20' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.createdError).toBe(true);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.updatedNewValue).toBe('20.06.2024');
    expect(entry.willChange).toBe(true);
  });

  it('skips when value already in target format', () => {
    const modal = createModal(
      'both',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss" },
      {
        'test.md': {
          created: '2024-01-15T10:30:00',
          updated: '2024-06-20T14:00:00',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(false);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.updatedNewValue).toBeNull();
  });

  it('only processes created when scope is created', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: '2024-01-15', updated: '2024-06-20' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.createdNewValue).toBe('15.01.2024');
    expect(entry.updatedOldValue).toBeNull();
    expect(entry.updatedNewValue).toBeNull();
  });

  it('only processes updated when scope is updated', () => {
    const modal = createModal(
      'updated',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: '2024-01-15', updated: '2024-06-20' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.createdOldValue).toBeNull();
    expect(entry.createdNewValue).toBeNull();
    expect(entry.updatedNewValue).toBe('20.06.2024');
  });

  it('willChange is false when no frontmatter', () => {
    const modal = createModal('both', { dateFormat: 'dd.MM.yyyy' });
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(false);
    expect(entry.createdOldValue).toBeNull();
    expect(entry.updatedOldValue).toBeNull();
  });

  it('willChange is false when keys are absent', () => {
    const modal = createModal(
      'both',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { title: 'Test' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(false);
  });

  it('uses custom key names from settings', () => {
    const modal = createModal(
      'both',
      {
        dateFormat: 'dd.MM.yyyy',
        headerCreated: 'date_created',
        headerUpdated: 'date_modified',
      },
      {
        'test.md': {
          date_created: '2024-01-15',
          date_modified: '2024-06-20',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('15.01.2024');
    expect(entry.updatedNewValue).toBe('20.06.2024');
  });

  it('handles numeric epoch timestamps', () => {
    const ts = new Date(2024, 0, 15, 12, 0, 0).getTime();
    const modal = createModal(
      'created',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: ts },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('15.01.2024');
  });

  it('converts European dot format to ISO', () => {
    const modal = createModal(
      'both',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss" },
      {
        'test.md': {
          created: '15.01.2024 10:30:00',
          updated: '20.06.2024 14:00:00',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('2024-01-15T10:30:00');
    expect(entry.updatedNewValue).toBe('2024-06-20T14:00:00');
  });
});

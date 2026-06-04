import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';
import { RenameKeyModal } from '../RenameKeyModal';

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

class TestableRenameKey extends RenameKeyModal {
  public testComputePreviewEntry(file: TFile) {
    return this.computePreviewEntry(file);
  }

  public setKeys(oldKey: string, newKey: string) {
    (this as any).oldKeyName = oldKey;
    (this as any).newKeyName = newKey;
  }

  public testApplyRename(file: TFile) {
    return this.applyRename(file);
  }
}

function createModal(
  oldKey: string,
  newKey: string,
  frontmatterCache: Record<string, Record<string, any>> = {},
) {
  const plugin = createPlugin();

  const app = {
    metadataCache: {
      getFileCache: (file: TFile) => {
        const fm = frontmatterCache[file.path];
        return fm ? { frontmatter: fm } : {};
      },
    },
  } as any;

  const modal = new TestableRenameKey(app, plugin);
  modal.setKeys(oldKey, newKey);
  return modal;
}

describe('RenameKeyModal - computePreviewEntry', () => {
  it('returns entry when file has the old key', () => {
    const modal = createModal('created', 'date_created', {
      'test.md': { created: '2024-01-15T10:00:00' },
    });
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry).not.toBeNull();
    expect(entry!.existingValue).toBe('2024-01-15T10:00:00');
    expect(entry!.oldKeyName).toBe('created');
    expect(entry!.newKeyAlreadyExists).toBe(false);
    expect(entry!.existingNewKeyValue).toBeNull();
  });

  it('returns null when file does not have the old key', () => {
    const modal = createModal('created', 'date_created', {
      'test.md': { updated: '2024-01-15T10:00:00' },
    });
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry).toBeNull();
  });

  it('returns null when file has no frontmatter', () => {
    const modal = createModal('created', 'date_created');
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry).toBeNull();
  });

  it('detects conflict when new key already exists', () => {
    const modal = createModal('old_date', 'created', {
      'test.md': { old_date: '2023-05-01', created: '2024-01-01' },
    });
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry).not.toBeNull();
    expect(entry!.newKeyAlreadyExists).toBe(true);
    expect(entry!.existingNewKeyValue).toBe('2024-01-01');
    expect(entry!.existingValue).toBe('2023-05-01');
  });

  it('preserves numeric values', () => {
    const modal = createModal('created', 'date_created', {
      'test.md': { created: 20240115 },
    });
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry).not.toBeNull();
    expect(entry!.existingValue).toBe(20240115);
  });

  it('handles old key with null value as missing', () => {
    const modal = createModal('created', 'date_created', {
      'test.md': { created: null },
    });
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry).toBeNull();
  });
});

describe('RenameKeyModal - applyRename write contract', () => {
  it('writes without preserving mtime and records the self-trigger guard + cache', async () => {
    const plugin = createPlugin();
    const cacheCalls: string[] = [];
    (plugin as any).populateCacheForFile = async (f: TFile) => {
      cacheCalls.push(f.path);
    };

    const file = createMockFile('test.md');
    let captured: { argCount: number; options: unknown } | null = null;
    const app = {
      metadataCache: {
        getFileCache: () => ({
          frontmatter: { created: '2024-01-15T10:00:00' },
        }),
      },
      vault: { getAbstractFileByPath: () => file },
      fileManager: {
        processFrontMatter: async (...args: unknown[]) => {
          captured = { argCount: args.length, options: args[2] };
          (args[1] as (fm: Record<string, unknown>) => void)({
            created: '2024-01-15T10:00:00',
          });
        },
      },
    } as any;

    const modal = new TestableRenameKey(app, plugin);
    modal.setKeys('created', 'date_created');
    await modal.testApplyRename(file);

    // Contract: no { ctime, mtime } options argument is passed.
    expect(captured!.options).toBeUndefined();
    // Contract: self-triggered modify event is suppressed via lastPluginWriteMtime.
    expect(plugin.lastPluginWriteMtime.get('test.md')).toBe(file.stat.mtime);
    // Contract: hash cache is refreshed so the stale-cache spurious update cannot fire.
    expect(cacheCalls).toContain('test.md');
  });
});

import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin, fakeWarnEl } from './helpers';
import { FindInversionsModal } from '../FindInversionsModal';
import { InversionFixStrategy } from '../inversionDetection';

function createMockFile(path: string, ctime = 0, mtime = 0): TFile {
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

class TestableFindInversions extends FindInversionsModal {
  public testComputeInvertedFiles(files: TFile[]) {
    return this.computeInvertedFiles(files);
  }
  public testIsRunDestructive() {
    return this.isRunDestructive();
  }
  public setStrategy(strategy: InversionFixStrategy) {
    (this as any).selectedStrategy = strategy;
  }
  public refreshWarningInto(el: unknown, files: TFile[]) {
    (this as any).warningEl = el;
    (this as any).cachedFiles = files;
    (this as any).refreshWarning();
  }
}

function createModal(
  frontmatterCache: Record<string, Record<string, any>> = {},
  toleranceSec = 0,
) {
  const plugin = createPlugin({ inversionToleranceSec: toleranceSec });
  const app = {
    metadataCache: {
      getFileCache: (file: TFile) => {
        const fm = frontmatterCache[file.path];
        return fm ? { frontmatter: fm } : {};
      },
    },
  } as any;
  return new TestableFindInversions(app, plugin);
}

describe('FindInversionsModal - computeInvertedFiles', () => {
  it('skips files without frontmatter', () => {
    const modal = createModal({});
    const result = modal.testComputeInvertedFiles([createMockFile('a.md')]);
    expect(result).toHaveLength(0);
  });

  it('skips files without created or updated key', () => {
    const modal = createModal({
      'a.md': { tags: ['foo'] },
      'b.md': { created: '2024-01-01T10:00:00' },
      'c.md': { updated: '2024-01-01T10:00:00' },
    });
    const result = modal.testComputeInvertedFiles([
      createMockFile('a.md'),
      createMockFile('b.md'),
      createMockFile('c.md'),
    ]);
    expect(result).toHaveLength(0);
  });

  it('skips files with non-inverted dates', () => {
    const modal = createModal({
      'a.md': {
        created: '2024-01-01T10:00:00',
        updated: '2024-01-02T10:00:00',
      },
    });
    const result = modal.testComputeInvertedFiles([createMockFile('a.md')]);
    expect(result).toHaveLength(0);
  });

  it('detects inverted files', () => {
    const modal = createModal({
      'a.md': {
        created: '2024-01-05T10:00:00',
        updated: '2024-01-01T10:00:00',
      },
    });
    const result = modal.testComputeInvertedFiles([
      createMockFile('a.md', 0, 0),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.file.path).toBe('a.md');
    expect(result[0]!.created.toISOString()).toContain('2024-01-05');
    expect(result[0]!.updated.toISOString()).toContain('2024-01-01');
  });

  it('respects tolerance', () => {
    const modal = createModal(
      {
        'small.md': {
          created: '2024-01-01T10:00:05',
          updated: '2024-01-01T10:00:00',
        },
        'big.md': {
          created: '2024-01-01T10:01:00',
          updated: '2024-01-01T10:00:00',
        },
      },
      10,
    );
    const result = modal.testComputeInvertedFiles([
      createMockFile('small.md'),
      createMockFile('big.md'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.file.path).toBe('big.md');
  });

  it('skips files with unparseable dates', () => {
    const modal = createModal({
      'a.md': {
        created: 'not a date',
        updated: '2024-01-01T10:00:00',
      },
    });
    const result = modal.testComputeInvertedFiles([createMockFile('a.md')]);
    expect(result).toHaveLength(0);
  });
});

describe('FindInversionsModal - destructive Run', () => {
  it('marks Run as destructive (red button)', () => {
    const modal = createModal();
    expect(modal.testIsRunDestructive()).toBe(true);
  });
});

describe('FindInversionsModal - irreversibility warning', () => {
  it('shows no warning while the strategy is disabled (review only)', () => {
    const modal = createModal();
    modal.setStrategy('disabled');
    const el = fakeWarnEl();

    modal.refreshWarningInto(el, [
      createMockFile('a.md'),
      createMockFile('b.md'),
    ]);

    expect(el.children).toHaveLength(0);
  });

  it('shows the irreversibility warning once a fix strategy is selected', () => {
    const modal = createModal();
    modal.setStrategy('updated-to-created');
    const el = fakeWarnEl();

    modal.refreshWarningInto(el, [
      createMockFile('a.md'),
      createMockFile('b.md'),
      createMockFile('c.md'),
    ]);

    const warned = el.children.find((c) => /Irreversible/.test(c.text ?? ''));
    expect(warned).toBeDefined();
    expect(warned!.text).toContain('3');
  });
});

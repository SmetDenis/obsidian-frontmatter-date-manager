import { describe, it, expect, vi } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';

function mockApp(frontmatter: Record<string, unknown> = {}) {
  return {
    metadataCache: {
      getFileCache: () => ({ frontmatter }),
    },
  } as any;
}

function mockFile(ctime: number, mtime: number): TFile {
  return {
    path: 'note.md',
    stat: { ctime, mtime, size: 1 },
    basename: 'note',
    extension: 'md',
    name: 'note.md',
    vault: {} as any,
    parent: null,
  } as unknown as TFile;
}

describe('computeFrontmatterUpdates inversion prevention', () => {
  it('does not fix when strategy is disabled', () => {
    const plugin = createPlugin({
      inversionFixStrategy: 'disabled',
      timezone: 'UTC',
    });
    plugin.app = mockApp({
      created: '2024-02-10T10:00:00',
      updated: '2024-02-01T10:00:00',
    });
    const file = mockFile(
      new Date('2024-02-05T10:00:00Z').getTime(),
      new Date('2024-02-08T10:00:00Z').getTime(),
    );
    const result = (plugin as any).computeFrontmatterUpdates(file);
    expect(result.createdValue).toBeUndefined();
    expect(result.updatedValue).not.toBeUndefined();
  });

  it('applies created-to-updated strategy when inversion detected', () => {
    const plugin = createPlugin({
      inversionFixStrategy: 'created-to-updated',
      minSecondsBetweenSaves: 0,
      timezone: 'UTC',
    });
    plugin.app = mockApp({
      created: '2024-02-10T10:00:00',
      updated: '2024-02-01T10:00:00',
    });
    const file = mockFile(
      new Date('2024-02-05T10:00:00Z').getTime(),
      new Date('2024-02-08T10:00:00Z').getTime(),
    );
    const result = (plugin as any).computeFrontmatterUpdates(file);
    // updated will be set from mtime (2024-02-08), then inversion check:
    // created (2024-02-10) > updated (2024-02-08) → fix
    // strategy created-to-updated → created becomes updated
    expect(result.createdValue).toBe('2024-02-08T10:00:00');
    expect(result.updatedValue).toBe('2024-02-08T10:00:00');
  });

  it('respects tolerance', () => {
    const plugin = createPlugin({
      inversionFixStrategy: 'created-to-updated',
      inversionToleranceSec: 60,
      minSecondsBetweenSaves: 0,
      timezone: 'UTC',
    });
    plugin.app = mockApp({
      created: '2024-02-10T10:00:30',
      updated: '2024-02-10T10:00:00',
    });
    const file = mockFile(
      new Date('2024-02-05T10:00:00Z').getTime(),
      new Date('2024-02-10T10:00:00Z').getTime(),
    );
    const result = (plugin as any).computeFrontmatterUpdates(file);
    // 30s diff < 60s tolerance → no fix
    expect(result.createdValue).toBeUndefined();
  });

  it('shows Notice only once per session', () => {
    const plugin = createPlugin({
      inversionFixStrategy: 'created-to-updated',
      minSecondsBetweenSaves: 0,
      timezone: 'UTC',
    });
    plugin.app = mockApp({
      created: '2024-02-10T10:00:00',
      updated: '2024-02-01T10:00:00',
    });
    const file = mockFile(
      new Date('2024-02-05T10:00:00Z').getTime(),
      new Date('2024-02-08T10:00:00Z').getTime(),
    );

    const noticeSpy = vi.fn();
    (plugin as any)._noticeFactory = noticeSpy;

    (plugin as any).computeFrontmatterUpdates(file);
    (plugin as any).computeFrontmatterUpdates(file);

    expect(noticeSpy).toHaveBeenCalledTimes(1);
  });
});

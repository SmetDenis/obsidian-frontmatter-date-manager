import { describe, it, expect } from 'vitest';
import { createPlugin } from './helpers';

const note = (meta: string, extra = '') =>
  `---\ntitle: Test\nmeta:\n${meta}\n${extra}---\nBody`;

describe('getContentForHashing with nested property paths', () => {
  it("the plugin's own nested write does not change the hash", () => {
    const plugin = createPlugin({
      hashTrackingMode: 'frontmatter',
      headerUpdated: 'meta > updated',
    });
    const before = note('  updated: 2024-01-01T00:00:00\n  source: web');
    const after = note('  updated: 2024-06-01T00:00:00\n  source: web');
    const added = note('  source: web\n  updated: 2024-06-01T00:00:00');
    expect(plugin.getContentForHashing(after)).toBe(
      plugin.getContentForHashing(before),
    );
    expect(plugin.getContentForHashing(added)).toBe(
      plugin.getContentForHashing(note('  source: web')),
    );
  });

  it('another key in the same group still counts as an edit', () => {
    const plugin = createPlugin({
      hashTrackingMode: 'both',
      headerUpdated: 'meta > updated',
    });
    const before = note('  updated: 2024-01-01\n  source: web');
    const after = note('  updated: 2024-01-01\n  source: print');
    expect(plugin.getContentForHashing(after)).not.toBe(
      plugin.getContentForHashing(before),
    );
  });

  it('a flat dotted key next to the group is not excluded by the nested path', () => {
    const plugin = createPlugin({
      hashTrackingMode: 'frontmatter',
      headerUpdated: 'meta > updated',
    });
    const result = plugin.getContentForHashing(
      note('  updated: 2024-01-01', 'meta.updated: 2024-02-02\n'),
    );
    expect(result).toContain('meta.updated: 2024-02-02');
    expect(result).not.toContain('  updated:');
  });

  it('excludes deep paths, the counter and nested exclude-list entries', () => {
    const plugin = createPlugin({
      hashTrackingMode: 'frontmatter',
      headerLastViewed: 'parent > meta > viewed',
      headerUpdateCount: 'meta > edits',
      countUpdatesEnabled: false,
      frontmatterHashExcludeKeys: ['meta > lastSync'],
    });
    const content =
      '---\nparent:\n  meta:\n    viewed: 2024-01-01\n    keep: 1\nmeta:\n  edits: 3\n  lastSync: 2024-01-02\n  source: web\n---\nBody';
    expect(plugin.getContentForHashing(content)).toBe(
      'parent:\n  meta:\n    keep: 1\nmeta:\n  source: web\n',
    );
  });

  it('an invalid path excludes nothing', () => {
    const plugin = createPlugin({
      hashTrackingMode: 'frontmatter',
      headerUpdated: 'meta >',
    });
    expect(
      plugin.getContentForHashing(note('  updated: 2024-01-01')),
    ).toContain('  updated: 2024-01-01');
  });

  it('flat names still go through the flat filter alongside nested ones', () => {
    const plugin = createPlugin({
      hashTrackingMode: 'frontmatter',
      headerCreated: 'created',
      headerUpdated: 'meta > updated',
    });
    const result = plugin.getContentForHashing(
      note('  updated: 2024-01-01', 'created: 2023-01-01\n'),
    );
    expect(result).not.toContain('created:');
    expect(result).not.toContain('  updated:');
    expect(result).toContain('title: Test');
  });
});

describe('getContentForHashing - first nested write', () => {
  it('creating the group with the plugin key does not change the hash', () => {
    const plugin = createPlugin({
      hashTrackingMode: 'both',
      headerUpdated: 'meta > updated',
    });
    expect(
      plugin.getContentForHashing(
        '---\ntitle: T\nmeta:\n  updated: 2024-01-01\n---\nBody',
      ),
    ).toBe(plugin.getContentForHashing('---\ntitle: T\n---\nBody'));
  });

  it('filling an empty group that was already there does not change the hash', () => {
    const plugin = createPlugin({
      hashTrackingMode: 'both',
      headerUpdated: 'meta > updated',
      headerLastViewed: 'parent > meta > viewed',
    });
    const filled = plugin.getContentForHashing(
      '---\ntitle: T\nmeta:\n  updated: 2024-01-01\nparent:\n  meta:\n    viewed: 2024-01-01\n---\nBody',
    );
    expect(
      plugin.getContentForHashing(
        '---\ntitle: T\nmeta:\nparent:\n  meta: {}\n---\nBody',
      ),
    ).toBe(filled);
    expect(
      plugin.getContentForHashing(
        '---\ntitle: T\nmeta: {}\nparent:\n---\nBody',
      ),
    ).toBe(filled);
  });
});

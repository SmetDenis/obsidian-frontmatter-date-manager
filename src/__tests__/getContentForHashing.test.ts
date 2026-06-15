import { describe, it, expect } from 'vitest';
import { createPlugin } from './helpers';

describe('getContentForHashing', () => {
  describe('body-only mode (default)', () => {
    const plugin = createPlugin({ hashTrackingMode: 'body' });

    it('returns body without frontmatter', () => {
      const content =
        '---\ntitle: Test\nupdated: 2024-01-01\n---\nBody content';
      expect(plugin.getContentForHashing(content)).toBe('Body content');
    });

    it('returns full content when no frontmatter present', () => {
      const content = 'Just body content';
      expect(plugin.getContentForHashing(content)).toBe(content);
    });

    it('handles empty frontmatter', () => {
      const content = '---\n---\nBody';
      expect(plugin.getContentForHashing(content)).toBe('Body');
    });
  });

  describe('frontmatter-only mode', () => {
    it('returns only filtered frontmatter, no body', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content =
        '---\ntitle: Test\ncreated: 2024-01-01\ntags: foo\n---\nBody content here';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).toContain('tags: foo');
      expect(result).not.toContain('created:');
      expect(result).not.toContain('Body content here');
    });

    it('returns empty string when no frontmatter present', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content = 'Just body content';
      expect(plugin.getContentForHashing(content)).toBe('');
    });

    it('returns empty string for empty frontmatter', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content = '---\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('Body');
    });

    it('excludes managed keys from frontmatter', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content =
        '---\ncreated: 2024-01-01\nupdated: 2024-06-01\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('created:');
      expect(result).not.toContain('updated:');
      expect(result).toContain('title: Test');
      expect(result).not.toContain('Body');
    });

    it('excludes user-configured keys', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['aliases'],
      });
      const content = '---\ntitle: Test\naliases: foo\ntags: baz\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).not.toContain('aliases:');
      expect(result).toContain('tags: baz');
      expect(result).not.toContain('Body');
    });

    it('body changes do not affect hash', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content1 = '---\ntitle: Test\n---\nBody version 1';
      const content2 = '---\ntitle: Test\n---\nBody version 2';
      expect(plugin.getContentForHashing(content1)).toBe(
        plugin.getContentForHashing(content2),
      );
    });
  });

  describe('body + frontmatter mode', () => {
    it('excludes managed created key', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content =
        '---\ntitle: Test\ncreated: 2024-01-01\ntags: foo\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).not.toContain('created:');
      expect(result).toContain('tags: foo');
      expect(result).toContain('Body');
    });

    it('excludes managed updated key', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content =
        '---\ntitle: Test\nupdated: 2024-01-01\ntags: foo\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).not.toContain('updated:');
      expect(result).toContain('tags: foo');
      expect(result).toContain('Body');
    });

    it('excludes both managed keys simultaneously', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'modified',
      });
      const content =
        '---\ncreated: 2024-01-01\nmodified: 2024-06-01\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('created:');
      expect(result).not.toContain('modified:');
      expect(result).toContain('title: Test');
      expect(result).toContain('Body');
    });

    it('excludes user-configured keys', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['aliases', 'cssclasses'],
      });
      const content =
        '---\ntitle: Test\naliases: foo\ncssclasses: bar\ntags: baz\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).not.toContain('aliases:');
      expect(result).not.toContain('cssclasses:');
      expect(result).toContain('tags: baz');
    });

    it('excludes user-configured keys AND managed keys together', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['aliases'],
      });
      const content =
        '---\ncreated: 2024-01-01\nupdated: 2024-06-01\naliases: foo\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('created:');
      expect(result).not.toContain('updated:');
      expect(result).not.toContain('aliases:');
      expect(result).toContain('title: Test');
    });

    it('handles multiline list values', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['tags'],
      });
      const content = '---\ntags:\n  - foo\n  - bar\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('tags:');
      expect(result).not.toContain('- foo');
      expect(result).not.toContain('- bar');
      expect(result).toContain('title: Test');
    });

    it('handles multiline block scalar values', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['description'],
      });
      const content =
        '---\ndescription: |\n  Line one\n  Line two\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('description:');
      expect(result).not.toContain('Line one');
      expect(result).not.toContain('Line two');
      expect(result).toContain('title: Test');
    });

    it('returns full content when no frontmatter present', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content = 'Just body content';
      expect(plugin.getContentForHashing(content)).toBe(content);
    });

    it('handles empty frontmatter', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content = '---\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('Body');
    });

    it('handles CRLF line endings', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
      });
      const content =
        '---\r\ntitle: Test\r\ncreated: 2024-01-01\r\n---\r\nBody with CRLF';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).not.toContain('created:');
      expect(result).toContain('Body with CRLF');
    });

    it('ignores non-existent exclusion key (no-op)', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['nonexistent'],
      });
      const content = '---\ntitle: Test\ntags: foo\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).toContain('tags: foo');
      expect(result).toContain('Body');
    });

    it('empty exclusion list only excludes managed keys', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: [],
      });
      const content =
        '---\ncreated: 2024-01-01\nupdated: 2024-06-01\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('created:');
      expect(result).not.toContain('updated:');
      expect(result).toContain('title: Test');
    });

    it('trims whitespace from managed key names', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: ' created ',
        headerUpdated: ' updated ',
      });
      const content = '---\ncreated: 2024-01-01\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('created:');
      expect(result).toContain('title: Test');
    });

    it('does not exclude keys that are not in the list', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['aliases'],
      });
      const content = '---\ntitle: Test\ntags: foo\nstatus: draft\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).toContain('tags: foo');
      expect(result).toContain('status: draft');
    });

    it('excludes Unicode frontmatter keys', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['创建日期'],
      });
      const content = '---\n创建日期: 2024-01-01\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('创建日期:');
      expect(result).toContain('title: Test');
      expect(result).toContain('Body');
    });

    it('excludes dotted frontmatter keys', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['app.version'],
      });
      const content = '---\napp.version: 1.2.3\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('app.version:');
      expect(result).toContain('title: Test');
    });

    it('handles consecutive excluded keys', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        headerCreated: 'created',
        headerUpdated: 'updated',
        frontmatterHashExcludeKeys: ['aliases', 'tags'],
      });
      const content = '---\naliases: foo\ntags: bar\ntitle: Test\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('aliases:');
      expect(result).not.toContain('tags:');
      expect(result).toContain('title: Test');
    });
  });

  describe('edit-activity counter key exclusion', () => {
    it('excludes the counter key when the counter is enabled (frontmatter mode)', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        countUpdatesEnabled: true,
        headerUpdateCount: 'updated_count',
      });
      const content =
        '---\ntitle: Test\nupdated_count: 5\ntags: foo\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).toContain('title: Test');
      expect(result).not.toContain('updated_count:');
      expect(result).toContain('tags: foo');
    });

    it('the counter write does not change the hash in both mode (no self-amplifying loop)', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'both',
        countUpdatesEnabled: true,
        headerUpdateCount: 'updated_count',
      });
      const before = '---\ntitle: Test\nupdated_count: 5\n---\nBody';
      const after = '---\ntitle: Test\nupdated_count: 6\n---\nBody';
      expect(plugin.getContentForHashing(before)).toBe(
        plugin.getContentForHashing(after),
      );
    });

    it('excludes the counter key even when the counter is disabled (toggling stays hash-neutral)', () => {
      // The configured counter key is plugin-managed, so it is excluded from the
      // hash unconditionally - whether the counter is on or off. This keeps the
      // tracked hash identical across a toggle, so enabling/disabling the counter
      // never causes a spurious `updated` re-stamp on already-counted notes.
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        countUpdatesEnabled: false,
        headerUpdateCount: 'updated_count',
      });
      const content = '---\ntitle: Test\nupdated_count: 5\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('updated_count:');
      expect(result).toContain('title: Test');
    });

    it('respects a custom counter property name', () => {
      const plugin = createPlugin({
        hashTrackingMode: 'frontmatter',
        countUpdatesEnabled: true,
        headerUpdateCount: 'edits',
      });
      const content = '---\ntitle: Test\nedits: 9\n---\nBody';
      const result = plugin.getContentForHashing(content);
      expect(result).not.toContain('edits:');
      expect(result).toContain('title: Test');
    });
  });
});

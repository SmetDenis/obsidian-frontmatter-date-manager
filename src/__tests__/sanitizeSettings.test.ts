import { describe, it, expect } from 'vitest';
import { sanitizeSettings, DEFAULT_SETTINGS } from '../Settings';
import FrontmatterDateManagerPlugin from '../main';

// Root-cause coverage for the "corrupt data.json wrong type" bug: the settings
// ingestion boundary must validate field types (mirroring loadHashCache), so a
// wrong-typed value from an external/synced data.json can never reach code that
// asserts a type (.trim(), for...of, date-fns) and crash onload / file processing.

describe('sanitizeSettings (pure)', () => {
  describe('non-object input', () => {
    it('returns a full copy of defaults for null', () => {
      expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    });

    it('returns a full copy of defaults for undefined', () => {
      expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    });

    it('returns defaults for a primitive (string) input', () => {
      expect(sanitizeSettings('garbage' as never)).toEqual(DEFAULT_SETTINGS);
    });

    it('returns defaults for an array input', () => {
      expect(sanitizeSettings([] as never)).toEqual(DEFAULT_SETTINGS);
    });

    it('does not return the DEFAULT_SETTINGS object by reference', () => {
      expect(sanitizeSettings(null)).not.toBe(DEFAULT_SETTINGS);
    });
  });

  describe('filterRules (string field - onload crash path)', () => {
    it('coerces a number to the default empty string', () => {
      expect(sanitizeSettings({ filterRules: 42 }).filterRules).toBe('');
    });

    it('coerces an object to the default', () => {
      expect(
        sanitizeSettings({ filterRules: { a: 1 } as never }).filterRules,
      ).toBe('');
    });

    it('coerces an array to the default', () => {
      expect(
        sanitizeSettings({ filterRules: ['x'] as never }).filterRules,
      ).toBe('');
    });

    it('coerces a boolean to the default', () => {
      expect(sanitizeSettings({ filterRules: true as never }).filterRules).toBe(
        '',
      );
    });

    it('preserves a valid multi-line string', () => {
      expect(sanitizeSettings({ filterRules: 'foo/\n!bar/' }).filterRules).toBe(
        'foo/\n!bar/',
      );
    });

    it('preserves an empty string', () => {
      expect(sanitizeSettings({ filterRules: '' }).filterRules).toBe('');
    });
  });

  describe('header string fields (.trim() crash path)', () => {
    it('coerces non-string headerCreated to default', () => {
      expect(
        sanitizeSettings({ headerCreated: 42 as never }).headerCreated,
      ).toBe(DEFAULT_SETTINGS.headerCreated);
    });

    it('coerces null headerUpdated to default', () => {
      expect(
        sanitizeSettings({ headerUpdated: null as never }).headerUpdated,
      ).toBe(DEFAULT_SETTINGS.headerUpdated);
    });

    it('coerces array headerLastViewed to default', () => {
      expect(
        sanitizeSettings({ headerLastViewed: [] as never }).headerLastViewed,
      ).toBe(DEFAULT_SETTINGS.headerLastViewed);
    });

    it('preserves a valid custom header', () => {
      expect(
        sanitizeSettings({ headerCreated: 'date-created' }).headerCreated,
      ).toBe('date-created');
    });
  });

  describe('frontmatterHashExcludeKeys (array field - for...of crash path)', () => {
    it('coerces a number to an empty array', () => {
      expect(
        sanitizeSettings({ frontmatterHashExcludeKeys: 42 as never })
          .frontmatterHashExcludeKeys,
      ).toEqual([]);
    });

    it('coerces an object to an empty array (typeof-object trap)', () => {
      expect(
        sanitizeSettings({ frontmatterHashExcludeKeys: { a: 1 } as never })
          .frontmatterHashExcludeKeys,
      ).toEqual([]);
    });

    it('coerces a string to an empty array (string is iterable but wrong)', () => {
      expect(
        sanitizeSettings({ frontmatterHashExcludeKeys: 'aliases' as never })
          .frontmatterHashExcludeKeys,
      ).toEqual([]);
    });

    it('filters non-string elements out of an array', () => {
      expect(
        sanitizeSettings({
          frontmatterHashExcludeKeys: ['a', 1, null, 'b', {}] as never,
        }).frontmatterHashExcludeKeys,
      ).toEqual(['a', 'b']);
    });

    it('preserves a valid string array', () => {
      expect(
        sanitizeSettings({ frontmatterHashExcludeKeys: ['aliases', 'tags'] })
          .frontmatterHashExcludeKeys,
      ).toEqual(['aliases', 'tags']);
    });
  });

  describe('numeric fields', () => {
    it('coerces a numeric string to default', () => {
      expect(
        sanitizeSettings({ minSecondsBetweenSaves: '30' as never })
          .minSecondsBetweenSaves,
      ).toBe(DEFAULT_SETTINGS.minSecondsBetweenSaves);
    });

    it('coerces NaN to default', () => {
      expect(
        sanitizeSettings({ minSecondsBetweenSaves: NaN })
          .minSecondsBetweenSaves,
      ).toBe(DEFAULT_SETTINGS.minSecondsBetweenSaves);
    });

    it('coerces Infinity to default', () => {
      expect(
        sanitizeSettings({ hashCacheMaxSize: Infinity }).hashCacheMaxSize,
      ).toBe(DEFAULT_SETTINGS.hashCacheMaxSize);
    });

    it('preserves a valid number including 0', () => {
      expect(
        sanitizeSettings({ inversionToleranceSec: 0 }).inversionToleranceSec,
      ).toBe(0);
      expect(
        sanitizeSettings({ minSecondsBetweenSaves: 60 }).minSecondsBetweenSaves,
      ).toBe(60);
    });
  });

  describe('boolean fields', () => {
    it('coerces a string to default', () => {
      expect(
        sanitizeSettings({ enableAutoUpdate: 'yes' as never }).enableAutoUpdate,
      ).toBe(DEFAULT_SETTINGS.enableAutoUpdate);
    });

    it('preserves false', () => {
      expect(
        sanitizeSettings({ enableAutoUpdate: false }).enableAutoUpdate,
      ).toBe(false);
    });
  });

  describe('enum fields', () => {
    it('coerces invalid hashTrackingMode to default', () => {
      expect(
        sanitizeSettings({ hashTrackingMode: 'nonsense' as never })
          .hashTrackingMode,
      ).toBe(DEFAULT_SETTINGS.hashTrackingMode);
    });

    it('preserves a valid hashTrackingMode', () => {
      expect(
        sanitizeSettings({ hashTrackingMode: 'both' }).hashTrackingMode,
      ).toBe('both');
    });

    it('coerces invalid inversionFixStrategy to default', () => {
      expect(
        sanitizeSettings({ inversionFixStrategy: 'bogus' as never })
          .inversionFixStrategy,
      ).toBe(DEFAULT_SETTINGS.inversionFixStrategy);
    });

    it('preserves a valid inversionFixStrategy', () => {
      expect(
        sanitizeSettings({ inversionFixStrategy: 'max-all' })
          .inversionFixStrategy,
      ).toBe('max-all');
    });
  });

  describe('unknown keys (forward-compat: preserved)', () => {
    it('keeps unknown keys untouched', () => {
      const result = sanitizeSettings({
        futureKey: 'whatever',
      } as never) as unknown as Record<string, unknown>;
      expect(result.futureKey).toBe('whatever');
    });
  });

  describe('edit-activity counter fields', () => {
    it('defaults: countUpdatesEnabled false, headerUpdateCount "updated_count"', () => {
      expect(sanitizeSettings({}).countUpdatesEnabled).toBe(false);
      expect(sanitizeSettings({}).headerUpdateCount).toBe('updated_count');
    });

    it('coerces a non-boolean countUpdatesEnabled to the default false', () => {
      expect(
        sanitizeSettings({ countUpdatesEnabled: 'yes' as never })
          .countUpdatesEnabled,
      ).toBe(false);
    });

    it('coerces a non-string headerUpdateCount to the default', () => {
      expect(
        sanitizeSettings({ headerUpdateCount: 42 as never }).headerUpdateCount,
      ).toBe('updated_count');
    });

    it('resets empty / whitespace-only headerUpdateCount to the default', () => {
      expect(
        sanitizeSettings({ headerUpdateCount: '' }).headerUpdateCount,
      ).toBe('updated_count');
      expect(
        sanitizeSettings({ headerUpdateCount: '   ' }).headerUpdateCount,
      ).toBe('updated_count');
    });

    it('preserves a valid distinct name with the counter enabled', () => {
      const r = sanitizeSettings({
        countUpdatesEnabled: true,
        headerUpdateCount: 'edits',
      });
      expect(r.headerUpdateCount).toBe('edits');
      expect(r.countUpdatesEnabled).toBe(true);
    });

    // R13: name-collision resolution = DISABLE the counter, never rename.
    it('disables the counter when its name collides with the updated key (name left unchanged)', () => {
      const r = sanitizeSettings({
        countUpdatesEnabled: true,
        headerUpdated: 'updated',
        headerUpdateCount: 'updated',
      });
      expect(r.countUpdatesEnabled).toBe(false);
      expect(r.headerUpdateCount).toBe('updated');
    });

    it('disables the counter when its name collides with the created key', () => {
      const r = sanitizeSettings({
        countUpdatesEnabled: true,
        headerCreated: 'created',
        headerUpdateCount: 'created',
      });
      expect(r.countUpdatesEnabled).toBe(false);
    });

    it('disables the counter when its name collides with an ENABLED viewed key', () => {
      const r = sanitizeSettings({
        countUpdatesEnabled: true,
        enableLastViewed: true,
        headerLastViewed: 'seen',
        headerUpdateCount: 'seen',
      });
      expect(r.countUpdatesEnabled).toBe(false);
    });

    it('disables when the default name collides with a date key set to "updated_count" (resetting would re-collide)', () => {
      const r = sanitizeSettings({
        countUpdatesEnabled: true,
        headerUpdated: 'updated_count',
        headerUpdateCount: 'updated_count',
      });
      expect(r.countUpdatesEnabled).toBe(false);
      expect(r.headerUpdateCount).toBe('updated_count');
    });

    it('disables even when the collision is with a DISABLED date key (symmetric with counterKeyOrNull)', () => {
      // The collision check covers all three date-key names unconditionally, so the
      // settings state stays consistent with the write-boundary guard - no silently
      // inert "enabled but never writes" counter.
      const r = sanitizeSettings({
        countUpdatesEnabled: true,
        enableLastViewed: false,
        headerLastViewed: 'viewed',
        headerUpdateCount: 'viewed',
      });
      expect(r.countUpdatesEnabled).toBe(false);
      expect(r.headerUpdateCount).toBe('viewed');
    });

    it('keeps the counter enabled for a distinct non-colliding name', () => {
      const r = sanitizeSettings({
        countUpdatesEnabled: true,
        headerCreated: 'created',
        headerUpdated: 'updated',
        headerUpdateCount: 'edits',
      });
      expect(r.countUpdatesEnabled).toBe(true);
    });
  });
});

// Integration: the fix must protect the real flows that crash today.
describe('loadSettings / sync flow (integration)', () => {
  it('onload path: loadSettings does not throw when filterRules has wrong type', async () => {
    const plugin = new FrontmatterDateManagerPlugin();
    plugin.loadData = (async () => ({ filterRules: 42 })) as never;
    await expect(plugin.loadSettings()).resolves.toBeUndefined();
    expect(plugin.settings.filterRules).toBe('');
  });

  it('onExternalSettingsChange (sync) does not throw on corrupt data.json', async () => {
    const plugin = new FrontmatterDateManagerPlugin();
    plugin.statusBarEl = { setText: () => {} } as never;
    plugin.loadData = (async () => ({ filterRules: { bad: true } })) as never;
    await expect(plugin.onExternalSettingsChange()).resolves.toBeUndefined();
    expect(plugin.settings.filterRules).toBe('');
  });

  it('second instance: sanitized excludeKeys keep getContentForHashing safe', async () => {
    const plugin = new FrontmatterDateManagerPlugin();
    plugin.loadData = (async () => ({
      frontmatterHashExcludeKeys: 42,
      hashTrackingMode: 'frontmatter',
    })) as never;
    await plugin.loadSettings();
    const content = '---\ntitle: Test\n---\nBody';
    expect(() => plugin.getContentForHashing(content)).not.toThrow();
  });
});

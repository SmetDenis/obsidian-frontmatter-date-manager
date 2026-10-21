import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  FrontmatterDateManagerSettings,
  FrontmatterDateManagerSettingsTab,
  sanitizeSettings,
} from '../Settings';
import type FrontmatterDateManagerPlugin from '../main';
import { strings } from '../i18n';

type AnyDef = Record<string, any>;

describe('sanitizeSettings with nested property paths', () => {
  it('keeps valid nested names as typed', () => {
    const s = sanitizeSettings({
      headerCreated: 'meta > created',
      headerUpdated: 'parent >meta> updated',
      headerLastViewed: 'viewed',
    });
    expect(s.headerCreated).toBe('meta > created');
    expect(s.headerUpdated).toBe('parent >meta> updated');
  });

  it('keeps an invalid path as typed (nothing is written for it)', () => {
    const s = sanitizeSettings({ headerUpdated: 'meta >' });
    expect(s.headerUpdated).toBe('meta >');
  });

  it('a date nested in another date name: the longer one is reset to its default', () => {
    const s = sanitizeSettings({
      headerCreated: 'meta',
      headerUpdated: 'meta > updated',
    });
    expect(s.headerCreated).toBe('meta');
    expect(s.headerUpdated).toBe(DEFAULT_SETTINGS.headerUpdated);
  });

  it('repeats until no nesting is left (a reset default can collide again)', () => {
    const s = sanitizeSettings({
      headerCreated: 'meta',
      headerLastViewed: 'meta > v',
      headerUpdated: 'viewed > x',
    });
    expect(s.headerCreated).toBe('meta');
    expect(s.headerLastViewed).toBe('viewed');
    expect(s.headerUpdated).toBe('updated');
  });

  it('leaves two EQUAL date names alone - a stored setup keeps working', () => {
    const s = sanitizeSettings({
      headerUpdated: 'updated',
      headerLastViewed: 'updated',
    });
    expect(s.headerUpdated).toBe('updated');
    expect(s.headerLastViewed).toBe('updated');
  });

  it.each([
    ['equal to a nested date', 'meta > updated', 'meta > updated'],
    ['nested in a date', 'meta', 'meta > edits'],
    ['a date nested in it', 'meta > updated > x', 'meta > updated'],
  ])(
    'disables the counter when it is %s',
    (_label, headerUpdated, headerUpdateCount) => {
      const s = sanitizeSettings({
        headerUpdated,
        headerUpdateCount,
        countUpdatesEnabled: true,
      });
      expect(s.countUpdatesEnabled).toBe(false);
    },
  );

  it('keeps a counter in the same group as a date', () => {
    const s = sanitizeSettings({
      headerUpdated: 'meta > updated',
      headerUpdateCount: 'meta > edits',
      countUpdatesEnabled: true,
    });
    expect(s.countUpdatesEnabled).toBe(true);
  });
});

function makeTab(overrides: Partial<FrontmatterDateManagerSettings> = {}) {
  const plugin = {
    settings: { ...DEFAULT_SETTINGS, ...overrides },
    saveSettings: vi.fn().mockResolvedValue(undefined),
    recompileFilterRules: vi.fn(),
    getCompiledRules: vi.fn(() => []),
  } as unknown as FrontmatterDateManagerPlugin;
  const tab = new FrontmatterDateManagerSettingsTab(
    { commands: { commands: {} } } as any,
    plugin,
  );
  return { tab, plugin };
}

function datesItems(tab: FrontmatterDateManagerSettingsTab): AnyDef[] {
  return (tab.getSettingDefinitions()[1] as AnyDef).items as AnyDef[];
}

function validatorFor(tab: FrontmatterDateManagerSettingsTab, key: string) {
  const def = datesItems(tab).find((d) => d.control?.key === key);
  return def!.control.validate as (v: string) => string | undefined;
}

describe('property-name validation with nested paths', () => {
  const v = strings.settings.validation;

  it('accepts nested names and rejects an empty level on all four fields', () => {
    const { tab } = makeTab({ countUpdatesEnabled: true });
    for (const key of [
      'headerCreated',
      'headerUpdated',
      'headerLastViewed',
      'headerUpdateCount',
    ]) {
      const validate = validatorFor(tab, key);
      expect(validate('group > some_name')).toBeUndefined();
      expect(validate('meta >')).toBe(v.invalidPath);
      expect(validate('meta >> x')).toBe(v.invalidPath);
      expect(validate('> x')).toBe(v.invalidPath);
    }
  });

  it('rejects a date name equal to another date name (form only)', () => {
    const { tab } = makeTab();
    expect(validatorFor(tab, 'headerCreated')('updated')).toBe(
      v.dateNameCollision,
    );
    expect(validatorFor(tab, 'headerLastViewed')(' created ')).toBe(
      v.dateNameCollision,
    );
    // A field never collides with its own stored value.
    expect(validatorFor(tab, 'headerUpdated')('updated')).toBeUndefined();
  });

  it('rejects names nested in one another, both directions', () => {
    const { tab } = makeTab({ headerUpdated: 'meta > updated' });
    expect(validatorFor(tab, 'headerCreated')('meta')).toBe(v.nestingConflict);
    const { tab: tab2 } = makeTab({ headerCreated: 'meta' });
    expect(validatorFor(tab2, 'headerUpdated')('meta > updated')).toBe(
      v.nestingConflict,
    );
    expect(validatorFor(tab2, 'headerUpdated')('meta.updated')).toBeUndefined();
  });

  it('the counter: equal is the old collision, nesting is the new one', () => {
    const { tab } = makeTab({
      countUpdatesEnabled: true,
      headerUpdated: 'meta > updated',
    });
    const validate = validatorFor(tab, 'headerUpdateCount');
    expect(validate('meta > updated')).toBe(v.counterNameCollision);
    expect(validate('meta')).toBe(v.nestingConflict);
    expect(validate('meta > edits')).toBeUndefined();
  });

  it('a date field rejects nesting with the enabled counter only', () => {
    const { tab } = makeTab({
      countUpdatesEnabled: true,
      headerUpdateCount: 'meta > edits',
    });
    expect(validatorFor(tab, 'headerCreated')('meta')).toBe(v.nestingConflict);
    const { tab: tab2 } = makeTab({
      countUpdatesEnabled: false,
      headerUpdateCount: 'meta > edits',
    });
    expect(validatorFor(tab2, 'headerCreated')('meta')).toBeUndefined();
  });
});

describe('dot hint rows', () => {
  function hintAfter(tab: FrontmatterDateManagerSettingsTab, key: string) {
    const items = datesItems(tab);
    const index = items.findIndex((d) => d.control?.key === key);
    return items[index + 1]!;
  }
  const visible = (def: AnyDef) => (def.visible as () => boolean)();

  it('sits right under each of the four name fields, unsearchable', () => {
    const { tab } = makeTab();
    for (const key of [
      'headerCreated',
      'headerUpdated',
      'headerUpdateCount',
      'headerLastViewed',
    ]) {
      const hint = hintAfter(tab, key);
      expect(typeof hint.render).toBe('function');
      expect(hint.searchable).toBe(false);
    }
  });

  it('shows only for a dot without nesting, while the field is shown', () => {
    const { tab, plugin } = makeTab({ headerUpdated: 'meta.updated' });
    const hint = hintAfter(tab, 'headerUpdated');
    expect(visible(hint)).toBe(true);
    plugin.settings.headerUpdated = 'meta > updated';
    expect(visible(hint)).toBe(false);
    plugin.settings.headerUpdated = 'updated';
    expect(visible(hint)).toBe(false);
    plugin.settings.headerUpdated = 'meta.updated';
    plugin.settings.enableModifiedTime = false;
    expect(visible(hint)).toBe(false);
  });
});

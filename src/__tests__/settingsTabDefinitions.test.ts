import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  FrontmatterDateManagerSettings,
  FrontmatterDateManagerSettingsTab,
} from '../Settings';
import type FrontmatterDateManagerPlugin from '../main';
import { strings } from '../i18n';

// The declarative tree returned by getSettingDefinitions() is plain data
// (visible/validate/onDelete closures included), so the tab's structure and
// behavior gates are unit-testable without any DOM. Render callbacks are
// deliberately NOT executed here - same policy as the bulk chrome.

type AnyDef = Record<string, any>;

function makePlugin(
  overrides: Partial<FrontmatterDateManagerSettings> = {},
): FrontmatterDateManagerPlugin {
  return {
    settings: { ...DEFAULT_SETTINGS, ...overrides },
    saveSettings: vi.fn().mockResolvedValue(undefined),
    recompileFilterRules: vi.fn(),
    updateStatusBar: vi.fn(),
    getCompiledRules: vi.fn(() => []),
  } as unknown as FrontmatterDateManagerPlugin;
}

function makeTab(overrides: Partial<FrontmatterDateManagerSettings> = {}) {
  const app = {
    commands: { commands: { 'editor:follow-link': { name: 'Follow link' } } },
  };
  const plugin = makePlugin(overrides);
  const tab = new FrontmatterDateManagerSettingsTab(app as any, plugin);
  return { tab, plugin };
}

function topLevel(tab: FrontmatterDateManagerSettingsTab): AnyDef[] {
  return tab.getSettingDefinitions() as AnyDef[];
}

/** Depth-first walk over the whole tree (groups, lists, pages). */
function walk(items: AnyDef[]): AnyDef[] {
  const out: AnyDef[] = [];
  for (const item of items) {
    out.push(item);
    if (Array.isArray(item.items)) {
      out.push(...walk(item.items as AnyDef[]));
    }
  }
  return out;
}

function controlByKey(tab: FrontmatterDateManagerSettingsTab, key: string) {
  const def = walk(topLevel(tab)).find((d) => d.control?.key === key);
  if (!def) throw new Error(`no control definition for key ${key}`);
  return def;
}

function isVisible(def: AnyDef): boolean {
  if (typeof def.visible === 'function') return def.visible() as boolean;
  return def.visible !== false;
}

function groupByHeading(
  tab: FrontmatterDateManagerSettingsTab,
  heading: string,
) {
  const def = topLevel(tab).find(
    (d) => d.type === 'group' && d.heading === heading,
  );
  if (!def) throw new Error(`no group with heading ${heading}`);
  return def;
}

describe('getSettingDefinitions structure', () => {
  it('returns the expected top-level shape in order', () => {
    const { tab } = makeTab();
    const defs = topLevel(tab);

    // intro, dates group, hint, formatting, behavior, exclude list,
    // inversions, advanced page, bulk
    expect(defs).toHaveLength(9);
    expect(defs[1]?.type).toBe('group');
    expect(defs[1]?.heading).toBeUndefined(); // first section is unheaded
    expect(defs[3]?.heading).toBe(strings.settings.formatting.heading);
    expect(defs[4]?.heading).toBe(strings.settings.behavior.heading);
    expect(defs[5]?.type).toBe('list');
    expect(defs[5]?.cls).toBe('frontmatter-date-manager-exclude-list');
    expect(defs[6]?.heading).toBe(strings.settings.inversions.heading);
    expect(defs[7]?.type).toBe('page');
    expect(defs[7]?.name).toBe(strings.settings.advanced.pageName);
    expect(defs[8]?.heading).toBe(strings.settings.bulk.heading);
  });

  it('binds every expected settings key to a control', () => {
    const { tab } = makeTab();
    const keys = walk(topLevel(tab))
      .map((d) => d.control?.key as string | undefined)
      .filter((k): k is string => typeof k === 'string')
      .sort();
    expect(keys).toEqual(
      [
        'enableCreateTime',
        'headerCreated',
        'enableModifiedTime',
        'headerUpdated',
        'countUpdatesEnabled',
        'headerUpdateCount',
        'enableLastViewed',
        'headerLastViewed',
        'enableNumberProperties',
        'enableAutoUpdate',
        'minSecondsBetweenSaves',
        'enableContentHashCheck',
        'hashTrackingMode',
        'inversionFixStrategy',
        'inversionToleranceSec',
        'delayForNewFiles',
        'enableAutoPopulateCache',
        'hashCacheMaxSize',
      ].sort(),
    );
  });

  it('keeps the filter rules sub-page inside the behavior group', () => {
    const { tab } = makeTab();
    const behavior = groupByHeading(tab, strings.settings.behavior.heading);
    const page = (behavior.items as AnyDef[]).find((d) => d.type === 'page');
    expect(page?.name).toBe(strings.settings.filterRules.name);
    expect(page?.items).toHaveLength(3);
    // Rule count surfaces on the entry row without opening the page.
    expect((page?.displayValue as () => string)()).toBe('Rules: 0');
  });

  it('renders the five bulk buttons as render rows with stable classes', () => {
    const { tab } = makeTab();
    const bulk = groupByHeading(tab, strings.settings.bulk.heading);
    const items = bulk.items as AnyDef[];
    expect(items).toHaveLength(5);
    for (const item of items) {
      expect(typeof item.render).toBe('function');
      expect(item.control).toBeUndefined();
    }
  });

  it('marks the intro and hint rows unsearchable', () => {
    const { tab } = makeTab();
    const defs = topLevel(tab);
    expect(defs[0]?.searchable).toBe(false);
    expect(defs[2]?.searchable).toBe(false);
  });

  it('floors the free number controls at zero', () => {
    const { tab } = makeTab();
    for (const key of [
      'inversionToleranceSec',
      'delayForNewFiles',
      'hashCacheMaxSize',
    ]) {
      expect(controlByKey(tab, key).control.min).toBe(0);
    }
  });

  it('builds the post-update command dropdown at render time, not in the tree', () => {
    const { tab } = makeTab();
    // A control dropdown would freeze the command list in the definitions
    // snapshot (built once at plugin load) - the row must stay a render row.
    const advanced = topLevel(tab)[7] as AnyDef;
    const row = (advanced.items as AnyDef[]).find(
      (d) => d.name === strings.settings.advanced.postUpdateCommand.name,
    );
    expect(typeof row?.render).toBe('function');
    expect(row?.control).toBeUndefined();

    const options = (
      tab as unknown as { commandOptions(): Record<string, string> }
    ).commandOptions();
    expect(options['']).toBe(
      strings.settings.advanced.postUpdateCommand.optionNone,
    );
    expect(options['editor:follow-link']).toBe('Follow link');
  });
});

describe('visible predicates', () => {
  it('gates each property-name row on its feature toggle', () => {
    const { tab } = makeTab({
      enableCreateTime: false,
      enableModifiedTime: true,
      countUpdatesEnabled: false,
      enableLastViewed: false,
    });
    expect(isVisible(controlByKey(tab, 'headerCreated'))).toBe(false);
    expect(isVisible(controlByKey(tab, 'headerUpdated'))).toBe(true);
    expect(isVisible(controlByKey(tab, 'countUpdatesEnabled'))).toBe(true);
    expect(isVisible(controlByKey(tab, 'headerUpdateCount'))).toBe(false);
    expect(isVisible(controlByKey(tab, 'headerLastViewed'))).toBe(false);
  });

  it('shows the counter name row only when modified time and counting are on', () => {
    const { tab } = makeTab({
      enableModifiedTime: true,
      countUpdatesEnabled: true,
    });
    expect(isVisible(controlByKey(tab, 'headerUpdateCount'))).toBe(true);

    const { tab: tab2 } = makeTab({
      enableModifiedTime: false,
      countUpdatesEnabled: true,
    });
    expect(isVisible(controlByKey(tab2, 'headerUpdateCount'))).toBe(false);
  });

  it('gates the min-seconds slider on modified or viewed tracking', () => {
    const { tab } = makeTab({
      enableModifiedTime: false,
      enableLastViewed: false,
      enableCreateTime: true,
    });
    expect(isVisible(controlByKey(tab, 'minSecondsBetweenSaves'))).toBe(false);

    const { tab: tab2 } = makeTab({
      enableModifiedTime: false,
      enableLastViewed: true,
    });
    expect(isVisible(controlByKey(tab2, 'minSecondsBetweenSaves'))).toBe(true);
  });

  it('gates the hash-mode dropdown and exclude block on content hashing', () => {
    const { tab } = makeTab({ enableContentHashCheck: false });
    expect(isVisible(controlByKey(tab, 'hashTrackingMode'))).toBe(false);
    expect(isVisible(topLevel(tab)[5] as AnyDef)).toBe(false);

    const { tab: tab2 } = makeTab({
      enableContentHashCheck: true,
      hashTrackingMode: 'body',
    });
    expect(isVisible(controlByKey(tab2, 'hashTrackingMode'))).toBe(true);
    expect(isVisible(topLevel(tab2)[5] as AnyDef)).toBe(false);

    const { tab: tab3 } = makeTab({
      enableContentHashCheck: true,
      hashTrackingMode: 'both',
    });
    expect(isVisible(topLevel(tab3)[5] as AnyDef)).toBe(true);
  });

  it('hides everything after the dates group when all date toggles are off', () => {
    const { tab } = makeTab({
      enableCreateTime: false,
      enableModifiedTime: false,
      enableLastViewed: false,
      hashTrackingMode: 'both',
    });
    const defs = topLevel(tab);
    // The hint appears...
    expect(isVisible(defs[2] as AnyDef)).toBe(true);
    // ...and every subsequent section disappears (the display() early-return
    // replacement - the most load-bearing predicate in the tree).
    for (const index of [3, 4, 5, 6, 7, 8]) {
      expect(isVisible(defs[index] as AnyDef)).toBe(false);
    }
  });

  it('hides the hint while at least one date toggle is on', () => {
    const { tab } = makeTab();
    expect(isVisible(topLevel(tab)[2] as AnyDef)).toBe(false);
  });

  it('gates the rebuild-cache bulk row on content hashing', () => {
    const { tab } = makeTab({ enableContentHashCheck: false });
    const bulk = groupByHeading(tab, strings.settings.bulk.heading);
    const rebuild = (bulk.items as AnyDef[])[4];
    expect(isVisible(rebuild as AnyDef)).toBe(false);

    const { tab: tab2 } = makeTab({ enableContentHashCheck: true });
    const bulk2 = groupByHeading(tab2, strings.settings.bulk.heading);
    expect(isVisible((bulk2.items as AnyDef[])[4] as AnyDef)).toBe(true);
  });
});

describe('validate callbacks', () => {
  it('rejects empty property names on all four name fields', () => {
    const { tab } = makeTab();
    for (const key of [
      'headerCreated',
      'headerUpdated',
      'headerLastViewed',
      'headerUpdateCount',
    ]) {
      const validate = controlByKey(tab, key).control.validate as (
        v: string,
      ) => string | undefined;
      expect(validate('   ')).toBe(
        strings.settings.validation.propertyNameRequired,
      );
      expect(validate('some_name')).toBeUndefined();
    }
  });

  it('rejects a counter name colliding with a date key', () => {
    const { tab } = makeTab({ countUpdatesEnabled: true });
    const validate = controlByKey(tab, 'headerUpdateCount').control
      .validate as (v: string) => string | undefined;
    expect(validate('created')).toBe(
      strings.settings.validation.counterNameCollision,
    );
    expect(validate(' viewed ')).toBe(
      strings.settings.validation.counterNameCollision,
    );
    expect(validate('edits')).toBeUndefined();
  });

  it('rejects a date key colliding with the enabled counter, symmetrically', () => {
    const { tab } = makeTab({
      countUpdatesEnabled: true,
      headerUpdateCount: 'updated_count',
    });
    const validate = controlByKey(tab, 'headerCreated').control.validate as (
      v: string,
    ) => string | undefined;
    expect(validate('updated_count')).toBe(
      strings.settings.validation.counterNameCollision,
    );

    // With the counter disabled there is nothing to clobber.
    const { tab: tab2 } = makeTab({ countUpdatesEnabled: false });
    const validate2 = controlByKey(tab2, 'headerCreated').control.validate as (
      v: string,
    ) => string | undefined;
    expect(validate2('updated_count')).toBeUndefined();
  });
});

describe('setControlValue funnel', () => {
  it('trims property-name keys and persists through plugin.saveSettings', async () => {
    const { tab, plugin } = makeTab();
    await tab.setControlValue('headerCreated', '  made  ');
    expect(plugin.settings.headerCreated).toBe('made');
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it('recompiles filter rules after a filterRules write', async () => {
    const { tab, plugin } = makeTab();
    await tab.setControlValue('filterRules', 'templates/');
    expect(plugin.settings.filterRules).toBe('templates/');
    expect(plugin.recompileFilterRules).toHaveBeenCalledTimes(1);
  });

  it('refreshes the status bar after an enableAutoUpdate write', async () => {
    const { tab, plugin } = makeTab();
    await tab.setControlValue('enableAutoUpdate', false);
    expect(plugin.settings.enableAutoUpdate).toBe(false);
    expect(plugin.updateStatusBar).toHaveBeenCalledTimes(1);
  });

  it('persists a hashTrackingMode change', async () => {
    const { tab, plugin } = makeTab();
    await tab.setControlValue('hashTrackingMode', 'both');
    expect(plugin.settings.hashTrackingMode).toBe('both');
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it('writes non-trimmed keys verbatim', async () => {
    const { tab, plugin } = makeTab();
    await tab.setControlValue('dateFormat', ' yyyy ');
    expect(plugin.settings.dateFormat).toBe(' yyyy ');
  });
});

describe('exclude-keys list', () => {
  it('maps stored keys to unsearchable list rows', () => {
    const { tab } = makeTab({
      hashTrackingMode: 'both',
      frontmatterHashExcludeKeys: ['tags', 'aliases'],
    });
    const list = topLevel(tab)[5] as AnyDef;
    expect((list.items as AnyDef[]).map((i) => i.name)).toEqual([
      'tags',
      'aliases',
    ]);
    for (const item of list.items as AnyDef[]) {
      expect(item.searchable).toBe(false);
    }
    expect(list.emptyState).toBe(
      strings.settings.behavior.excludeKeys.emptyState,
    );
  });

  it('onDelete removes the indexed key, saves, and rebuilds the tab', async () => {
    const { tab, plugin } = makeTab({
      hashTrackingMode: 'both',
      frontmatterHashExcludeKeys: ['a', 'b', 'c'],
    });
    const updateSpy = vi.spyOn(tab, 'update');
    const list = topLevel(tab)[5] as AnyDef;
    (list.onDelete as (index: number) => void)(1);

    await vi.waitFor(() => {
      expect(plugin.settings.frontmatterHashExcludeKeys).toEqual(['a', 'c']);
      // update() lands a microtask after the funnel's save resolves.
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });
});

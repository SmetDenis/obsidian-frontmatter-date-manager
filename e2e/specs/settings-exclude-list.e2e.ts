/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser, $$ } from '@wdio/globals';
import { assert } from '../helpers/assert';
import { setSettings } from '../helpers/settings';
import { settingsTab } from '../pageobjects/settingsTab';

const PLUGIN_ID = 'frontmatter-date-manager';

/** Read the plugin's current excluded-property list from the running app. */
async function excludeKeys(): Promise<string[]> {
  return browser.executeObsidian(({ app }, id) => {
    const internal = app as unknown as {
      plugins: {
        plugins: Record<string, { settings?: Record<string, unknown> }>;
      };
    };
    const s = internal.plugins.plugins[id]?.settings;
    return (
      (s?.frontmatterHashExcludeKeys as string[] | undefined) ?? []
    ).slice();
  }, PLUGIN_ID);
}

// The exclude block only renders when content hashing is on and the tracking
// mode includes properties.
const SHOW_EXCLUDE = {
  enableContentHashCheck: true,
  hashTrackingMode: 'both',
} as const;

describe('settings: ignore-properties comma input + list', function () {
  it('S1: splits a comma-separated list into separate list rows', async function () {
    await setSettings({ ...SHOW_EXCLUDE, frontmatterHashExcludeKeys: [] });
    await settingsTab.open();

    await settingsTab.addExcludeProperty('tags, aliases, cssclasses');

    await browser.waitUntil(
      async () => (await settingsTab.excludeRowCount()) === 3,
      { timeout: 5_000, timeoutMsg: 'expected 3 list rows after comma input' },
    );

    assert.deepEqual(await settingsTab.excludeRowLabels(), [
      'tags',
      'aliases',
      'cssclasses',
    ]);
    assert.deepEqual(await excludeKeys(), ['tags', 'aliases', 'cssclasses']);

    // The add commits via update(), which re-renders the tab in place. Render
    // rows must clean up what they append to settingEl - a second intro box
    // here means a render row leaked DOM across the rebuild.
    assert.equal(
      await $$('.frontmatter-date-manager-plugin-description').length,
      1,
      'render rows must not duplicate on in-place update()',
    );

    await browser.saveScreenshot('./e2e/screenshots/exclude-list.png');

    await settingsTab.close();
  });

  it('S2: dedupes against existing keys and drops empty segments', async function () {
    await setSettings({
      ...SHOW_EXCLUDE,
      frontmatterHashExcludeKeys: ['tags'],
    });
    await settingsTab.open();

    // "tags" is already present; the doubled/trailing commas are empty segments.
    await settingsTab.addExcludeProperty('tags, , status,');

    await browser.waitUntil(
      async () => (await settingsTab.excludeRowCount()) === 2,
      { timeout: 5_000, timeoutMsg: 'expected 2 list rows (tags + status)' },
    );

    assert.deepEqual(await excludeKeys(), ['tags', 'status']);

    await settingsTab.close();
  });

  it('S3: removes a single row via its delete control', async function () {
    await setSettings({
      ...SHOW_EXCLUDE,
      frontmatterHashExcludeKeys: ['tags', 'aliases', 'cssclasses'],
    });
    await settingsTab.open();

    await browser.waitUntil(
      async () => (await settingsTab.excludeRowCount()) === 3,
      { timeout: 5_000 },
    );

    await settingsTab.removeExcludeRow('aliases');

    await browser.waitUntil(
      async () => (await settingsTab.excludeRowCount()) === 2,
      { timeout: 5_000, timeoutMsg: 'list row never removed' },
    );

    assert.deepEqual(await excludeKeys(), ['tags', 'cssclasses']);

    // Same no-duplication invariant after the delete-triggered update().
    assert.equal(
      await $$('.frontmatter-date-manager-plugin-description').length,
      1,
      'render rows must not duplicate on delete-triggered update()',
    );

    await settingsTab.close();
  });
});

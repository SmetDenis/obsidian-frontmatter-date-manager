import { browser } from '@wdio/globals';
import assert from 'node:assert/strict';
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
    return ((s?.frontmatterHashExcludeKeys as string[]) ?? []).slice();
  }, PLUGIN_ID);
}

// The exclude list only renders when content hashing is on and the tracking
// mode includes properties.
const SHOW_EXCLUDE = {
  enableContentHashCheck: true,
  hashTrackingMode: 'both',
} as const;

describe('settings: ignore-properties comma input + chips', function () {
  it('S1: splits a comma-separated list into separate chips', async function () {
    await setSettings({ ...SHOW_EXCLUDE, frontmatterHashExcludeKeys: [] });
    await settingsTab.open();

    await settingsTab.addExcludeProperty('tags, aliases, cssclasses');

    await browser.waitUntil(
      async () => (await settingsTab.excludeChipCount()) === 3,
      { timeout: 5_000, timeoutMsg: 'expected 3 chips after comma input' },
    );

    assert.deepEqual(await settingsTab.excludeChipLabels(), [
      'tags',
      'aliases',
      'cssclasses',
    ]);
    assert.deepEqual(await excludeKeys(), ['tags', 'aliases', 'cssclasses']);

    await browser.saveScreenshot('./e2e/screenshots/exclude-chips.png');

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
      async () => (await settingsTab.excludeChipCount()) === 2,
      { timeout: 5_000, timeoutMsg: 'expected 2 chips (tags + status)' },
    );

    assert.deepEqual(await excludeKeys(), ['tags', 'status']);

    await settingsTab.close();
  });

  it('S3: removes a single chip via its remove control', async function () {
    await setSettings({
      ...SHOW_EXCLUDE,
      frontmatterHashExcludeKeys: ['tags', 'aliases', 'cssclasses'],
    });
    await settingsTab.open();

    await browser.waitUntil(
      async () => (await settingsTab.excludeChipCount()) === 3,
      { timeout: 5_000 },
    );

    await settingsTab.removeExcludeChip('aliases');

    await browser.waitUntil(
      async () => (await settingsTab.excludeChipCount()) === 2,
      { timeout: 5_000, timeoutMsg: 'chip never removed' },
    );

    assert.deepEqual(await excludeKeys(), ['tags', 'cssclasses']);

    await settingsTab.close();
  });
});

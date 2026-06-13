/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { assert } from '../helpers/assert';
import { createNote, readNote } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue } from '../helpers/frontmatter';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';

describe('bulk: rename frontmatter key (UI-driven)', function () {
  it('B3: renames created -> createdAt across files, preserving the value', async function () {
    await setSettings({ headerCreated: 'created', headerUpdated: 'updated' });
    const note = await createNote(
      'b3',
      `---\ncreated: 2020-01-01T00:00:00\nkeep: me\n---\n\nbody\n`,
    );

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-rename');
    await bulkModal.fillByClass(
      'frontmatter-date-manager-rename-old',
      'created',
    );
    await bulkModal.fillByClass(
      'frontmatter-date-manager-rename-new',
      'createdAt',
    );
    await bulkModal.clickPrimary(); // Scan & preview
    await bulkModal.waitForPreview();
    await bulkModal.clickPrimary(); // Run

    await browser.waitUntil(
      async () => fmValue(await readNote(note), 'createdAt') !== undefined,
      { timeout: 20_000, interval: 250, timeoutMsg: 'key never renamed' },
    );

    const after = await readNote(note);
    assert.equal(fmValue(after, 'createdAt'), '2020-01-01T00:00:00');
    assert.equal(fmValue(after, 'created'), undefined, 'old key must be gone');
    assert.equal(fmValue(after, 'keep'), 'me');

    await bulkModal.close();
    await settingsTab.close();
  });
});

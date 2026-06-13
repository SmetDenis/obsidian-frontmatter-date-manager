/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { assert } from '../helpers/assert';
import { createNote, readNote } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue } from '../helpers/frontmatter';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';

describe('bulk: reformat dates (UI-driven)', function () {
  it('B4: rewrites an existing date into the configured format', async function () {
    // Target format is date-only; the source value has a time component.
    await setSettings({
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: 'yyyy-MM-dd',
      timezone: '',
      enableNumberProperties: false,
    });
    const note = await createNote(
      'b5',
      `---\ncreated: 2020-01-01T08:09:10\nkeep: me\n---\n\nbody\n`,
    );

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-reformat');
    await bulkModal.select(
      'frontmatter-date-manager-reformat-scope',
      'created',
    );
    await bulkModal.clickPrimary(); // Scan & preview
    await bulkModal.waitForPreview();
    await bulkModal.clickPrimary(); // Run (always red)

    await browser.waitUntil(
      async () => fmValue(await readNote(note), 'created') === '2020-01-01',
      {
        timeout: 20_000,
        interval: 250,
        timeoutMsg: 'created never reformatted to date-only',
      },
    );

    const after = await readNote(note);
    assert.equal(fmValue(after, 'created'), '2020-01-01');
    assert.equal(fmValue(after, 'keep'), 'me');

    await bulkModal.close();
    await settingsTab.close();
  });
});

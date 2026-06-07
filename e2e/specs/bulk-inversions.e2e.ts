import { browser } from '@wdio/globals';
import assert from 'node:assert/strict';
import { createNote, readNote } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue } from '../helpers/frontmatter';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';

const ISO = "yyyy-MM-dd'T'HH:mm:ss";

describe('bulk: find & fix inversions (UI-driven)', function () {
  it('B6: Run is disabled until a strategy is picked, then fixes the inversion', async function () {
    await setSettings({
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      timezone: '',
      enableNumberProperties: false,
      inversionToleranceSec: 0,
    });
    // updated < created => inversion.
    const note = await createNote(
      'b6',
      `---\ncreated: 2022-12-31T00:00:00\nupdated: 2020-01-01T00:00:00\n---\n\nbody\n`,
    );

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-inversions');
    await bulkModal.waitForPreview(); // auto-scan renders the inversion table

    assert.ok(
      await bulkModal.isPrimaryDisabled(),
      'Run must be disabled while strategy is "disabled"',
    );

    await bulkModal.select(
      'frontmatter-date-manager-inversions-strategy',
      'updated-to-created',
    );
    assert.ok(
      !(await bulkModal.isPrimaryDisabled()),
      'Run must enable once a real strategy is chosen',
    );
    await bulkModal.clickPrimary(); // Run (red)

    // updated-to-created => updated becomes equal to created (no longer inverted).
    await browser.waitUntil(
      async () =>
        fmValue(await readNote(note), 'updated') !== '2020-01-01T00:00:00',
      { timeout: 20_000, interval: 250, timeoutMsg: 'inversion never fixed' },
    );
    const after = await readNote(note);
    assert.equal(fmValue(after, 'created'), '2022-12-31T00:00:00');
    assert.equal(fmValue(after, 'updated'), '2022-12-31T00:00:00');

    await bulkModal.close();
    await settingsTab.close();
  });
});

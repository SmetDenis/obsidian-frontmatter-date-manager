/* global describe, it */
import { browser } from '@wdio/globals';
import { assert } from '../helpers/assert';
import { createNote, readNote } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';

describe('bulk: rebuild hash cache (UI-driven)', function () {
  it('B7: runs to completion without mutating note data', async function () {
    await setSettings({ enableContentHashCheck: true });
    const note = await createNote(
      'b7',
      `---\ncreated: 2020-01-01T00:00:00\nkeep: me\n---\n\n# Body\n\ntext\n`,
    );
    const before = await readNote(note);

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-rebuild-cache');
    await bulkModal.clickPrimary(); // Run (blue, confirm screen)

    // Give the execute phase time to walk all files.
    await browser.pause(5_000);

    const after = await readNote(note);
    assert.equal(
      after,
      before,
      'rebuild cache must not change any note content',
    );

    await bulkModal.close();
    await settingsTab.close();
  });
});

import { browser } from '@wdio/globals';
import assert from 'node:assert/strict';
import { createNote, readNote } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue } from '../helpers/frontmatter';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';

const ISO = "yyyy-MM-dd'T'HH:mm:ss";

describe('bulk: populate timestamps (UI-driven)', function () {
  it('B1: fill-missing adds created/updated without overwriting existing', async function () {
    await setSettings({
      enableAutoUpdate: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      enableNumberProperties: false,
      filterRules: '',
    });
    // One note missing both dates, one with an existing created.
    const missing = await createNote(
      'b1-missing',
      `---\ntitle: x\n---\n\nbody\n`,
    );
    const hasCreated = await createNote(
      'b1-has',
      `---\ncreated: 2019-05-05T05:05:05\n---\n\nbody\n`,
    );

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-populate');
    await bulkModal.select('frontmatter-date-manager-populate-mode', 'both');
    await bulkModal.select(
      'frontmatter-date-manager-populate-override',
      'fill-missing',
    );
    await bulkModal.clickPrimary(); // Scan & preview
    await bulkModal.waitForPreview();
    await bulkModal.clickPrimary(); // Run (blue: fill-missing is non-destructive)

    await browser.waitUntil(
      async () => fmValue(await readNote(missing), 'created') !== undefined,
      { timeout: 20_000, interval: 250, timeoutMsg: 'created never filled' },
    );

    // Missing note got both dates.
    const m = await readNote(missing);
    assert.ok(fmValue(m, 'created'));
    assert.ok(fmValue(m, 'updated'));
    assert.match(getFrontmatterValueSafe(m, 'title'), /x/);
    // Existing created untouched.
    assert.equal(
      fmValue(await readNote(hasCreated), 'created'),
      '2019-05-05T05:05:05',
      'fill-missing must not overwrite an existing created',
    );

    await bulkModal.close();
    await settingsTab.close();

    function getFrontmatterValueSafe(raw: string, key: string): string {
      return fmValue(raw, key) ?? '';
    }
  });

  it('B2: overwrite-all replaces existing values (destructive Run)', async function () {
    await setSettings({
      enableAutoUpdate: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      enableNumberProperties: false,
      filterRules: '',
    });
    const note = await createNote(
      'b2',
      `---\ncreated: 2019-05-05T05:05:05\nkeep: me\n---\n\n# Body\n\ntext\n`,
    );

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-populate');
    await bulkModal.select('frontmatter-date-manager-populate-mode', 'created');
    await bulkModal.select(
      'frontmatter-date-manager-populate-override',
      'overwrite-all',
    );
    await bulkModal.clickPrimary(); // Scan & preview
    await bulkModal.waitForPreview();
    assert.ok(
      await bulkModal.previewVisible(),
      'preview diff table must render',
    );
    await bulkModal.clickPrimary(); // Run (red)

    await browser.waitUntil(
      async () =>
        fmValue(await readNote(note), 'created') !== '2019-05-05T05:05:05',
      {
        timeout: 20_000,
        interval: 250,
        timeoutMsg: 'created never overwritten',
      },
    );

    const after = await readNote(note);
    assert.notEqual(fmValue(after, 'created'), '2019-05-05T05:05:05');
    // unrelated key + body intact
    assert.equal(fmValue(after, 'keep'), 'me');
    assert.match(after, /# Body/);
    assert.match(after, /\ntext\n/);

    await bulkModal.close();
    await settingsTab.close();
  });
});

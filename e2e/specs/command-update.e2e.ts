/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { obsidianPage } from 'wdio-obsidian-service';
import { assert } from '../helpers/assert';
import {
  createNote,
  readNote,
  appendToNote,
  waitForKey,
} from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { getBody, fmValue } from '../helpers/frontmatter';

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const COMMAND_ID = 'frontmatter-date-manager:update-timestamps-current-file';

describe('command: update timestamps for current file', function () {
  it('A4: with auto-update OFF, an edit does not stamp but the command does', async function () {
    await setSettings({
      enableAutoUpdate: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      enableNumberProperties: false,
    });

    const path = await createNote(
      'a4',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\n# Note\n\noriginal body\n`,
    );

    // Edit the body — with auto-update off, no `updated` may appear.
    await appendToNote(path, '\nedit while auto is off\n');
    await browser.pause(3_000); // past the 2s debounce
    assert.equal(
      fmValue(await readNote(path), 'updated'),
      undefined,
      'auto-update is off, so the edit must not stamp updated',
    );

    // Now run the command on the active file.
    await obsidianPage.openFile(path);
    await browser.executeObsidianCommand(COMMAND_ID);
    await waitForKey(path, 'updated');

    const after = await readNote(path);
    assert.match(fmValue(after, 'updated')!, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(
      fmValue(after, 'created'),
      '2020-01-01T00:00:00',
      'created must be preserved',
    );
    const body = getBody(after);
    assert.match(body, /# Note/);
    assert.match(body, /original body/);
    assert.match(body, /edit while auto is off/);
  });
});

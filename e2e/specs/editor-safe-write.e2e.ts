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
import { fmValue, getBody } from '../helpers/frontmatter';

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const COMMAND_ID = 'frontmatter-date-manager:update-timestamps-current-file';

// Real-Obsidian mtime of a note (the seam the unit mock cannot reach). A write
// that PRESERVES this value is exactly what stops Obsidian from treating the
// change as external and reloading the editor - which would jump the user's
// cursor and scroll while they type.
async function mtimeOf(path: string): Promise<number> {
  return browser.executeObsidian(({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    return f instanceof obsidian.TFile ? f.stat.mtime : -1;
  }, path);
}

describe('editor-safe writes: mtime preservation for an open note', function () {
  it('E1: stamping a note OPEN in the editor preserves its mtime (no reload)', async function () {
    // Command path so the body is never edited: only the plugin's own write can
    // move mtime, making the assertion exact.
    await setSettings({
      enableAutoUpdate: false,
      enableLastViewed: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      enableNumberProperties: false,
    });

    const path = await createNote(
      'editorsafe',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\n# Note\n\nline 1\nline 2\nline 3\n`,
    );

    // Open the note in a Markdown editor leaf, then snapshot mtime BEFORE any
    // plugin write (opening does not modify the file).
    await obsidianPage.openFile(path);
    const before = await mtimeOf(path);

    // Stamp via the command (routes through handleFileChange; the file is open).
    await browser.executeObsidianCommand(COMMAND_ID);
    await waitForKey(path, 'updated');

    const after = await mtimeOf(path);

    // The write pinned { ctime, mtime } because the note is open, so mtime must
    // be byte-for-byte unchanged. An unchanged mtime is what keeps Obsidian from
    // reloading the editor (the cursor/scroll "storm").
    assert.equal(
      after,
      before,
      `mtime must be preserved for a note open in the editor (before=${before}, after=${after})`,
    );

    // The stamp still landed, created is preserved, and the body survives.
    const doc = await readNote(path);
    assert.match(fmValue(doc, 'updated')!, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(fmValue(doc, 'created'), '2020-01-01T00:00:00');
    assert.match(getBody(doc), /line 1\nline 2\nline 3/);
  });

  it('E2: stamping a note NOT open in any editor advances its mtime', async function () {
    // The contrast case that proves the branch is conditional: a closed note has
    // no live editor to disturb, so the write is left to bump mtime (metadata
    // then refreshes immediately).
    await setSettings({
      enableAutoUpdate: true,
      enableLastViewed: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      enableNumberProperties: false,
      // Take the new-file delay window out of the timing so the append is
      // processed by the normal debounce path.
      delayForNewFiles: 0,
    });

    const path = await createNote(
      'editorsafe-closed',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\n# Note\n\nbody\n`,
    );

    // The note is never opened, so it is absent from every Markdown leaf. Edit
    // its body on disk and snapshot mtime right after the edit, before the
    // debounced plugin write.
    await appendToNote(path, '\nedit while closed\n');
    const beforePluginWrite = await mtimeOf(path);

    // The auto path stamps `updated`; with the note closed the write bumps mtime.
    await waitForKey(path, 'updated');
    const after = await mtimeOf(path);

    assert.ok(
      after > beforePluginWrite,
      `mtime must advance for a note not open in any editor (before=${beforePluginWrite}, after=${after})`,
    );
  });
});

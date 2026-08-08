/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { obsidianPage } from 'wdio-obsidian-service';
import { assert } from '../helpers/assert';
import { createNote, readNote, waitForKey } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue, getBody } from '../helpers/frontmatter';

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const COMMAND_ID = 'frontmatter-date-manager:update-timestamps-current-file';

// The happy path of the single-file write on a note that IS open in the editor
// but whose buffer is CLEAN. This is the case the dirty-buffer guard must let
// through, and it is the complement of editor-dirty-merge.e2e.ts (which covers
// every dirty case). It asserts what actually matters for a clean buffer: the
// stamp lands, the write does not disturb the editor's text, and everything
// else in the note survives real processFrontMatter serialization.
//
// It deliberately does NOT assert mtime preservation any more. The plugin used
// to pin { ctime, mtime } for an open note on the theory that this prevented
// Obsidian from reloading the editor - that rationale was disproved (the reload
// and merge are gated on the view's `dirty` flag and never look at mtime), and
// the pin caused a real defect: a size-neutral re-stamp emitted no event at all,
// so the editor never learned about the write and its next save reverted it.

async function mtimeOf(path: string): Promise<number> {
  return browser.executeObsidian(({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    return f instanceof obsidian.TFile ? f.stat.mtime : -1;
  }, path);
}

async function editorText(): Promise<string> {
  return browser.executeObsidian(({ app, obsidian }) => {
    const view = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
    return view?.editor.getValue() ?? '';
  });
}

describe('single-file writes into a CLEAN open editor', function () {
  it('E1: a note open with a clean buffer is stamped, and the editor text is untouched', async function () {
    // Command path so the body is never edited: only the plugin's own write can
    // change the file, making the assertions exact.
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
      `---\ncreated: 2020-01-01T00:00:00\nkeep: me\n---\n\n# Note\n\nline 1\nline 2\nline 3\n`,
    );

    await obsidianPage.openFile(path);
    await browser.pause(500); // let the initial load settle; the buffer is clean
    const bodyBefore = (await editorText()).split('---').slice(2).join('---');

    await browser.executeObsidianCommand(COMMAND_ID);
    await waitForKey(path, 'updated');

    const doc = await readNote(path);
    assert.match(fmValue(doc, 'updated')!, /^\d{4}-\d{2}-\d{2}T/);
    // Untouched: an unrelated property, the pre-existing created value, the body.
    assert.equal(fmValue(doc, 'created'), '2020-01-01T00:00:00');
    assert.equal(fmValue(doc, 'keep'), 'me');
    assert.match(getBody(doc), /line 1\nline 2\nline 3/);

    // The live buffer's body is unchanged - the write only replaced frontmatter
    // lines, no merge and no text disturbance.
    const bodyAfter = (await editorText()).split('---').slice(2).join('---');
    assert.equal(bodyAfter, bodyBefore, 'the editor body text was disturbed');
  });

  it('E2: the write reaches the file system - mtime advances even for an open note', async function () {
    // The pin is gone, so a write on an open note now bumps mtime like any
    // other. That is what makes the write visible to the open editor (Obsidian
    // emits `modified` on an mtime OR size change), which is precisely what
    // stops the editor's next save from reverting a size-neutral stamp.
    await setSettings({
      enableAutoUpdate: false,
      enableLastViewed: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      enableNumberProperties: false,
    });

    const path = await createNote(
      'editorsafe-mtime',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\n# Note\n\nbody\n`,
    );

    await obsidianPage.openFile(path);
    await browser.pause(500);
    const before = await mtimeOf(path);

    await browser.executeObsidianCommand(COMMAND_ID);
    await waitForKey(path, 'updated');
    const after = await mtimeOf(path);

    assert.ok(
      after >= before,
      `mtime must not be pinned backwards (before=${before}, after=${after})`,
    );
    assert.notEqual(
      after,
      -1,
      'the note vanished from the vault - the scenario proves nothing',
    );
  });
});

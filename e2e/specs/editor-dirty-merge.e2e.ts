/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { assert } from '../helpers/assert';
import { createNote, readNote, appendToNote } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { getBody, fmValue } from '../helpers/frontmatter';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';
import {
  armWriteProbe,
  armNoticeProbe,
  armModifyProbe,
  modifyProbeFired,
  writeSummary,
  mergeNoticesFor,
  collectedNotices,
  openAndFocus,
  openInReadingMode,
  editorText,
  leafDirtyStates,
  statOf,
  suggesterEntries,
  typeSlowly,
  holdBufferDirty,
  releaseBufferDirty,
  dirtyTheBuffer,
  closeSettings,
} from '../helpers/editorProbe';

// Regression net for issue #10 ("external merges still happening"). Written as
// a reproduction suite: 9 of these 11 scenarios failed on 1.2.1, which is what
// proved the bug causally. They now guard the dirty-buffer write guard.
//
// The invariant every scenario asserts, from Obsidian's own code (verified in
// obsidian-1.12.7.asar and obsidian-1.13.6.asar): a `TextFileView` merges the
// plugin's write into the live buffer - fuzzy diff-match-patch, per-hunk failure
// flags discarded - and shows "<file> has been modified externally, merging
// changes automatically." IFF `view.dirty` is true when the vault `modify`
// arrives. mtime is never consulted there, so pinning `{ ctime, mtime }` on the
// write (what 1.2.1 did) cannot prevent it. Hence: THE PLUGIN MUST NEVER CALL
// processFrontMatter WHILE ANY LEAF SHOWING THAT FILE HAS UNSAVED CHANGES.
//
// Every scenario proves that causally via `armWriteProbe`, which records the
// `dirty` state of each matching leaf AT THE MOMENT of each processFrontMatter
// call. Asserting only "no merge notice appeared" would green just as happily
// when the plugin never wrote at all.

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const COMMAND_ID = 'frontmatter-date-manager:update-timestamps-current-file';
const INVERSION_NOTICE = /out-of-order dates were detected and fixed/;
const STALE = '2020-01-01T00:00:00';

// No throttle and no new-file delay unless a scenario needs them, so the only
// timing left is Obsidian's own 2 s editor-save debounce and the plugin's 2 s
// modify debounce.
const BASE = {
  enableCreateTime: true,
  enableModifiedTime: true,
  headerCreated: 'created',
  headerUpdated: 'updated',
  dateFormat: ISO,
  timezone: '',
  enableNumberProperties: false,
  enableContentHashCheck: true,
  hashTrackingMode: 'body',
  minSecondsBetweenSaves: 0,
  delayForNewFiles: 0,
  enableLastViewed: false,
  countUpdatesEnabled: false,
  inversionFixStrategy: 'disabled',
};

/** The core invariant. Every scenario pairs it with its own liveness control -
 * either "the deferred stamp lands once the buffer goes clean" or a second,
 * clean note processed in the same run - because "the plugin wrote nothing"
 * would otherwise green this assertion for the wrong reason. */
async function assertNeverWroteWhileDirty(
  path: string,
  context: string,
): Promise<void> {
  const { dirty } = await writeSummary(path);
  assert.equal(
    dirty.length,
    0,
    `${context}: wrote while a leaf had unsaved changes -> ${JSON.stringify(dirty)}`,
  );
  assert.equal(
    (await mergeNoticesFor(path)).length,
    0,
    `${context}: Obsidian merged the write into the live buffer`,
  );
}

/** Bring the note to the exact state the defect needs, without racing anything:
 * dirty the buffer, wait for Obsidian's own save to flush it (which fires the
 * `modify` that arms the plugin), then dirty it again and freeze it dirty. */
async function armDirtyAfterEditorSave(path: string): Promise<void> {
  await armModifyProbe(path);
  await dirtyTheBuffer('\nfirst edit');
  await browser.waitUntil(async () => modifyProbeFired(), {
    timeout: 15_000,
    interval: 100,
    timeoutMsg: 'the editor never flushed its buffer (no modify event)',
  });
  await holdBufferDirty(path);
  await browser.pause(500);
  const states = await leafDirtyStates(path);
  assert.ok(
    states.includes(true),
    `precondition: the buffer must be dirty, got ${JSON.stringify(states)}`,
  );
}

describe('writes into an editor with unsaved changes (issue #10)', function () {
  it('D1: the automatic modify path must not write while the buffer is dirty', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: true });
    // `updated` missing, so a write would ADD a key - a change visible both on
    // disk and to the open editor.
    const path = await createNote(
      'dirty-auto',
      `---\ncreated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    await armWriteProbe();
    await armNoticeProbe();
    try {
      await armDirtyAfterEditorSave(path);
      // The plugin's 2 s debounce was armed by the flush above; it now fires
      // into a buffer that is guaranteed dirty.
      await browser.pause(4_000);
      await assertNeverWroteWhileDirty(path, 'D1');
      assert.equal(
        fmValue(await readNote(path), 'updated'),
        undefined,
        'D1: nothing may be stamped while the buffer holds unsaved changes',
      );
    } finally {
      await releaseBufferDirty();
    }

    // Liveness control: the deferral must not starve. Once the buffer is clean
    // the pending stamp has to land on its own, with no further user action.
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      {
        timeout: 20_000,
        interval: 250,
        timeoutMsg:
          'D1: the deferred stamp never landed after the buffer went clean',
      },
    );
    await assertNeverWroteWhileDirty(path, 'D1 (after release)');
  });

  it('D1R: a real typing user must keep every character and see no merge', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: true });
    const path = await createNote(
      'dirty-typing',
      `---\ncreated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    await armWriteProbe();
    await armNoticeProbe();

    // The human-faithful variant of D1: no instrumentation of the buffer, just
    // continuous typing across several of Obsidian's 2 s save cycles.
    const marker = 'abcdefghijklmnop';
    await typeSlowly(marker.slice(0, 3), 400);
    assert.match(
      await editorText(),
      /abc/,
      'typing did not reach the editor - the scenario would prove nothing',
    );
    await typeSlowly(marker.slice(3), 400);
    // Typing stopped: Obsidian's own 2 s autosave flushes the buffer, the guard
    // then lets the deferred stamp through. Waiting for it is the liveness half
    // of the scenario - without it, "no dirty write" could mean "no write".
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      {
        timeout: 20_000,
        interval: 250,
        timeoutMsg: 'D1R: the stamp never landed after typing stopped',
      },
    );

    const { total, dirty } = await writeSummary(path);
    const merges = await mergeNoticesFor(path);
    assert.ok(
      total > 0,
      'the plugin never wrote - the scenario proves nothing',
    );
    // Keystroke integrity first: it is the severe half of the defect. Obsidian's
    // merge is fuzzy and discards patch_apply's per-hunk failure flags.
    assert.match(
      await editorText(),
      new RegExp(marker),
      `typed text was altered - dirty writes=${dirty.length}, merges=${merges.length}`,
    );
    assert.equal(
      dirty.length,
      0,
      `wrote while dirty -> ${JSON.stringify(dirty)}`,
    );
    assert.equal(merges.length, 0, `merge notice: ${JSON.stringify(merges)}`);
  });

  it('D2: the new-file delay path must not write into a dirty buffer either', async function () {
    // Default 5 s create window - the REAL first-write path on a genuinely new
    // note, which D1 bypasses by setting the delay to 0.
    await setSettings({
      ...BASE,
      enableAutoUpdate: true,
      delayForNewFiles: 5_000,
    });
    const path = await createNote(
      'dirty-newfile',
      `---\ncreated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);

    await armWriteProbe();
    await armNoticeProbe();
    try {
      // The edit inside the window is remembered (newFileModified) and processed
      // when the window expires - by then the buffer is dirty again.
      await armDirtyAfterEditorSave(path);
      await browser.pause(8_000);
      await assertNeverWroteWhileDirty(path, 'D2');
    } finally {
      await releaseBufferDirty();
    }

    // Liveness control, as in D1: the create-window path must still stamp once
    // the buffer is clean.
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      {
        timeout: 20_000,
        interval: 250,
        timeoutMsg:
          'D2: the deferred stamp never landed after the buffer went clean',
      },
    );
    await assertNeverWroteWhileDirty(path, 'D2 (after release)');
  });

  it('D3: the manual command must defer on a dirty buffer, keep the suggester, then stamp when clean', async function () {
    // Auto-update OFF: the command is the only writer, so the scenario is exact.
    await setSettings({ ...BASE, enableAutoUpdate: false });
    await createNote(
      'dirtylinktarget',
      `---\ncreated: ${STALE}\n---\n\ntarget\n`,
    );
    const path = await createNote(
      'dirty-command',
      `---\ncreated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    await armWriteProbe();
    await armNoticeProbe();
    try {
      // Real typing here (no simulated typist - it would append characters into
      // the link). Typing itself keeps the buffer dirty, and the command runs
      // immediately afterwards, well inside Obsidian's 2 s autosave window.
      const link = '[[dirtylinktarget';
      await typeSlowly(link, 150);

      const entries = await suggesterEntries();
      assert.ok(
        entries.some((e) => e.includes('dirtylinktarget')),
        `precondition: the link suggester must be offering the target, got ${JSON.stringify(entries)}`,
      );

      assert.ok(
        (await leafDirtyStates(path)).includes(true),
        'precondition: the buffer must still be dirty when the command runs',
      );
      await browser.executeObsidianCommand(COMMAND_ID);
      await browser.pause(1_500);

      await assertNeverWroteWhileDirty(path, 'D3');
      assert.match(
        await editorText(),
        new RegExp(link.replace(/\[/g, '\\[')),
        'the in-progress link was altered',
      );
      assert.ok(
        (await suggesterEntries()).some((e) => e.includes('dirtylinktarget')),
        'the link suggester was closed by the write',
      );
      assert.equal(
        fmValue(await readNote(path), 'updated'),
        undefined,
        'the command must not have written while the buffer was dirty',
      );
    } finally {
      await releaseBufferDirty();
    }

    // Control: once the buffer is clean the deferred stamp must actually land -
    // otherwise "no write" above would just mean the feature is broken.
    await browser.keys('Escape');
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      {
        timeout: 15_000,
        interval: 250,
        timeoutMsg: 'the stamp never landed once the buffer was clean',
      },
    );
  });

  it('D4: the viewed stamp must not write while ANOTHER leaf of the same file is dirty', async function () {
    // Last-viewed stays OFF while the note is first opened: otherwise that very
    // opening stamps `viewed` on a clean buffer (correctly), and the assertion
    // below could not tell that stamp from one made during the dirty window.
    await setSettings({ ...BASE, enableAutoUpdate: true });
    const path = await createNote(
      'dirty-viewed',
      `---\ncreated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    await armWriteProbe();
    await armNoticeProbe();
    try {
      // Leaf A holds unsaved changes...
      await holdBufferDirty(path);
      await browser.pause(500);
      await setSettings({ enableLastViewed: true, headerLastViewed: 'viewed' });
      assert.ok(
        (await leafDirtyStates(path)).includes(true),
        'precondition: leaf A must hold unsaved changes',
      );
      // ...and the same file is opened in a second leaf, firing `file-open` ->
      // handleFileOpen. Any matching leaf being dirty must block that write.
      await openAndFocus(path, true);
      await browser.pause(2_000);

      await assertNeverWroteWhileDirty(path, 'D4');
      assert.equal(
        fmValue(await readNote(path), 'viewed'),
        undefined,
        'viewed must not have been written while another leaf was dirty',
      );
    } finally {
      await releaseBufferDirty();
    }

    // Control: the viewed path itself works - a clean note gets stamped on open.
    const clean = await createNote(
      'clean-viewed',
      `---\ncreated: ${STALE}\n---\n\nbody\n`,
    );
    await openAndFocus(clean);
    await browser.waitUntil(
      async () => fmValue(await readNote(clean), 'viewed') !== undefined,
      {
        timeout: 15_000,
        interval: 250,
        timeoutMsg: 'viewed was never stamped on a clean note (control failed)',
      },
    );
  });

  it('D5: a bulk run must skip a note with unsaved changes, not merge into it', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: false, dateFormat: ISO });
    const dirty = await createNote(
      'bulk-dirty',
      `---\ncreated: 2020-01-01T08:09:10\nkeep: me\n---\n\nbody\n`,
    );
    const clean = await createNote(
      'bulk-clean',
      `---\ncreated: 2020-01-01T08:09:10\nkeep: me\n---\n\nbody\n`,
    );
    await openAndFocus(dirty);
    await browser.pause(300);

    await armWriteProbe();
    await armNoticeProbe();
    try {
      // Freeze the dirty buffer: driving the settings tab and the modal takes
      // far longer than Obsidian's 2 s autosave, so without this the note would
      // be clean by the time Run executes and the scenario would prove nothing.
      await holdBufferDirty(dirty);
      await browser.pause(500);
      assert.ok(
        (await leafDirtyStates(dirty)).includes(true),
        'precondition: the target note must hold unsaved changes',
      );

      // Reformat rewrites existing values in place - the destructive bulk path
      // shared by four mutating modals via applyFrontmatterWrite.
      await setSettings({ dateFormat: 'yyyy-MM-dd' });
      await settingsTab.open();
      await settingsTab.openModal('frontmatter-date-manager-open-reformat');
      await bulkModal.select(
        'frontmatter-date-manager-reformat-scope',
        'created',
      );
      await bulkModal.clickPrimary(); // Scan & preview
      await bulkModal.waitForPreview();
      await bulkModal.clickPrimary(); // Run

      // Control: the clean note must be reformatted, proving the run really ran.
      await browser.waitUntil(
        async () => fmValue(await readNote(clean), 'created') === '2020-01-01',
        {
          timeout: 20_000,
          interval: 250,
          timeoutMsg: 'the clean note was never reformatted (control failed)',
        },
      );

      await assertNeverWroteWhileDirty(dirty, 'D5');
      assert.equal(
        fmValue(await readNote(dirty), 'created'),
        '2020-01-01T08:09:10',
        'the note with unsaved changes must be left untouched by the bulk run',
      );
    } finally {
      await releaseBufferDirty();
      await bulkModal.close();
      await closeSettings();
    }
  });

  it('D6: a rate-limited retry must not fire into a dirty buffer, and must not run the counter away', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: true,
      minSecondsBetweenSaves: 12,
      countUpdatesEnabled: true,
      headerUpdateCount: 'updated_count',
    });
    const path = await createNote(
      'dirty-retry',
      `---\ncreated: ${STALE}\nupdated: ${STALE}\nupdated_count: 0\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    // Seed `updated` 7 s in the past: old enough to clear the 5 s freshness
    // guard, recent enough that the 12 s rate limit defers the write and
    // schedules a retry - the path under test.
    await browser.executeObsidian(
      async ({ app, obsidian }, p, seconds) => {
        const internal = app as unknown as {
          plugins: {
            plugins: Record<
              string,
              { formatDate(d: Date): string | number | undefined }
            >;
          };
        };
        const plugin = internal.plugins.plugins['frontmatter-date-manager'];
        if (!plugin) throw new Error('plugin not loaded');
        const value = String(
          plugin.formatDate(new Date(Date.now() - seconds * 1000)),
        );
        const f = app.vault.getAbstractFileByPath(p);
        if (!(f instanceof obsidian.TFile)) throw new Error('note missing');
        await app.vault.modify(
          f,
          `---\ncreated: 2020-01-01T00:00:00\nupdated: ${value}\nupdated_count: 0\n---\n\n# Note\n\nedited body\n`,
        );
      },
      path,
      7,
    );

    await armWriteProbe();
    await armNoticeProbe();
    try {
      await holdBufferDirty(path);
      await browser.pause(500);
      assert.ok(
        (await leafDirtyStates(path)).includes(true),
        'precondition: the buffer must hold unsaved changes',
      );
      // Sit through the whole rate-limit window so the retry fires while dirty.
      await browser.pause(14_000);
      await assertNeverWroteWhileDirty(path, 'D6');
    } finally {
      await releaseBufferDirty();
    }

    // Once clean, the deferred edit must be applied - exactly one activity bump,
    // not one per deferred attempt. An exact count is asserted in unit tests;
    // here a bounded range catches a retry loop that increments repeatedly.
    await browser.pause(6_000);
    const count = Number(fmValue(await readNote(path), 'updated_count'));
    assert.ok(
      count >= 1 && count <= 2,
      `the edit counter must bump about once, got ${count}`,
    );
  });

  it('D7: the inversion notice must never claim a fix that was not written', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: true,
      inversionFixStrategy: 'max-all',
      inversionToleranceSec: 0,
    });
    // created AFTER updated: the inversion the fix strategy reacts to.
    const path = await createNote(
      'dirty-inversion',
      `---\ncreated: 2030-01-01T00:00:00\nupdated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    await armWriteProbe();
    await armNoticeProbe();
    try {
      await armDirtyAfterEditorSave(path);
      await browser.pause(4_000);

      await assertNeverWroteWhileDirty(path, 'D7');
      // showInversionNoticeOnce currently fires inside computeFrontmatterUpdates,
      // i.e. before any write - so a deferred pass announces a fix that never
      // happened. The notice must never outrun the write.
      const announced = (await collectedNotices()).filter((n) =>
        INVERSION_NOTICE.test(n),
      );
      const { total } = await writeSummary(path);
      assert.ok(
        announced.length === 0 || total > 0,
        'an inversion fix was announced although nothing was written',
      );
    } finally {
      await releaseBufferDirty();
    }
  });

  it('D8: a note open in reading mode has no buffer to protect and must still be stamped promptly', async function () {
    // Guards the opposite failure: a guard phrased as "the file is open in a
    // view" (rather than "a buffer has unsaved changes") would defer forever.
    await setSettings({ ...BASE, enableAutoUpdate: true });
    const path = await createNote(
      'reading-mode',
      `---\ncreated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openInReadingMode(path);
    await browser.pause(500);

    await armWriteProbe();
    await appendToNote(path, '\nexternal edit\n');

    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      {
        timeout: 15_000,
        interval: 250,
        timeoutMsg: 'a note in reading mode was never stamped',
      },
    );
    const { dirty } = await writeSummary(path);
    assert.equal(dirty.length, 0, 'reading mode reported a dirty buffer');
  });

  it('D9: a same-length re-stamp must not be silently reverted by the editor', async function () {
    // Auto-update OFF so the explicit command is the only writer and no second
    // automatic stamp can mask the revert.
    await closeSettings();
    await setSettings({ ...BASE, enableAutoUpdate: false });
    const path = await createNote(
      'same-size',
      `---\ncreated: ${STALE}\nupdated: ${STALE}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    const before = await statOf(path);
    await armModifyProbe(path);
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== STALE,
      {
        timeout: 15_000,
        interval: 250,
        timeoutMsg: 'the command never stamped `updated`',
      },
    );
    const stamped = fmValue(await readNote(path), 'updated') ?? '';
    const after = await statOf(path);
    const eventFired = await modifyProbeFired();
    const bufferAfterWrite = await editorText();

    // Precondition for the historic defect: a fixed-width dateFormat keeps the
    // byte size identical, which - back when the write also pinned mtime - meant
    // no vault event at all. Reported rather than trusted: the assertion that
    // matters is the last one.
    assert.equal(
      stamped.length,
      STALE.length,
      'precondition: the new value must be the same length as the old one',
    );

    await typeSlowly('z', 0);
    assert.match(
      await editorText(),
      /z/,
      'the keystroke never reached the editor - the scenario would prove nothing',
    );
    await browser.pause(3_500);

    const raw = await readNote(path);
    assert.match(
      getBody(raw),
      /z/,
      'the editor never saved - the scenario would prove nothing',
    );
    assert.equal(
      fmValue(raw, 'updated'),
      stamped,
      `the editor's next save reverted the stamp (size ${before.size}->${after.size}, mtime moved=${String(before.mtime !== after.mtime)}, modify fired=${String(eventFired)}, buffer had new value=${String(bufferAfterWrite.includes(stamped))})`,
    );
  });

  it('D10 (control): a size-changing re-stamp reaches the editor and survives its next save', async function () {
    // The other side of the mtime/size matrix: with a variable-width format the
    // re-stamp changes the file size, so Obsidian emits `modify` despite the
    // pinned mtime, the buffer is synchronized, and nothing is reverted. If this
    // fails too, the defect is broader than the size-neutral case.
    await closeSettings();
    await setSettings({
      ...BASE,
      enableAutoUpdate: false,
      dateFormat: 'M/d/yyyy H:mm',
    });
    const seeded = '12/31/2019 23:59';
    const path = await createNote(
      'diff-size',
      `---\ncreated: 1/1/2020 0:00\nupdated: ${seeded}\n---\n\n# Note\n\nline 1\n`,
    );
    await openAndFocus(path);
    await browser.pause(300);

    const before = await statOf(path);
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== seeded,
      {
        timeout: 15_000,
        interval: 250,
        timeoutMsg: 'the command never stamped `updated`',
      },
    );
    const stamped = fmValue(await readNote(path), 'updated') ?? '';
    const after = await statOf(path);
    assert.notEqual(
      after.size,
      before.size,
      `precondition: the value length must differ from ${seeded} (got ${stamped})`,
    );

    await typeSlowly('z', 0);
    assert.match(
      await editorText(),
      /z/,
      'the keystroke never reached the editor - the control would prove nothing',
    );
    await browser.pause(3_500);
    const raw = await readNote(path);
    assert.match(
      getBody(raw),
      /z/,
      'the editor never saved - the control would prove nothing',
    );
    assert.equal(
      fmValue(raw, 'updated'),
      stamped,
      'a size-changing stamp was reverted too - the defect is not size-specific',
    );
  });
});

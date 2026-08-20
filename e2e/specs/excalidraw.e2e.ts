/* global describe, it, before, after, afterEach -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { assert } from '../helpers/assert';
import { createNote, readNote } from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue, getBody } from '../helpers/frontmatter';
import {
  armNoticeProbe,
  armWriteProbe,
  collectedNotices,
  writeSummary,
} from '../helpers/editorProbe';
import {
  addRectToOpenDrawing,
  ageDrawing,
  closeAllDrawings,
  createDrawing,
  fdmHandleFileChange,
  fdmWriteBlock,
  forceSaveDrawing,
  isDrawingDirty,
  markDrawingDirty,
  openDrawing,
  panZoomDrawing,
  sceneElementCount,
  setExcalidrawAutosave,
  setExcalidrawEnabled,
} from '../helpers/excalidraw';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';

// Issue #15: Excalidraw drawings are ordinary Markdown notes carrying an
// `excalidraw-plugin` frontmatter marker. They used to be skipped by a
// hardcoded, undocumented rule; now they are tracked by default, with an
// opt-out toggle and a drawing-aware write guard.
//
// This spec drives the REAL obsidian-excalidraw-plugin (installed by
// wdio.conf.mts as an installed-but-disabled community plugin, pinned to
// 2.26.4; enabled here in `before`, disabled again in `after`). It is the only
// place the plugin's behaviour against Excalidraw's actual save/reload
// machinery can be observed - the unit `obsidian` mock has no such view.
//
// The invariant every write scenario asserts: FDM MUST NOT call
// processFrontMatter while an open Excalidraw view of the file is dirty or
// busy. When a drawing had no save for > 5 minutes, Excalidraw answers an
// external vault write with reload(true) + clearDirty(), discarding the user's
// unsaved strokes (FileManager.modifyEventHandler in Excalidraw 2.26.4).

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const COMMAND_ID = 'frontmatter-date-manager:update-timestamps-current-file';
const DRAWINGS = 'drawings';

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
  filterRules: '',
  trackExcalidraw: true,
  enableAutoUpdate: true,
};

let drawingCounter = 0;
function nextName(prefix: string): string {
  return `${prefix}-${drawingCounter++}`;
}

/** The drawing payload below the frontmatter: the `# Excalidraw Data` block
 * plus the compressed scene. Must survive every FDM write byte-identically. */
async function drawingBody(path: string): Promise<string> {
  return getBody(await readNote(path));
}

describe('excalidraw: drawings are tracked like notes, but never written to while dirty', function () {
  before(async function () {
    await setExcalidrawEnabled(true);
  });

  after(async function () {
    await closeAllDrawings();
    await setExcalidrawEnabled(false);
  });

  // A failing scenario must not cascade: leftover modals/settings would make
  // every later click land on a hidden element of the previous screen, and a
  // leaked `filterRules` / autosave-off would silently change what the next
  // scenario exercises. Restored here rather than inline, so a mid-scenario
  // failure cannot poison the rest of the file.
  afterEach(async function () {
    await setSettings({ filterRules: '', trackExcalidraw: true });
    try {
      await setExcalidrawAutosave(true);
    } catch {
      // The Excalidraw plugin is deliberately disabled inside X11; nothing to
      // restore in that case.
    }
    await browser.executeObsidian(({ app }) => {
      const modals = (app as unknown as { modals?: { close(): void }[] })
        .modals;
      modals?.forEach((m) => {
        m.close();
      });
      activeDocument.querySelectorAll('.modal-container').forEach((el) => {
        el.detach();
      });
      (app as unknown as { setting?: { close(): void } }).setting?.close();
    });
  });

  it('X1: a closed drawing gets created/updated from the manual command, body untouched', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: false });
    const path = await createDrawing(DRAWINGS, nextName('x1'));
    const bodyBefore = await drawingBody(path);

    await openDrawing(path);
    await browser.executeObsidianCommand(COMMAND_ID);

    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'created') !== undefined,
      { timeout: 15_000, interval: 250, timeoutMsg: 'created never written' },
    );
    const raw = await readNote(path);
    assert.ok(fmValue(raw, 'created'), 'created must be written');
    assert.ok(fmValue(raw, 'updated'), 'updated must be written');
    assert.equal(
      getBody(raw),
      bodyBefore,
      'the drawing payload must be byte-identical after the write',
    );
    // The drawing still loads: the scene survived the frontmatter rewrite.
    assert.ok(
      (await sceneElementCount(path)) >= 0,
      'the drawing must still be a loadable scene after the write',
    );
    await closeAllDrawings();
  });

  it('X2: with the toggle off the command explains the drawing is excluded and writes nothing', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: false,
      trackExcalidraw: false,
    });
    const path = await createDrawing(DRAWINGS, nextName('x2'));
    await openDrawing(path);
    await armWriteProbe();
    await armNoticeProbe();

    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.pause(1500);

    const raw = await readNote(path);
    assert.equal(fmValue(raw, 'created'), undefined, 'must not write created');
    assert.equal(fmValue(raw, 'updated'), undefined, 'must not write updated');
    assert.equal((await writeSummary(path)).total, 0, 'must not write at all');
    const notices = await collectedNotices();
    assert.ok(
      notices.some((n) => /Excalidraw drawings are excluded/.test(n)),
      `expected the Excalidraw notice, got: ${JSON.stringify(notices)}`,
    );
    await closeAllDrawings();
  });

  it('X3: an unchanged tracked drawing reports "no content change", not a false success', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: false });
    const path = await createDrawing(DRAWINGS, nextName('x3'));
    await openDrawing(path);
    // First run writes the dates and caches the content hash.
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      { timeout: 15_000, interval: 250, timeoutMsg: 'first pass never wrote' },
    );

    await armNoticeProbe();
    await armWriteProbe();
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.pause(1500);

    assert.equal(
      (await writeSummary(path)).total,
      0,
      'a second run on an unchanged drawing must not write',
    );
    // Two honest answers are possible here and both are correct: the hash gate
    // ("No content change detected") when the on-disk body is untouched, or the
    // freshness guard ("already up to date") when Excalidraw re-serialized the
    // file after our stamp. What must NEVER appear is a false success.
    const notices = await collectedNotices();
    assert.ok(
      notices.some(
        (n) =>
          /No content change detected/.test(n) || /already up to date/.test(n),
      ),
      `expected an honest no-write notice, got: ${JSON.stringify(notices)}`,
    );
    assert.equal(
      notices.filter((n) => /^Timestamps updated\.$/.test(n)).length,
      0,
      'a no-write run must never claim the timestamps were updated',
    );
    await closeAllDrawings();
  });

  it('X4: an Excalidraw save stamps updated, and the next save does not revert it', async function () {
    await setSettings(BASE);
    const path = await createDrawing(DRAWINGS, nextName('x4'));
    await openDrawing(path);
    await armNoticeProbe();

    await addRectToOpenDrawing(path);
    await forceSaveDrawing(path);

    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      {
        timeout: 20_000,
        interval: 250,
        timeoutMsg: 'updated never stamped after an Excalidraw save',
      },
    );
    const stamped = fmValue(await readNote(path), 'updated');
    assert.ok(stamped);
    assert.equal(
      await isDrawingDirty(path),
      false,
      'the view must be clean after forceSave',
    );

    // A further save with no changes must NOT drop the stamp: Obsidian core
    // refreshes the view's buffer on our write (TextFileView.onModify ->
    // loadFileInternal -> setData), so the header Excalidraw re-serializes is
    // the fresh one.
    await forceSaveDrawing(path);
    await browser.pause(1500);
    assert.ok(
      fmValue(await readNote(path), 'updated'),
      'a no-op Excalidraw save must not strip the stamp',
    );

    const notices = await collectedNotices();
    assert.equal(
      notices.filter((n) => /modified externally/.test(n)).length,
      0,
      'writing into a clean drawing must not trigger the merge notice',
    );
    await closeAllDrawings();
  });

  it('X5: panning the canvas does not stamp a date', async function () {
    await setSettings(BASE);
    const path = await createDrawing(DRAWINGS, nextName('x5'));
    await openDrawing(path);
    // Establish the baseline dates first, then pan only.
    await addRectToOpenDrawing(path);
    await forceSaveDrawing(path);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      { timeout: 20_000, interval: 250, timeoutMsg: 'baseline never stamped' },
    );
    const before = fmValue(await readNote(path), 'updated');

    await browser.pause(1200);
    await panZoomDrawing(path);
    await browser.pause(3000);

    assert.equal(
      fmValue(await readNote(path), 'updated'),
      before,
      'panning must not move the last-edited date',
    );
    await closeAllDrawings();
  });

  it('X6: a dirty drawing blocks the write; the stamp lands after Excalidraw saves', async function () {
    // Note the deliberate ordering: the drawing is dirtied BEFORE it ever gets
    // a hash-cache entry, so the pass reaches the write guard. (Once a file's
    // hash is cached and its on-disk body is unchanged, shouldFileBeIgnored
    // answers "unchanged" first and the guard is never consulted - correct, and
    // covered by X3.)
    await setSettings(BASE);
    const path = await createDrawing(DRAWINGS, nextName('x6'));
    await openDrawing(path);

    // Excalidraw's own autosave is switched off for the duration, and
    // setDirty() is re-armed right before each assertion: Excalidraw ALSO
    // force-saves on a window `blur`, which WebDriver interaction can trigger.
    await setExcalidrawAutosave(false);
    await addRectToOpenDrawing(path);
    await markDrawingDirty(path);
    assert.equal(await isDrawingDirty(path), true, 'setup: view must be dirty');

    // The gate every write path consults must report the drawing as blocking.
    assert.equal(
      await fdmWriteBlock(path),
      'excalidraw',
      'the write guard must block while the drawing has unsaved changes',
    );

    await armWriteProbe();
    await armNoticeProbe();
    await markDrawingDirty(path);
    // One full pass, exactly as a vault modify event would run it.
    const result = await fdmHandleFileChange(path);
    assert.equal(result.status, 'ok');
    assert.equal(result.wrote, false, 'the pass must not write');
    assert.equal(
      result.blocked,
      'excalidraw',
      'the pass must report the Excalidraw block, not a silent no-op',
    );

    // The manual command surfaces that to the user.
    await markDrawingDirty(path);
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.pause(1000);
    assert.equal(
      (await writeSummary(path)).total,
      0,
      'FDM must not write while the drawing has unsaved changes',
    );
    const notices = await collectedNotices();
    assert.ok(
      notices.some((n) => /drawing has unsaved changes/.test(n)),
      `expected the unsaved-changes notice, got: ${JSON.stringify(notices)}`,
    );

    // Excalidraw's own save resumes the pipeline (modify-driven, no polling).
    await setExcalidrawAutosave(true);
    await forceSaveDrawing(path);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'updated') !== undefined,
      {
        timeout: 20_000,
        interval: 250,
        timeoutMsg: 'the stamp never landed after the drawing was saved',
      },
    );
    await closeAllDrawings();
  });

  it('X7: an idle dirty drawing is blocked, and its unsaved strokes survive', async function () {
    // The core safety scenario: a drawing dirty for > 5 minutes is exactly the
    // case where an external write makes Excalidraw reload from disk and throw
    // the unsaved scene away (FileManager.modifyEventHandler -> reload(true) +
    // clearDirty). Asserted on the shared write gate rather than through the
    // bulk modal UI: any click outside the drawing blurs the window and
    // Excalidraw force-saves, cleaning the very state under test. The bulk
    // modal's skipped-table UI is covered for Markdown notes by
    // editor-dirty-merge.e2e.ts (D5); this scenario owns the Excalidraw half of
    // the same contract - `applyFrontmatterWrite` calls this exact gate.
    await setSettings({ ...BASE, enableAutoUpdate: false });
    const path = await createDrawing(DRAWINGS, nextName('x7'));
    await openDrawing(path);
    const beforeCount = await sceneElementCount(path);

    await setExcalidrawAutosave(false);
    await addRectToOpenDrawing(path);
    await markDrawingDirty(path);
    const dirtyCount = await sceneElementCount(path);
    assert.equal(
      dirtyCount,
      beforeCount + 1,
      'setup: the unsaved rectangle must be in the scene',
    );
    await ageDrawing(path, 6);
    assert.equal(await isDrawingDirty(path), true, 'setup: view must be dirty');

    await armWriteProbe();
    assert.equal(
      await fdmWriteBlock(path),
      'excalidraw',
      'bulk writes must be blocked for an idle dirty drawing',
    );
    const result = await fdmHandleFileChange(path);
    assert.equal(result.wrote, false, 'nothing may be written');
    assert.equal(result.blocked, 'excalidraw');

    assert.equal(
      (await writeSummary(path)).total,
      0,
      'no processFrontMatter call may happen for a dirty drawing',
    );
    assert.equal(
      await isDrawingDirty(path),
      true,
      'the drawing must still hold its unsaved changes',
    );
    assert.equal(
      await sceneElementCount(path),
      dirtyCount,
      'the unsaved rectangle must still be in the scene (no reload happened)',
    );
    await setExcalidrawAutosave(true);
    await closeAllDrawings();
  });

  it('X7b: control - the same bulk run writes once the drawing is saved', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: false,
      filterRules: `**\n!${DRAWINGS}/`,
    });
    const path = await createDrawing(DRAWINGS, nextName('x7b'));
    await openDrawing(path);
    await addRectToOpenDrawing(path);
    await forceSaveDrawing(path);
    const savedCount = await sceneElementCount(path);
    const bodyBefore = await drawingBody(path);

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-populate');
    await bulkModal.select('frontmatter-date-manager-populate-mode', 'both');
    await bulkModal.select(
      'frontmatter-date-manager-populate-override',
      'overwrite-all',
    );
    await bulkModal.clickPrimary();
    await bulkModal.waitForPreview();
    await bulkModal.clickPrimary();

    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'created') !== undefined,
      {
        timeout: 30_000,
        interval: 250,
        timeoutMsg: 'bulk never wrote into the clean drawing',
      },
    );
    await bulkModal.waitForDone();
    await bulkModal.close();
    await settingsTab.close();

    assert.equal(
      getBody(await readNote(path)),
      bodyBefore,
      'the drawing payload must be byte-identical after a bulk write',
    );
    assert.equal(
      await sceneElementCount(path),
      savedCount,
      'the saved scene must be intact after a bulk write',
    );
    await closeAllDrawings();
    await setSettings({ filterRules: '' });
  });

  it('X8: the last-opened date is never written to a drawing', async function () {
    await setSettings({
      ...BASE,
      enableLastViewed: true,
      headerLastViewed: 'viewed',
    });
    const drawing = await createDrawing(DRAWINGS, nextName('x8'));
    const note = await createNote(
      'x8-note',
      `---\ntitle: plain\n---\n\nbody\n`,
    );

    await openDrawing(drawing);
    await browser.pause(2000);
    assert.equal(
      fmValue(await readNote(drawing), 'viewed'),
      undefined,
      'a drawing must never get the last-opened date',
    );

    // Control: a plain note still gets it.
    await browser.executeObsidian(async ({ app, obsidian }, p) => {
      const f = app.vault.getAbstractFileByPath(p);
      if (f instanceof obsidian.TFile)
        await app.workspace.getLeaf(false).openFile(f);
    }, note);
    await browser.waitUntil(
      async () => fmValue(await readNote(note), 'viewed') !== undefined,
      {
        timeout: 15_000,
        interval: 250,
        timeoutMsg: 'a plain note must still get the last-opened date',
      },
    );
    await closeAllDrawings();
  });

  it('X9: rename key covers drawings even when the toggle is off', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: false });
    const path = await createDrawing(DRAWINGS, nextName('x9'));
    await openDrawing(path);
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'created') !== undefined,
      { timeout: 15_000, interval: 250, timeoutMsg: 'created never written' },
    );
    await closeAllDrawings();
    const bodyBefore = await drawingBody(path);

    // Rename/Reformat deliberately keep their "every Markdown note" contract.
    await setSettings({ trackExcalidraw: false });
    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-rename');
    await bulkModal.fillByClass(
      'frontmatter-date-manager-rename-old',
      'created',
    );
    await bulkModal.fillByClass('frontmatter-date-manager-rename-new', 'made');
    await bulkModal.clickPrimary(); // Scan & preview
    await bulkModal.waitForPreview();
    await bulkModal.clickPrimary(); // Run

    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'made') !== undefined,
      {
        timeout: 30_000,
        interval: 250,
        timeoutMsg: 'rename never touched the drawing',
      },
    );
    await bulkModal.waitForDone();
    await bulkModal.close();
    await settingsTab.close();
    assert.equal(
      getBody(await readNote(path)),
      bodyBefore,
      'rename must not disturb the drawing payload',
    );
  });

  it('X10: a filter rule still excludes a drawing while tracking is on', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: false,
      filterRules: `${DRAWINGS}/`,
    });
    const path = await createDrawing(DRAWINGS, nextName('x10'));
    await openDrawing(path);
    await armNoticeProbe();
    await armWriteProbe();

    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.pause(1500);

    assert.equal((await writeSummary(path)).total, 0, 'must not write');
    const notices = await collectedNotices();
    assert.ok(
      notices.some((n) => /Files and folders to skip/.test(n)),
      `expected the filter-rule notice, got: ${JSON.stringify(notices)}`,
    );
    await closeAllDrawings();
    await setSettings({ filterRules: '' });
  });

  it('X11: the drawing marker is honoured even with Excalidraw disabled', async function () {
    // Detection reads metadataCache, not the ExcalidrawAutomate global, so it
    // no longer depends on the other plugin being loaded.
    await setSettings({
      ...BASE,
      enableAutoUpdate: false,
      trackExcalidraw: false,
    });
    const marked = await createNote(
      'x11-marked',
      `---\nexcalidraw-plugin: parsed\n---\n\nbody\n`,
    );
    await closeAllDrawings();
    await setExcalidrawEnabled(false);

    await browser.executeObsidian(async ({ app, obsidian }, p) => {
      const f = app.vault.getAbstractFileByPath(p);
      if (f instanceof obsidian.TFile)
        await app.workspace.getLeaf(false).openFile(f);
    }, marked);
    await armNoticeProbe();
    await armWriteProbe();
    await browser.executeObsidianCommand(COMMAND_ID);
    await browser.pause(1500);

    assert.equal((await writeSummary(marked)).total, 0, 'must not write');
    const notices = await collectedNotices();
    assert.ok(
      notices.some((n) => /Excalidraw drawings are excluded/.test(n)),
      `expected the Excalidraw notice, got: ${JSON.stringify(notices)}`,
    );

    await setExcalidrawEnabled(true);
  });
});

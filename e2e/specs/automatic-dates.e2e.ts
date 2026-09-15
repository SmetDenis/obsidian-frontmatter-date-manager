/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { obsidianPage } from 'wdio-obsidian-service';
import { assert } from '../helpers/assert';
import {
  appendToNote,
  createNote,
  readNote,
  waitForKey,
} from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue, getBody } from '../helpers/frontmatter';
import { settingsTab } from '../pageobjects/settingsTab';
import { statusBar } from '../pageobjects/statusBar';

// Issue #24: the "Automatic dates" master switch (enableAutoUpdate) is enforced
// when queued work runs, the manual command can re-fill a missing date on
// unchanged content, a new note renamed inside the new-file window still gets
// stamped, and the off state is visible in settings and the status bar.

const PLUGIN_ID = 'frontmatter-date-manager';
const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const COMMAND_ID = 'frontmatter-date-manager:update-timestamps-current-file';
const BASE = {
  headerCreated: 'created',
  headerUpdated: 'updated',
  dateFormat: ISO,
  enableNumberProperties: false,
  enableModifiedTime: true,
  enableCreateTime: true,
  enableLastViewed: false,
  minSecondsBetweenSaves: 5,
  statusBarMode: 'when-inactive',
};

async function refreshStatusBar(): Promise<void> {
  await browser.executeObsidian(({ app }, id) => {
    const internal = app as unknown as {
      plugins: { plugins: Record<string, { updateStatusBar?: () => void }> };
    };
    internal.plugins.plugins[id]?.updateStatusBar?.();
  }, PLUGIN_ID);
}

async function automaticDatesSetting(): Promise<unknown> {
  return browser.executeObsidian(({ app }, id) => {
    const internal = app as unknown as {
      plugins: {
        plugins: Record<string, { settings?: Record<string, unknown> }>;
      };
    };
    return internal.plugins.plugins[id]?.settings?.enableAutoUpdate;
  }, PLUGIN_ID);
}

describe('automatic dates master switch (issue #24)', function () {
  it('AD1: switching automatic dates off inside the 2 s debounce stops the pending stamp', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: true, delayForNewFiles: 0 });
    const path = await createNote('ad1', `# Note\n\noriginal body\n`);
    await browser.pause(500);

    await appendToNote(path, '\nedit\n');
    // The debounce timer is now armed; switch off before it fires.
    await browser.pause(500);
    await setSettings({ enableAutoUpdate: false });
    await browser.pause(3_500);

    const raw = await readNote(path);
    assert.equal(fmValue(raw, 'updated'), undefined, 'no updated after off');
    assert.equal(fmValue(raw, 'created'), undefined, 'no created after off');
    assert.match(getBody(raw), /edit/);
  });

  it('AD2: the manual command re-adds a deleted created on unchanged content, keeping updated', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: false,
      enableContentHashCheck: true,
      hashTrackingMode: 'body',
      delayForNewFiles: 0,
    });
    const path = await createNote('ad2', `# Note\n\nbody stays the same\n`);
    await obsidianPage.openFile(path);

    // First run stamps both dates and records the content hash.
    await browser.executeObsidianCommand(COMMAND_ID);
    await waitForKey(path, 'created');
    await waitForKey(path, 'updated');
    const updatedBefore = fmValue(await readNote(path), 'updated');

    // Remove `created` by hand (a frontmatter-only change: the body hash is
    // untouched, which is exactly what used to make the command give up).
    await browser.executeObsidian(async ({ app, obsidian }, p) => {
      const f = app.vault.getAbstractFileByPath(p);
      if (f instanceof obsidian.TFile) {
        await app.fileManager.processFrontMatter(
          f,
          (fm: Record<string, unknown>) => {
            delete fm.created;
          },
        );
      }
    }, path);
    await browser.waitUntil(
      async () => fmValue(await readNote(path), 'created') === undefined,
      { timeout: 5_000, timeoutMsg: 'precondition: created was not removed' },
    );
    await browser.pause(1_000);

    await browser.executeObsidianCommand(COMMAND_ID);
    await waitForKey(path, 'created');

    const after = await readNote(path);
    assert.equal(
      fmValue(after, 'updated'),
      updatedBefore,
      'updated must be kept: the content did not change',
    );
    assert.match(getBody(after), /body stays the same/);
  });

  it('AD3: a new note renamed inside the new-file window is still stamped under its new name', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: true,
      delayForNewFiles: 4_000,
    });
    const path = await createNote('ad3', `# Untitled\n`);
    // A template-like edit inside the window, then the user types a title.
    await appendToNote(path, '\ntemplate content\n');
    await browser.pause(500);
    const newPath = `ad3-renamed-${Date.now()}.md`;
    await browser.executeObsidian(
      async ({ app, obsidian }, p, np) => {
        const f = app.vault.getAbstractFileByPath(p);
        if (f instanceof obsidian.TFile)
          await app.fileManager.renameFile(f, np);
      },
      path,
      newPath,
    );

    await waitForKey(newPath, 'created');
    const raw = await readNote(newPath);
    assert.match(fmValue(raw, 'updated') ?? '', /^\d{4}-\d{2}-\d{2}T/);
    assert.match(getBody(raw), /template content/);
  });

  it('AD4: settings show the "automatic dates are off" hint only while the switch is off', async function () {
    await setSettings({ ...BASE, enableAutoUpdate: false });
    await settingsTab.open();
    try {
      await browser.waitUntil(
        async () => settingsTab.automaticDatesOffHintShown(),
        { timeout: 5_000, timeoutMsg: 'hint not shown while off' },
      );

      await setSettings({ enableAutoUpdate: true });
      await browser.waitUntil(
        async () => !(await settingsTab.automaticDatesOffHintShown()),
        { timeout: 5_000, timeoutMsg: 'hint still shown after switching on' },
      );
    } finally {
      await settingsTab.close();
    }
  });

  it('AD5: the status bar indicator toggles the switch and follows its visibility mode', async function () {
    await setSettings({
      ...BASE,
      enableAutoUpdate: true,
      statusBarMode: 'always',
    });
    await refreshStatusBar();
    assert.equal(await statusBar.text(), 'FDM: on');

    await statusBar.click();
    await browser.waitUntil(
      async () => (await statusBar.text()) === 'FDM: off',
      {
        timeout: 5_000,
        timeoutMsg: 'indicator did not switch to off',
      },
    );
    assert.equal(await automaticDatesSetting(), false);

    await statusBar.click();
    await browser.waitUntil(
      async () => (await statusBar.text()) === 'FDM: on',
      {
        timeout: 5_000,
        timeoutMsg: 'indicator did not switch back on',
      },
    );

    // Default mode: nothing shown while automatic dates are on.
    await setSettings({ statusBarMode: 'when-inactive' });
    await refreshStatusBar();
    assert.equal(await statusBar.isShown(), false);
  });
});

/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { obsidianPage } from 'wdio-obsidian-service';
import { assert } from '../helpers/assert';
import { createNote, readNote, appendToNote } from '../helpers/vault';
import { readSetting, setSettings } from '../helpers/settings';
import { settingsTab } from '../pageobjects/settingsTab';
import {
  fmPathValue,
  fmValue,
  getBody,
  getFrontmatterBlock,
} from '../helpers/frontmatter';

// Nested property paths (`meta > updated`) through the real processFrontMatter
// serializer: groups are created and appended to without disturbing other keys
// or their order, a counter in a group stays a number, a parent that is not a
// group is left alone, and the plugin's own nested write never counts as an
// edit in "frontmatter" tracking mode.

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const STALE = '2020-01-01T00:00:00';

const BASE = {
  enableAutoUpdate: true,
  enableCreateTime: true,
  enableModifiedTime: true,
  headerCreated: 'created',
  headerUpdated: 'meta > updated',
  dateFormat: ISO,
  timezone: '',
  enableNumberProperties: false,
  enableContentHashCheck: true,
  hashTrackingMode: 'body',
  minSecondsBetweenSaves: 0,
  delayForNewFiles: 0,
  enableLastViewed: false,
  countUpdatesEnabled: false,
};

async function waitForPath(
  path: string,
  segments: string[],
  predicate: (value: string | undefined) => boolean = (v) => v !== undefined,
): Promise<void> {
  await browser.waitUntil(
    async () => predicate(fmPathValue(await readNote(path), segments)),
    {
      timeout: 15_000,
      interval: 250,
      timeoutMsg: `${segments.join(' > ')} never settled in ${path}`,
    },
  );
}

async function mtimeOf(path: string): Promise<number> {
  return browser.executeObsidian(({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    return f instanceof obsidian.TFile ? f.stat.mtime : -1;
  }, path);
}

/** Rewrite one line of a note, as another plugin or a sync would. */
async function replaceInNote(
  path: string,
  from: string,
  to: string,
): Promise<void> {
  await browser.executeObsidian(
    async ({ app, obsidian }, p, a, b) => {
      const f = app.vault.getAbstractFileByPath(p);
      if (f instanceof obsidian.TFile) {
        await app.vault.process(f, (text) => text.replace(a, b));
      }
    },
    path,
    from,
    to,
  );
}

describe('nested property paths on real Obsidian', function () {
  it('N1: dates land in nested groups; other keys, their order and the body survive', async function () {
    await setSettings({
      ...BASE,
      enableLastViewed: true,
      headerLastViewed: 'parent > meta > viewed',
    });
    const path = await createNote(
      'nested-n1',
      `---\ncreated: ${STALE}\nmeta:\n  source: web\n  tags:\n    - a\nstatus: draft\n---\n\n# Heading\n\nBody must survive.\n`,
    );

    await appendToNote(path, '\nedit one\n');
    await waitForPath(path, ['meta', 'updated']);
    const after = await readNote(path);
    assert.match(
      fmPathValue(after, ['meta', 'updated'])!,
      /^\d{4}-\d{2}-\d{2}T/,
    );
    assert.equal(fmPathValue(after, ['meta', 'source']), 'web');
    assert.equal(fmValue(after, 'created'), STALE);
    assert.equal(fmValue(after, 'status'), 'draft');
    // Key order: created first, the group keeps its keys and gets the new one
    // last, and nothing new appears at the top level.
    assert.match(
      getFrontmatterBlock(after),
      /^created: .*\nmeta:\n {2}source: web\n {2}tags:\n {4}- a\n {2}updated: .*\nstatus: draft$/,
    );
    const body = getBody(after);
    assert.match(body, /# Heading/);
    assert.match(body, /Body must survive\./);
    assert.match(body, /edit one/);

    // Let the plugin's passes on this note settle - the write above and the
    // debounced pass that write triggers - before opening it: an open that
    // overlaps a pass on the same note drops the viewed stamp by design.
    await browser.pause(3_000);
    await obsidianPage.openFile(path);
    await waitForPath(path, ['parent', 'meta', 'viewed']);
    const opened = await readNote(path);
    assert.match(
      fmPathValue(opened, ['parent', 'meta', 'viewed'])!,
      /^\d{4}-\d{2}-\d{2}T/,
    );
    assert.match(
      getFrontmatterBlock(opened),
      /\nparent:\n {2}meta:\n {4}viewed: /,
    );
    assert.match(getBody(opened), /Body must survive\./);
  });

  it('N2: a counter in a nested group is written as a plain number', async function () {
    await setSettings({
      ...BASE,
      countUpdatesEnabled: true,
      headerUpdateCount: 'meta > edits',
    });
    const path = await createNote(
      'nested-n2',
      `---\ncreated: ${STALE}\nmeta:\n  edits: 4\n---\n\nbody\n`,
    );

    await appendToNote(path, '\nedit\n');
    await waitForPath(path, ['meta', 'edits'], (v) => v === '5');
    const after = await readNote(path);
    assert.equal(fmPathValue(after, ['meta', 'edits']), '5');
    assert.doesNotMatch(fmPathValue(after, ['meta', 'edits'])!, /"/);
    assert.match(fmPathValue(after, ['meta', 'updated'])!, /^\d{4}-/);
  });

  it('N3: a parent that is not a group is never touched; other dates are still written', async function () {
    await setSettings(BASE);
    const untouched = await createNote(
      'nested-n3a',
      `---\ncreated: ${STALE}\nmeta: черновик\n---\n\nbody\n`,
    );
    const partial = await createNote(
      'nested-n3b',
      `---\nmeta: черновик\n---\n\nbody\n`,
    );

    await appendToNote(untouched, '\nedit\n');
    await appendToNote(partial, '\nedit\n');
    await browser.waitUntil(
      async () => fmValue(await readNote(partial), 'created') !== undefined,
      { timeout: 15_000, interval: 250, timeoutMsg: 'created never written' },
    );
    // Give any (incorrect) write to the other note the same time to land.
    await browser.pause(3_000);

    assert.equal(
      await readNote(untouched),
      `---\ncreated: ${STALE}\nmeta: черновик\n---\n\nbody\n\nedit\n`,
    );
    const written = await readNote(partial);
    assert.equal(fmValue(written, 'meta'), 'черновик');
    assert.match(fmValue(written, 'created')!, /^\d{4}-/);
  });

  it('N4: in "frontmatter" tracking mode the plugin\'s nested key never counts as an edit, its neighbours do', async function () {
    await setSettings({ ...BASE, hashTrackingMode: 'frontmatter' });
    const path = await createNote(
      'nested-n4',
      `---\ncreated: ${STALE}\ntitle: one\nmeta:\n  source: web\n---\n\nbody\n`,
    );

    // A real frontmatter edit stamps the nested date.
    await replaceInNote(path, 'title: one', 'title: two');
    await waitForPath(path, ['meta', 'updated']);

    // Only the plugin's own nested key changes (another device's plugin, a
    // sync): with the key excluded from the hash this is not an edit, so the
    // stale value stays. A re-stamp here would be the ping-pong the exclusion
    // exists to prevent.
    const stamped = fmPathValue(await readNote(path), ['meta', 'updated'])!;
    await replaceInNote(path, `  updated: ${stamped}`, `  updated: ${STALE}`);
    const mtime = await mtimeOf(path);
    await browser.pause(4_000);
    assert.equal(fmPathValue(await readNote(path), ['meta', 'updated']), STALE);
    assert.equal(await mtimeOf(path), mtime);

    // Control: another key of the same group IS an edit.
    await replaceInNote(path, '  source: web', '  source: print');
    await waitForPath(path, ['meta', 'updated'], (v) => v !== STALE);
    assert.equal(
      fmPathValue(await readNote(path), ['meta', 'source']),
      'print',
    );
  });

  it('N5: an empty parent becomes a group in place', async function () {
    await setSettings(BASE);
    const path = await createNote(
      'nested-n5',
      `---\ncreated: ${STALE}\nmeta:\nstatus: draft\n---\n\nbody\n`,
    );

    await appendToNote(path, '\nedit\n');
    await waitForPath(path, ['meta', 'updated']);
    assert.match(
      getFrontmatterBlock(await readNote(path)),
      /^created: .*\nmeta:\n {2}updated: .*\nstatus: draft$/,
    );
  });

  it('N7: a group shared through a YAML reference is never written into', async function () {
    await setSettings(BASE);
    // `meta` is an alias of `base`: Obsidian parses both into ONE object, so a
    // date written into `meta` would also appear under `base`.
    const content = `---\ncreated: ${STALE}\nbase: &shared\n  source: web\nmeta: *shared\n---\n\nbody\n`;
    const path = await createNote('nested-n7', content);
    const control = await createNote(
      'nested-n7-control',
      `---\ncreated: ${STALE}\n---\n\nbody\n`,
    );

    await appendToNote(path, '\nedit\n');
    await appendToNote(control, '\nedit\n');
    // The control note proves the pass ran; the aliased note must be untouched.
    await waitForPath(control, ['meta', 'updated']);
    await browser.pause(3_000);
    assert.equal(await readNote(path), `${content}\nedit\n`);
  });

  it('N6: the settings form explains a dot while typing and refuses an invalid path', async function () {
    await setSettings({
      ...BASE,
      headerUpdated: 'updated',
      hashTrackingMode: 'frontmatter',
      frontmatterHashExcludeKeys: [],
    });
    await settingsTab.open();
    try {
      // A dot keeps the name flat; the hint appears without reopening the tab.
      await settingsTab.typeInto('Updated property', 'meta.updated');
      await browser.waitUntil(() => settingsTab.dotHintShown(), {
        timeout: 5_000,
        timeoutMsg: 'dot hint never appeared',
      });
      assert.equal(await readSetting('headerUpdated'), 'meta.updated');

      await settingsTab.typeInto('Updated property', 'meta > updated');
      await browser.waitUntil(async () => !(await settingsTab.dotHintShown()), {
        timeout: 5_000,
        timeoutMsg: 'dot hint never went away',
      });
      assert.equal(await readSetting('headerUpdated'), 'meta > updated');

      // An empty level is refused: never stored, the error shows in the row.
      await settingsTab.typeInto('Updated property', 'meta >');
      await browser.waitUntil(
        async () =>
          (await settingsTab.rowText('Updated property')).includes(
            "Each part around '>' needs a name",
          ),
        { timeout: 5_000, timeoutMsg: 'invalid-path error never shown' },
      );
      assert.notEqual(await readSetting('headerUpdated'), 'meta >');

      // The exclude input understands the same syntax and refuses the same.
      await settingsTab.addExcludeProperty('meta >');
      await browser.waitUntil(() => settingsTab.excludeErrorShown(), {
        timeout: 5_000,
        timeoutMsg: 'exclude-input error never shown',
      });
      assert.deepEqual(await readSetting('frontmatterHashExcludeKeys'), []);
    } finally {
      await settingsTab.close();
      await setSettings({ ...BASE, hashTrackingMode: 'body' });
    }
  });
});

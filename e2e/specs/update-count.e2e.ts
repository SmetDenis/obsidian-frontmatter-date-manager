/* global describe, it -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { assert } from '../helpers/assert';
import {
  createNote,
  readNote,
  appendToNote,
  waitForKey,
} from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { getBody, fmValue, getFrontmatterBlock } from '../helpers/frontmatter';

const ISO = "yyyy-MM-dd'T'HH:mm:ss";

const BASE = {
  enableAutoUpdate: true,
  headerCreated: 'created',
  headerUpdated: 'updated',
  dateFormat: ISO,
  timezone: '',
  enableNumberProperties: false,
  enableContentHashCheck: true,
  minSecondsBetweenSaves: 0,
  countUpdatesEnabled: true,
  headerUpdateCount: 'updated_count',
};

/** Wait until a frontmatter key holds an exact (trimmed) value on disk. */
async function waitForValue(
  path: string,
  key: string,
  value: string,
): Promise<void> {
  await browser.waitUntil(
    async () => fmValue(await readNote(path), key) === value,
    {
      timeout: 15_000,
      interval: 250,
      timeoutMsg: `key "${key}" never reached "${value}" in ${path}`,
    },
  );
}

describe('edit-activity counter (updated_count) on a real modify event', function () {
  it('UC1: first counted edit writes updated_count: 1 as a native number, body + created survive', async function () {
    await setSettings(BASE);
    const path = await createNote(
      'uc1',
      `---\ncreated: 2020-01-01T00:00:00\nstatus: draft\n---\n\n# Heading\n\nBody must survive.\n`,
    );
    assert.equal(fmValue(await readNote(path), 'updated_count'), undefined);

    await appendToNote(path, '\nedit one\n');
    await waitForKey(path, 'updated_count');

    const after = await readNote(path);
    // Native unquoted number 1 (not the string "1").
    assert.equal(fmValue(after, 'updated_count'), '1');
    // Co-located with the bumped last-edited date, in the same frontmatter block.
    assert.match(fmValue(after, 'updated')!, /^\d{4}-\d{2}-\d{2}T/);
    // created + unrelated key + body survive untouched.
    assert.equal(fmValue(after, 'created'), '2020-01-01T00:00:00');
    assert.match(getFrontmatterBlock(after), /status: draft/);
    const body = getBody(after);
    assert.match(body, /# Heading/);
    assert.match(body, /Body must survive\./);
    assert.match(body, /edit one/);
  });

  it('UC2: an existing count increments by exactly one', async function () {
    await setSettings(BASE);
    const path = await createNote(
      'uc2',
      `---\ncreated: 2020-01-01T00:00:00\nupdated: 2020-01-02T00:00:00\nupdated_count: 4\n---\n\nbody\n`,
    );

    await appendToNote(path, '\nedit\n');
    await waitForValue(path, 'updated_count', '5');

    const after = await readNote(path);
    assert.equal(fmValue(after, 'updated_count'), '5');
    assert.match(fmValue(after, 'updated')!, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('UC3 (R11): the base is read from disk, so an external value increments (45 -> 46) as a number', async function () {
    await setSettings(BASE);
    const path = await createNote(
      'uc3',
      `---\ncreated: 2020-01-01T00:00:00\nupdated_count: 45\n---\n\nbody\n`,
    );

    await appendToNote(path, '\nedit\n');
    await waitForValue(path, 'updated_count', '46');

    const after = await readNote(path);
    // A native unquoted number, not the string "46".
    assert.equal(fmValue(after, 'updated_count'), '46');
    assert.doesNotMatch(fmValue(after, 'updated_count')!, /"/);
  });

  it('UC4: with the counter OFF, an edit never writes updated_count', async function () {
    await setSettings({ ...BASE, countUpdatesEnabled: false });
    const path = await createNote(
      'uc4',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\nbody\n`,
    );

    await appendToNote(path, '\nedit\n');
    await waitForKey(path, 'updated');

    // Give any (incorrect) counter write a chance to land, then assert absence.
    await browser.pause(3_000);
    assert.equal(fmValue(await readNote(path), 'updated_count'), undefined);
  });
});

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

const RICH = `---
created: 2020-01-01T00:00:00
aliases:
  - first
status: draft
---

# Heading

Body paragraph that must survive untouched.
`;

describe('auto-stamp on a real modify event', function () {
  it('A1: adds updated, keeps created, leaves body and other keys intact', async function () {
    await setSettings({
      enableAutoUpdate: true,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      timezone: '',
      enableNumberProperties: false,
      enableContentHashCheck: true,
    });

    const path = await createNote('a1', RICH);
    assert.equal(fmValue(await readNote(path), 'updated'), undefined);

    await appendToNote(path, '\nedited by test\n');
    await waitForKey(path, 'updated');

    const after = await readNote(path);
    // created is byte-for-byte preserved
    assert.equal(fmValue(after, 'created'), '2020-01-01T00:00:00');
    // updated added in the configured ISO shape
    assert.match(
      fmValue(after, 'updated')!,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    // unrelated scalar key + aliases survive
    const block = getFrontmatterBlock(after);
    assert.match(block, /status: draft/);
    assert.match(block, /aliases:/);
    // body survives untouched (processFrontMatter must not touch it)
    const body = getBody(after);
    assert.match(body, /# Heading/);
    assert.match(body, /Body paragraph that must survive untouched\./);
    assert.match(body, /edited by test/);
  });

  it('A2: writes a number unquoted and a string in the configured format', async function () {
    // Number mode: epoch-seconds format `t` must serialize as an unquoted number.
    await setSettings({
      enableAutoUpdate: true,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: 't',
      enableNumberProperties: true,
    });
    const numPath = await createNote(
      'a2num',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\nbody\n`,
    );
    await appendToNote(numPath, '\nedit\n');
    await waitForKey(numPath, 'updated');
    const numUpdated = fmValue(await readNote(numPath), 'updated')!;
    // unquoted integer, e.g. `updated: 1712930400`
    assert.match(
      numUpdated,
      /^\d+$/,
      `expected unquoted number, got: ${numUpdated}`,
    );

    // String mode: ISO format stays a (date-like) string, not a bare integer.
    await setSettings({ dateFormat: ISO, enableNumberProperties: false });
    const strPath = await createNote(
      'a2str',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\nbody\n`,
    );
    await appendToNote(strPath, '\nedit\n');
    await waitForKey(strPath, 'updated');
    const strUpdated = fmValue(await readNote(strPath), 'updated')!;
    assert.match(
      strUpdated,
      /\d{4}-\d{2}-\d{2}T/,
      `expected ISO string, got: ${strUpdated}`,
    );
    assert.doesNotMatch(
      strUpdated,
      /^\d+$/,
      'ISO value must not be a bare integer',
    );
  });

  it('A3: does not re-stamp updated after its own write (self-trigger suppressed)', async function () {
    await setSettings({
      enableAutoUpdate: true,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      enableNumberProperties: false,
      minSecondsBetweenSaves: 0,
    });
    const path = await createNote(
      'a3',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\nbody\n`,
    );
    await appendToNote(path, '\nedit\n');
    await waitForKey(path, 'updated');
    const first = fmValue(await readNote(path), 'updated')!;

    // Wait past the 2s modify-debounce: the plugin's own write must NOT loop
    // into a second stamp (lastPluginWriteMtime guards this).
    await browser.pause(4_000);
    const second = fmValue(await readNote(path), 'updated')!;
    assert.equal(
      second,
      first,
      'updated must not be re-stamped by the self-write',
    );
  });
});

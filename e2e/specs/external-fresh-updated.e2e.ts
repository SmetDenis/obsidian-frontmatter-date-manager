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
import { getBody, fmValue } from '../helpers/frontmatter';

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const PLUGIN_ID = 'frontmatter-date-manager';

// Shared config: fine ISO format, host timezone, no throttle and no new-file
// delay so timing is deterministic, content-hash on so a body change is a real
// change. minSecondsBetweenSaves: 0 is deliberate - it proves the FRESHNESS
// guard (not rate limiting) is what suppresses the re-stamp.
const SETTINGS = {
  enableAutoUpdate: true,
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
};

// Rewrite the whole note (changed body + a chosen `updated`) through the real
// vault API, exactly as an external editor/script would - `app.vault.modify`
// fires a reliable `modify` event. Computes the fresh `updated` with the running
// plugin's own `formatDate`, so the on-disk value is byte-for-byte what FDM would
// otherwise write. Returns that value plus the post-write mtime (M2 baseline).
async function externalWrite(
  path: string,
  body: string,
  freshUpdated: boolean,
): Promise<{ updated: string; mtime: number }> {
  return browser.executeObsidian(
    async ({ app, obsidian }, p, id, b, useFresh) => {
      const internal = app as unknown as {
        plugins: {
          plugins: Record<
            string,
            { formatDate(d: Date): string | number | undefined }
          >;
        };
      };
      const plugin = internal.plugins.plugins[id];
      if (!plugin) throw new Error(`plugin ${id} not loaded`);
      // When useFresh, stamp a correctly-formatted current `updated`; otherwise
      // keep a clearly-stale value so FDM must re-stamp (the control).
      const updated = useFresh
        ? String(plugin.formatDate(new Date()))
        : '2020-01-01T00:00:00';
      const content = `---\ncreated: 2020-01-01T00:00:00\nupdated: ${updated}\n---\n\n# Heading\n\n${b}\n`;
      const f = app.vault.getAbstractFileByPath(p);
      if (!(f instanceof obsidian.TFile)) throw new Error(`note missing: ${p}`);
      await app.vault.modify(f, content);
      return { updated, mtime: f.stat.mtime };
    },
    path,
    PLUGIN_ID,
    body,
    freshUpdated,
  );
}

/** Register a one-shot `modify` listener so a spec can prove the event actually
 * reached the vault's listeners (FDM subscribes to the same event) - guards
 * against a false green where "no write" merely meant "no modify fired" (H3). */
async function armModifyProbe(path: string): Promise<void> {
  await browser.executeObsidian((_ctx, p) => {
    const g = window as unknown as { __fdmModifyFired?: boolean };
    g.__fdmModifyFired = false;
    _ctx.app.vault.on('modify', (f) => {
      if (f.path === p) g.__fdmModifyFired = true;
    });
  }, path);
}

async function modifyProbeFired(): Promise<boolean> {
  return browser.executeObsidian(() => {
    const g = window as unknown as { __fdmModifyFired?: boolean };
    return g.__fdmModifyFired === true;
  });
}

async function currentMtime(path: string): Promise<number> {
  return browser.executeObsidian(({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    return f instanceof obsidian.TFile ? f.stat.mtime : -1;
  }, path);
}

/** Whether FDM currently records a self-write for this path (its
 * `lastPluginWriteMtime` map). An external `vault.modify` must NOT populate it -
 * otherwise the self-write guard, not the freshness guard under test, would
 * explain a missing re-stamp (H3 false green). */
async function pluginTracksSelfWrite(path: string): Promise<boolean> {
  return browser.executeObsidian(
    ({ app }, p, id) => {
      const internal = app as unknown as {
        plugins: {
          plugins: Record<
            string,
            { lastPluginWriteMtime?: { has(k: string): boolean } }
          >;
        };
      };
      return (
        internal.plugins.plugins[id]?.lastPluginWriteMtime?.has(p) === true
      );
    },
    path,
    PLUGIN_ID,
  );
}

describe('external edit with a fresh updated is not re-stamped', function () {
  it('F1: an external write carrying a fresh, correctly-formatted updated is preserved (no redundant re-stamp)', async function () {
    await setSettings(SETTINGS);

    // Seed a note and let FDM stamp it once, which also warms the hash cache so
    // the later external body change is detected as a REAL change (forcing FDM
    // into computeFrontmatterUpdates, where the freshness guard lives - not an
    // early "ignored" bail that would be a false green).
    const path = await createNote(
      'ext-fresh',
      `---\ncreated: 2020-01-01T00:00:00\n---\n\n# Heading\n\noriginal body\n`,
    );
    await appendToNote(path, '\nfirst edit\n');
    await waitForKey(path, 'updated');
    // Let FDM's own write settle (self-trigger must not loop into a re-stamp).
    await browser.pause(4_000);

    // Arm the probe, then simulate the external edit: changed body + a fresh
    // `updated` FDM would consider already current.
    await armModifyProbe(path);
    const wrote = await externalWrite(path, 'externally edited body', true);

    // H3 precondition: the external edit went through vault.modify (not FDM), so
    // FDM must NOT have recorded it as a self-write. Probed now, before the modify
    // debounce elapses - if it were tracked, the self-write guard (not the
    // freshness guard under test) would explain the missing re-stamp (false green).
    assert.ok(
      !(await pluginTracksSelfWrite(path)),
      'external write must not be recorded in lastPluginWriteMtime (H3)',
    );

    // Wait well past the 2s modify-debounce (+ margin) so FDM has fully
    // processed the external modify.
    await browser.pause(6_000);

    // H3: the modify event really fired, so FDM had the chance to re-stamp.
    assert.ok(
      await modifyProbeFired(),
      'the modify event must have fired for the external write (else the test proves nothing)',
    );

    const after = await readNote(path);
    // The fresh `updated` is preserved byte-for-byte - NOT re-stamped.
    assert.equal(
      fmValue(after, 'updated'),
      wrote.updated,
      'updated must be preserved exactly, not re-stamped',
    );
    // created and body survive the (non-)write.
    assert.equal(fmValue(after, 'created'), '2020-01-01T00:00:00');
    assert.match(getBody(after), /externally edited body/);
    // M2: FDM did not rewrite the file - mtime is unchanged since the external
    // write. createNote uses vault.create (it opens no editor leaf), so
    // editorSafeWriteOptions returns undefined and a real re-stamp WOULD move
    // mtime - which makes this a guaranteed true-negative, not a pinned-mtime
    // false green.
    assert.equal(
      await currentMtime(path),
      wrote.mtime,
      'FDM must not have re-written the note (mtime unchanged)',
    );
  });

  it('F2 (control): an external body-only edit with a stale updated is re-stamped exactly once', async function () {
    await setSettings(SETTINGS);

    const path = await createNote(
      'ext-stale',
      `---\ncreated: 2020-01-01T00:00:00\nupdated: 2020-01-01T00:00:00\n---\n\n# Heading\n\noriginal body\n`,
    );
    // No auto-stamp on create (delayForNewFiles: 0); brief settle before editing.
    await browser.pause(500);

    // External write: change the body but leave the stale `updated` in place.
    await externalWrite(path, 'externally edited body', false);

    // FDM must advance the stale `updated` to a current value.
    await browser.waitUntil(
      async () =>
        fmValue(await readNote(path), 'updated') !== '2020-01-01T00:00:00',
      {
        timeout: 15_000,
        interval: 250,
        timeoutMsg: 'stale updated was never re-stamped',
      },
    );
    const afterFirst = fmValue(await readNote(path), 'updated')!;
    assert.match(afterFirst, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Exactly once: FDM's own write must not loop into a second stamp.
    await browser.pause(4_000);
    const afterSettle = fmValue(await readNote(path), 'updated')!;
    assert.equal(
      afterSettle,
      afterFirst,
      'updated must advance exactly once, not re-stamp in a loop',
    );
    // created and the new body survive.
    assert.equal(
      fmValue(await readNote(path), 'created'),
      '2020-01-01T00:00:00',
    );
    assert.match(getBody(await readNote(path)), /externally edited body/);
  });
});

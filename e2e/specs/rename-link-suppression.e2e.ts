/* global describe, it, beforeEach -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser } from '@wdio/globals';
import { assert } from '../helpers/assert';
import {
  createNote,
  readNote,
  appendToNote,
  waitForKey,
} from '../helpers/vault';
import { setSettings } from '../helpers/settings';
import { fmValue } from '../helpers/frontmatter';
import {
  awaitRename,
  setFrontmatterValue,
  setLinkConfig,
  startRename,
  updatedOf,
  waitForCleanCache,
  waitForText,
} from '../helpers/rename';
import { linkUpdateModal } from '../pageobjects/linkUpdateModal';
import {
  openAndFocus,
  holdBufferDirty,
  releaseBufferDirty,
} from '../helpers/editorProbe';

// The experimental "skip the date after a rename" feature (issue #18) can only
// be proven here. Its whole mechanism - snapshot before Obsidian rewrites the
// links, predict the exact bytes, compare - depends on real Obsidian internals
// (`fileManager.inProgressUpdates`, `updateQueue.promise`, the "Update links"
// prompt, `fileToLinktext`'s shortest-path choice) that the unit `obsidian`
// mock cannot reproduce. The pure prediction grammar is unit-tested instead;
// never duplicate that here.
//
// The governing invariant of every scenario: the feature must fail toward
// stamping. Only a byte-exact match may keep a date; everything else - a human
// edit landing mid-rename, an unpredictable link shape, a folder move, an
// editor holding unsaved changes - must stamp exactly as it does today.

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
// Far enough in the past to clear the freshness guard, so a genuine change
// always produces a visible stamp.
const OLD = '2020-06-01T10:00:00';
// The modify debounce is 2 s; give the whole pipeline room to settle.
const SETTLE_MS = 4500;

async function createNoteAt(path: string, content: string): Promise<string> {
  await browser.executeObsidian(
    async ({ app }, p, c) => {
      const parent = p.slice(0, p.lastIndexOf('/'));
      if (parent && !app.vault.getAbstractFileByPath(parent)) {
        await app.vault.createFolder(parent);
      }
      if (!app.vault.getAbstractFileByPath(p)) await app.vault.create(p, c);
    },
    path,
    content,
  );
  return path;
}

/**
 * Bring a linking note into the exact state the feature needs as a baseline:
 * a warm hash-cache entry (only a note the plugin already knows about can be
 * suppressed) plus a deliberately stale `updated`, so any real change is
 * unmistakable in the assertions.
 */
async function seedLinkingNote(path: string): Promise<void> {
  await appendToNote(path, '\nseed edit\n');
  await waitForKey(path, 'updated');
  // handleFileChange refreshes the hash right after its write; let it land.
  await browser.pause(800);
  await setFrontmatterValue(path, 'updated', OLD);
  // The frontmatter-only write fires its own modify. In the default `body`
  // hash mode the tracked content is unchanged, so the pass that follows finds
  // "unchanged" and stamps nothing - wait it out before the rename.
  await browser.pause(SETTLE_MS);
  assert.equal(await updatedOf(path), OLD);
}

const BODY = (links: string) =>
  `---\ncreated: 2019-01-01T00:00:00\n---\n\n${links}\n`;

describe('experimental: skip the date after a rename', function () {
  beforeEach(async function () {
    await setSettings({
      enableAutoUpdate: true,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      timezone: '',
      enableNumberProperties: false,
      enableContentHashCheck: true,
      hashTrackingMode: 'body',
      minSecondsBetweenSaves: 0,
      delayForNewFiles: 0,
      filterRules: '',
      experimentalSkipRenameLinkUpdates: true,
    });
    await setLinkConfig({ alwaysUpdateLinks: false, useMarkdownLinks: false });
  });

  it('R1: "Just once" - the linking note keeps its date', async function () {
    const target = await createNote('r1-target', '# target\n');
    const base = target.replace(/\.md$/, '');
    const source = await createNote('r1-source', BODY(`see [[${base}]] here`));
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r1-target-renamed.md');
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await waitForText(source, '[[r1-target-renamed]]');
    await browser.pause(SETTLE_MS);

    assert.equal(await updatedOf(source), OLD);
    // The rewrite really happened - this is a suppressed stamp, not a no-op.
    assert.match(await readNote(source), /\[\[r1-target-renamed]] here/);
  });

  it('R2: the prompt left open for a while - still suppressed', async function () {
    const target = await createNote('r2-target', '# target\n');
    const base = target.replace(/\.md$/, '');
    const source = await createNote('r2-source', BODY(`see [[${base}]] here`));
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r2-target-renamed.md');
    await linkUpdateModal.waitForOpen();
    // The user can leave this prompt open indefinitely; the armed promise must
    // survive it rather than time out into a guessed window.
    await browser.pause(8000);
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await waitForText(source, '[[r2-target-renamed]]');
    await browser.pause(SETTLE_MS);

    assert.equal(await updatedOf(source), OLD);
  });

  it('R3: "Do not update" - nothing is rewritten and nothing stays armed', async function () {
    const target = await createNote('r3-target', '# target\n');
    const base = target.replace(/\.md$/, '');
    const source = await createNote('r3-source', BODY(`see [[${base}]] here`));
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r3-target-renamed.md');
    await linkUpdateModal.choose('Do not update');
    await awaitRename();
    await browser.pause(SETTLE_MS);

    // No rewrite, so the note is byte-identical and nothing was stamped.
    assert.equal(await updatedOf(source), OLD);
    assert.match(await readNote(source), new RegExp(`\\[\\[${base}]] here`));

    // A later real edit must still stamp - the declined rename may not leave
    // a suppression armed behind it.
    await appendToNote(source, '\na real edit\n');
    await browser.waitUntil(async () => (await updatedOf(source)) !== OLD, {
      timeout: 15_000,
      interval: 250,
      timeoutMsg: 'a real edit after a declined rename was not stamped',
    });
  });

  it('R4: a human edit while the prompt is open MUST still be stamped', async function () {
    // The single most important scenario in this file. If it ever fails, the
    // feature is losing a real edit and must be turned off, not worked around.
    const target = await createNote('r4-target', '# target\n');
    const base = target.replace(/\.md$/, '');
    const source = await createNote('r4-source', BODY(`see [[${base}]] here`));
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r4-target-renamed.md');
    await linkUpdateModal.waitForOpen();
    // The snapshot was taken before this edit, so the prediction can no longer
    // match the file - and the note must be stamped.
    await appendToNote(source, '\ntyped while the prompt was open\n');
    await browser.pause(1000);
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await waitForText(source, '[[r4-target-renamed]]');

    await browser.waitUntil(async () => (await updatedOf(source)) !== OLD, {
      timeout: 20_000,
      interval: 250,
      timeoutMsg: 'an edit made during the rename was silently swallowed',
    });
    assert.match(
      await readNote(source),
      /typed while the prompt was open/,
      'the typed text must survive',
    );
  });

  it('R5: alias forms - auto alias is rewritten, a custom one is preserved', async function () {
    const target = await createNoteAt('r5dir/target.md', '# target\n');
    const source = await createNote(
      'r5-source',
      BODY('a [[r5dir/target|target]] b [[r5dir/target|custom label]] c'),
    );
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r5dir/renamed.md');
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await waitForText(source, 'renamed');
    await browser.pause(SETTLE_MS);

    assert.equal(await updatedOf(source), OLD);
    const raw = await readNote(source);
    // Obsidian rewrites an alias only when it was its own auto-generated
    // basename; the hand-written one survives untouched.
    assert.match(raw, /\[\[[^\]]*renamed\|renamed]]/);
    assert.match(raw, /\[\[[^\]]*renamed\|custom label]]/);
  });

  it('R6: subpath and block-reference links are suppressed too', async function () {
    const target = await createNote(
      'r6-target',
      '# target\n\n## Section\n\ntext ^blockid\n',
    );
    const base = target.replace(/\.md$/, '');
    const source = await createNote(
      'r6-source',
      BODY(`a [[${base}#Section]] b [[${base}#^blockid]] c`),
    );
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r6-target-renamed.md');
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await waitForText(source, '[[r6-target-renamed#Section]]');
    await browser.pause(SETTLE_MS);

    assert.equal(await updatedOf(source), OLD);
    assert.match(await readNote(source), /\[\[r6-target-renamed#\^blockid]]/);
  });

  it('R7: a Markdown-link vault is stamped as it is today', async function () {
    await setLinkConfig({ useMarkdownLinks: true });
    const target = await createNote('r7-target', '# target\n');
    const source = await createNote(
      'r7-source',
      BODY(`see [${target.replace(/\.md$/, '')}](${target}) here`),
    );
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r7-target-renamed.md');
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await waitForText(source, 'r7-target-renamed');

    // v1 never predicts Markdown links, so this note takes today's behaviour.
    await browser.waitUntil(async () => (await updatedOf(source)) !== OLD, {
      timeout: 20_000,
      interval: 250,
      timeoutMsg: 'a Markdown-link rewrite must still stamp the note',
    });
  });

  it('R8: a folder move does not fire the feature', async function () {
    // The fixture links ONLY to the last child on purpose. An earlier draft
    // linked to both, which made this pass for the wrong reason: the two
    // children happened to form an arm/cancel pair. With only the last child
    // linked, the earlier ones have no backlinks at all - so unless the
    // exclusion LATCHES, they step aside and the last child arms and
    // suppresses. This fixture is what actually pins the invariant.
    await createNoteAt('r8dir/a.md', '# a\n');
    await createNoteAt('r8dir/b.md', '# b\n');
    await createNoteAt('r8dir/c.md', '# c\n');
    const source = await createNote('r8-source', BODY('see [[r8dir/c]] here'));
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename('r8dir', 'r8moved');
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    // With the default "shortest path when possible" link format Obsidian
    // rewrites both links to their bare basenames, so the old folder name is
    // what disappears.
    await browser.waitUntil(
      async () => !(await readNote(source)).includes('r8dir'),
      {
        timeout: 20_000,
        interval: 200,
        timeoutMsg: 'the folder move never rewrote the links',
      },
    );

    // One rename event per moved child cancels the batch outright.
    await browser.waitUntil(async () => (await updatedOf(source)) !== OLD, {
      timeout: 20_000,
      interval: 250,
      timeoutMsg: 'a folder move must still stamp the linking note',
    });
  });

  it('R9: a note linking somewhere else is left alone', async function () {
    const target = await createNote('r9-target', '# target\n');
    const other = await createNote('r9-other', '# other\n');
    const bystander = await createNote(
      'r9-bystander',
      BODY(`see [[${other.replace(/\.md$/, '')}]] here`),
    );
    const source = await createNote(
      'r9-source',
      BODY(`see [[${target.replace(/\.md$/, '')}]] here`),
    );
    await seedLinkingNote(bystander);
    await seedLinkingNote(source);
    await waitForCleanCache();

    const bystanderBefore = await readNote(bystander);
    await startRename(target, 'r9-target-renamed.md');
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await waitForText(source, '[[r9-target-renamed]]');
    await browser.pause(SETTLE_MS);

    assert.equal(await updatedOf(source), OLD);
    // The unrelated note is byte-identical: not rewritten, not stamped, and
    // never touched by the suppression pass.
    assert.equal(await readNote(bystander), bystanderBefore);
    assert.equal(fmValue(bystanderBefore, 'updated'), OLD);
  });

  it('R10: a linking note with unsaved editor changes is not suppressed', async function () {
    const target = await createNote('r10-target', '# target\n');
    const base = target.replace(/\.md$/, '');
    const source = await createNote('r10-source', BODY(`see [[${base}]] here`));
    await seedLinkingNote(source);
    await waitForCleanCache();

    await openAndFocus(source);
    await holdBufferDirty(source);
    await browser.pause(500);

    await startRename(target, 'r10-target-renamed.md');
    await linkUpdateModal.choose('Just once');
    await awaitRename();
    await browser.pause(1000);
    await releaseBufferDirty();

    // The write guard skips a dirty buffer at snapshot time, so nothing is
    // suppressed and the note is stamped once the editor flushes.
    await browser.waitUntil(async () => (await updatedOf(source)) !== OLD, {
      timeout: 20_000,
      interval: 250,
      timeoutMsg: 'a note with unsaved editor changes must still be stamped',
    });
  });

  it('R11: with "Automatically update internal links" on, the date is still kept', async function () {
    // No prompt at all here: the rewrite follows the rename immediately, which
    // is the tightest race the snapshot has to win. If this ever turns flaky,
    // the feature is losing coverage (never data) for this configuration.
    await setLinkConfig({ alwaysUpdateLinks: true });
    const target = await createNote('r11-target', '# target\n');
    const base = target.replace(/\.md$/, '');
    const source = await createNote('r11-source', BODY(`see [[${base}]] here`));
    await seedLinkingNote(source);
    await waitForCleanCache();

    await startRename(target, 'r11-target-renamed.md');
    await awaitRename();
    await waitForText(source, '[[r11-target-renamed]]');
    await browser.pause(SETTLE_MS);

    assert.equal(await updatedOf(source), OLD);
  });
});

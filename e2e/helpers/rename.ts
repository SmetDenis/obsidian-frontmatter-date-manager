import { browser } from '@wdio/globals';
import { readNote } from './vault';
import { fmValue } from './frontmatter';

// Vault-side helpers for the rename-link-suppression scenarios. No DOM here -
// the "Update links" prompt lives in pageobjects/linkUpdateModal.ts.

interface RenameGlobals {
  __fdmRename?: Promise<void>;
}

/**
 * Patch Obsidian's own link settings for a scenario.
 *
 * `alwaysUpdateLinks: false` (Obsidian's default) is what makes renameFile stop
 * on the "Update links" prompt; `useMarkdownLinks: true` switches the vault to
 * `[text](path.md)` links, which v1 of the feature deliberately never predicts.
 */
export async function setLinkConfig(patch: {
  alwaysUpdateLinks?: boolean;
  useMarkdownLinks?: boolean;
}): Promise<void> {
  await browser.executeObsidian(({ app }, p) => {
    const vault = app.vault as unknown as {
      setConfig(key: string, value: unknown): void;
    };
    for (const [key, value] of Object.entries(p)) {
      vault.setConfig(key, value);
    }
  }, patch);
}

/** Wait until Obsidian's metadata cache has resolved every pending link. */
export async function waitForCleanCache(): Promise<void> {
  await browser.executeObsidian(async ({ app }) => {
    // Undocumented internal, but the only way to know the link index has
    // caught up before a rename - resolvedLinks is what arming reads.
    const cache = app.metadataCache as unknown as {
      onCleanCache(cb: () => void): void;
    };
    await new Promise<void>((resolve) => {
      cache.onCleanCache(resolve);
    });
  });
}

/**
 * Start a link-updating rename WITHOUT awaiting it - the call blocks on the
 * "Update links" prompt, so the promise is parked on `window` and awaited later
 * via awaitRename().
 */
export async function startRename(
  oldPath: string,
  newPath: string,
): Promise<void> {
  await browser.executeObsidian(
    ({ app }, o, n) => {
      const file = app.vault.getAbstractFileByPath(o);
      if (file === null) throw new Error(`nothing at ${o}`);
      const g = window as unknown as RenameGlobals;
      const promise = app.fileManager.renameFile(file, n);
      // Park a rejection handler immediately - "Do not update" and a cancelled
      // rename both settle this promise, and an unhandled rejection would fail
      // the run for the wrong reason.
      promise.catch(() => undefined);
      g.__fdmRename = promise;
    },
    oldPath,
    newPath,
  );
}

/** Await the rename started by startRename (including its link rewrites). */
export async function awaitRename(): Promise<void> {
  await browser.executeObsidian(async () => {
    const g = window as unknown as RenameGlobals;
    try {
      await g.__fdmRename;
    } catch {
      // A rejected rename is a valid scenario outcome; the assertions decide.
    }
  });
}

/** Set one frontmatter key through Obsidian's own safe mutation path. */
export async function setFrontmatterValue(
  path: string,
  key: string,
  value: string,
): Promise<void> {
  await browser.executeObsidian(
    async ({ app, obsidian }, p, k, v) => {
      const file = app.vault.getAbstractFileByPath(p);
      if (!(file instanceof obsidian.TFile)) throw new Error(`no note at ${p}`);
      await app.fileManager.processFrontMatter(
        file,
        (fm: Record<string, unknown>) => {
          fm[k] = v;
        },
      );
    },
    path,
    key,
    value,
  );
}

/** Wait until the note's raw text contains `needle` (i.e. the rewrite landed). */
export async function waitForText(path: string, needle: string): Promise<void> {
  await browser.waitUntil(async () => (await readNote(path)).includes(needle), {
    timeout: 20_000,
    interval: 200,
    timeoutMsg: `"${needle}" never appeared in ${path}`,
  });
}

/** The note's current `updated` value, for before/after comparisons. */
export async function updatedOf(path: string): Promise<string | undefined> {
  return fmValue(await readNote(path), 'updated');
}

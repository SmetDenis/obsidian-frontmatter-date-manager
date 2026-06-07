import { browser } from '@wdio/globals';
import { obsidianPage } from 'wdio-obsidian-service';
import { fmValue } from './frontmatter';

let counter = 0;

/**
 * Create a note via the real vault API (so Obsidian immediately knows it).
 * `prefix` should be unique per spec to avoid cross-spec collisions.
 */
export async function createNote(
  prefix: string,
  content: string,
): Promise<string> {
  const path = `${prefix}-${counter++}.md`;
  await browser.executeObsidian(
    async ({ app }, p, c) => {
      if (!app.vault.getAbstractFileByPath(p)) {
        await app.vault.create(p, c);
      }
    },
    path,
    content,
  );
  return path;
}

/** Raw on-disk text of a note. */
export async function readNote(path: string): Promise<string> {
  return obsidianPage.read(path);
}

/** Append text to a note, triggering a real `modify` event. */
export async function appendToNote(path: string, text: string): Promise<void> {
  await browser.executeObsidian(
    async ({ app, obsidian }, p, t) => {
      const f = app.vault.getAbstractFileByPath(p);
      if (f instanceof obsidian.TFile) await app.vault.append(f, t);
    },
    path,
    text,
  );
}

/** Wait until a frontmatter key appears on disk. */
export async function waitForKey(path: string, key: string): Promise<void> {
  await browser.waitUntil(
    async () => fmValue(await readNote(path), key) !== undefined,
    {
      timeout: 15_000,
      interval: 250,
      timeoutMsg: `key "${key}" never appeared in ${path}`,
    },
  );
}

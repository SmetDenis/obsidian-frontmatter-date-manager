import { browser } from '@wdio/globals';

// Probes for the "never write into an editor with unsaved changes" invariant
// (issue #10). The load-bearing one is armWriteProbe: it wraps
// `fileManager.processFrontMatter` and records, AT THE MOMENT OF EACH CALL, the
// `dirty` flag of every Markdown leaf showing that file. Without it a scenario
// can only observe symptoms after the fact and greens for the wrong reason -
// "no merge notice" is equally explained by "the plugin never wrote at all".
//
// `dirty` is TextFileView's own unsaved-changes flag (set by `requestSave()`,
// cleared by `save()`); it is not in the public typings, so it is read through
// an `unknown` cast and reported as `null` when it is not a boolean.

export interface WriteRecord {
  /** Path passed to processFrontMatter. */
  path: string;
  /** `dirty` of every Markdown leaf showing this file, at call time. */
  dirty: (boolean | null)[];
}

/** Start recording every processFrontMatter call (and reset previous records). */
export async function armWriteProbe(): Promise<void> {
  await browser.executeObsidian(({ app }) => {
    const g = window as unknown as {
      __fdmWrites?: WriteRecordLike[];
      __fdmOrigPFM?: PfmFn;
    };
    interface WriteRecordLike {
      path: string;
      dirty: (boolean | null)[];
    }
    type PfmFn = (
      file: unknown,
      fn: unknown,
      opts?: unknown,
    ) => Promise<unknown>;

    g.__fdmWrites = [];
    const fm = app.fileManager as unknown as { processFrontMatter: PfmFn };
    // Keep the very first original so re-arming never chains wrappers.
    g.__fdmOrigPFM ??= fm.processFrontMatter.bind(fm);
    const orig = g.__fdmOrigPFM;
    fm.processFrontMatter = (file, fn, opts) => {
      const path = (file as { path?: string }).path ?? '';
      const dirty = app.workspace
        .getLeavesOfType('markdown')
        .filter(
          (leaf) =>
            (leaf.view as unknown as { file?: { path: string } }).file?.path ===
            path,
        )
        .map((leaf) => {
          const flag = (leaf.view as unknown as { dirty?: unknown }).dirty;
          return typeof flag === 'boolean' ? flag : null;
        });
      g.__fdmWrites?.push({ path, dirty });
      return orig(file, fn, opts);
    };
  });
}

/** Every processFrontMatter call recorded since armWriteProbe(). */
export async function recordedWrites(): Promise<WriteRecord[]> {
  return browser.executeObsidian(() => {
    const g = window as unknown as { __fdmWrites?: WriteRecord[] };
    return g.__fdmWrites ?? [];
  });
}

/** Writes to this path, and of those the ones made while a leaf was dirty. */
export async function writeSummary(path: string): Promise<{
  total: number;
  dirty: WriteRecord[];
}> {
  const all = (await recordedWrites()).filter((w) => w.path === path);
  return {
    total: all.length,
    dirty: all.filter((w) => w.dirty.includes(true)),
  };
}

/** Collect the text of every Notice shown from now on. Armed before the action
 * so a notice cannot slip between polls. */
export async function armNoticeProbe(): Promise<void> {
  await browser.executeObsidian(() => {
    const g = window as unknown as {
      __fdmNotices?: string[];
      __fdmNoticeObserver?: MutationObserver;
    };
    g.__fdmNotices = [];
    g.__fdmNoticeObserver?.disconnect();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.instanceOf(HTMLElement) && node.hasClass('notice')) {
            g.__fdmNotices?.push(node.textContent);
          }
        });
      }
    });
    observer.observe(activeDocument.body, { childList: true, subtree: true });
    g.__fdmNoticeObserver = observer;
  });
}

export async function collectedNotices(): Promise<string[]> {
  return browser.executeObsidian(() => {
    const g = window as unknown as { __fdmNotices?: string[] };
    return g.__fdmNotices ?? [];
  });
}

/** Merge notices naming this file. Used as a boolean symptom probe, never as an
 * exact event count (a re-attached node could be seen twice). */
export async function mergeNoticesFor(path: string): Promise<string[]> {
  const base = path.replace(/\.md$/, '');
  return (await collectedNotices()).filter(
    (n) => /modified externally/.test(n) && n.includes(base),
  );
}

/** Open the note and put the caret at the end of the body, so typed characters
 * land in the body and never inside the frontmatter fence. */
export async function openAndFocus(path: string, split = false): Promise<void> {
  await browser.executeObsidian(
    async ({ app, obsidian }, p, useSplit) => {
      const f = app.vault.getAbstractFileByPath(p);
      if (!(f instanceof obsidian.TFile)) throw new Error(`note missing: ${p}`);
      // Force source mode: a leaf left in reading mode by an earlier scenario
      // would otherwise be reused, and keystrokes would land nowhere.
      await app.workspace
        .getLeaf(useSplit ? 'split' : false)
        .openFile(f, { active: true, state: { mode: 'source' } });
      const ed = app.workspace.activeEditor?.editor;
      if (!ed) throw new Error('no active editor after openFile');
      const last = ed.lastLine();
      ed.setCursor({ line: last, ch: ed.getLine(last).length });
      ed.focus();
    },
    path,
    split,
  );
}

/** Open the note in reading (preview) mode - no editor, so no dirty buffer. */
export async function openInReadingMode(path: string): Promise<void> {
  await browser.executeObsidian(async ({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    if (!(f instanceof obsidian.TFile)) throw new Error(`note missing: ${p}`);
    await app.workspace
      .getLeaf(false)
      .openFile(f, { active: true, state: { mode: 'preview' } });
  }, path);
}

/** The live editor buffer of the active editor (what the user sees). */
export async function editorText(): Promise<string> {
  return browser.executeObsidian(({ app }) => {
    return app.workspace.activeEditor?.editor?.getValue() ?? '';
  });
}

/** The `dirty` flag of every Markdown leaf showing this file, right now. */
export async function leafDirtyStates(
  path: string,
): Promise<(boolean | null)[]> {
  return browser.executeObsidian(({ app }, p) => {
    return app.workspace
      .getLeavesOfType('markdown')
      .filter(
        (leaf) =>
          (leaf.view as unknown as { file?: { path: string } }).file?.path ===
          p,
      )
      .map((leaf) => {
        const flag = (leaf.view as unknown as { dirty?: unknown }).dirty;
        return typeof flag === 'boolean' ? flag : null;
      });
  }, path);
}

export async function statOf(
  path: string,
): Promise<{ mtime: number; size: number }> {
  return browser.executeObsidian(({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    if (!(f instanceof obsidian.TFile)) throw new Error(`note missing: ${p}`);
    return { mtime: f.stat.mtime, size: f.stat.size };
  }, path);
}

/** Text of the open editor-suggester entries (empty when it is closed). Checking
 * the TEXT, not just the container, proves the suggester is the link one and is
 * offering the expected note. */
export async function suggesterEntries(): Promise<string[]> {
  return browser.executeObsidian(() => {
    return Array.from(
      activeDocument.querySelectorAll('.suggestion-container .suggestion-item'),
    ).map((el) => el.textContent);
  });
}

/** Neutralize the editor's own 2 s autosave for every leaf showing this file, so
 * a buffer made dirty here STAYS dirty for as long as the scenario needs.
 *
 * Without it, any scenario that has to drive UI (a modal, the settings tab)
 * before the plugin writes is a race against Obsidian's autosave: the buffer
 * goes clean after ~2 s and the run greens without ever exercising the defect.
 * Call this BEFORE dirtying the buffer, and always release it afterwards.
 */
export async function holdBufferDirty(path: string): Promise<void> {
  await browser.executeObsidian(({ app }, p) => {
    interface HeldView {
      dirty?: boolean;
      file?: { path: string };
      editor?: {
        lastLine(): number;
        getLine(n: number): string;
        replaceRange(text: string, from: { line: number; ch: number }): void;
      };
    }
    const g = window as unknown as { __fdmDirtyTimer?: number };
    if (g.__fdmDirtyTimer !== undefined)
      window.clearInterval(g.__fdmDirtyTimer);

    const leaf = app.workspace
      .getLeavesOfType('markdown')
      .find((l) => (l.view as unknown as HeldView).file?.path === p);
    if (!leaf) throw new Error(`no markdown leaf showing ${p}`);
    const view = leaf.view as unknown as HeldView;

    // Patching `view.save` does NOT work: TextFileView binds `save` at
    // construction (`debounce(this.save.bind(this), 2000)`), so the pending
    // autosave calls the ORIGINAL method and the buffer goes clean anyway.
    // Two mechanisms instead:
    //  1. behave like a user who keeps typing - append a character every tick,
    //     so the buffer genuinely diverges from disk;
    //  2. PIN the flag itself: the autosave debounce fires every 2 s and would
    //     otherwise clear `dirty` for a moment, opening a race in which the
    //     plugin legitimately writes into a clean buffer and the scenario
    //     silently loses its precondition. `dirty` is the exact field both
    //     Obsidian's merge branch and the plugin's guard read, so pinning it
    //     keeps the state under test stable for the whole scenario.
    const held = view as unknown as Record<string, unknown>;
    Object.defineProperty(held, 'dirty', {
      configurable: true,
      get: () => true,
      set: () => {},
    });
    g.__fdmDirtyTimer = window.setInterval(() => {
      const ed = view.editor;
      if (ed) {
        const last = ed.lastLine();
        ed.replaceRange('.', { line: last, ch: ed.getLine(last).length });
      }
    }, 300);
  }, path);
}

/** Undo holdBufferDirty: stop the simulated typist, un-pin `dirty`, and let the
 * editor flush, so the buffer really goes clean for the "and then it lands"
 * half of each scenario. */
export async function releaseBufferDirty(): Promise<void> {
  await browser.executeObsidian(async ({ app }) => {
    const g = window as unknown as { __fdmDirtyTimer?: number };
    if (g.__fdmDirtyTimer !== undefined)
      window.clearInterval(g.__fdmDirtyTimer);
    g.__fdmDirtyTimer = undefined;

    interface HeldView {
      dirty?: boolean;
      save?: () => Promise<void>;
    }
    for (const leaf of app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view as unknown as HeldView;
      const held = view as unknown as Record<string, unknown>;
      const own = Object.getOwnPropertyDescriptor(held, 'dirty');
      if (own?.get) {
        delete held.dirty;
        // Flush whatever the simulated typist appended, so `dirty` is genuinely
        // false afterwards rather than merely un-pinned.
        if (view.save) await view.save();
      }
    }
  });
}

/** Close the settings window, so later keystrokes reach the editor and not a
 * modal left open by a previous scenario. */
export async function closeSettings(): Promise<void> {
  await browser.executeObsidian(({ app }) => {
    (app as unknown as { setting: { close(): void } }).setting.close();
  });
}

/** Append text through the Editor API, which dispatches a real CodeMirror
 * transaction and therefore sets the view's `dirty` flag - the same state a
 * typing user is in, without depending on keystroke timing. */
export async function dirtyTheBuffer(text: string): Promise<void> {
  await browser.executeObsidian(({ app }, t) => {
    const ed = app.workspace.activeEditor?.editor;
    if (!ed) throw new Error('no active editor');
    const last = ed.lastLine();
    ed.replaceRange(t, { line: last, ch: ed.getLine(last).length });
  }, text);
}

/** Register a one-shot vault `modify` listener for this path, so a scenario can
 * prove the event really fired (or really did not). A local copy of the same
 * idea already lives in external-fresh-updated.e2e.ts. */
export async function armModifyProbe(path: string): Promise<void> {
  await browser.executeObsidian(({ app }, p) => {
    const g = window as unknown as { __fdmModifyFired?: boolean };
    g.__fdmModifyFired = false;
    app.vault.on('modify', (f) => {
      if (f.path === p) g.__fdmModifyFired = true;
    });
  }, path);
}

export async function modifyProbeFired(): Promise<boolean> {
  return browser.executeObsidian(() => {
    const g = window as unknown as { __fdmModifyFired?: boolean };
    return g.__fdmModifyFired === true;
  });
}

/** Type one character at a time with a gap - how a human types, so the editor
 * buffer stays dirty across the plugin's write window. */
export async function typeSlowly(text: string, gapMs: number): Promise<void> {
  for (const ch of text) {
    await browser.keys(ch);
    await browser.pause(gapMs);
  }
}

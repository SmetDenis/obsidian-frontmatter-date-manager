import { browser } from '@wdio/globals';

// All Excalidraw coupling for the e2e suite lives here. Everything reaches the
// REAL obsidian-excalidraw-plugin (installed by wdio.conf.mts, enabled only by
// excalidraw.e2e.ts) through the same public-but-untyped surfaces the plugin's
// write guard uses (`isDirty()`, `semaphores`, `lastSaveTimestamp`,
// `setDirty()`, `forceSave()`) plus the ExcalidrawAutomate scripting API - all
// via structural casts inside executeObsidian callbacks, never an import of
// Excalidraw code. NOTE: executeObsidian callbacks are serialized - they must
// not close over local variables; everything is passed as arguments.

const EXCALIDRAW_PLUGIN_ID = 'obsidian-excalidraw-plugin';

interface EaLike {
  create(params: {
    filename?: string;
    foldername?: string;
    silent?: boolean;
  }): Promise<string>;
  setView(view: unknown): unknown;
  addRect(topX: number, topY: number, width: number, height: number): string;
  addElementsToView(
    repositionToCursor?: boolean,
    save?: boolean,
  ): Promise<boolean>;
  reset(): void;
}

/** Enable/disable the real Excalidraw plugin (installed-but-disabled by conf). */
export async function setExcalidrawEnabled(enabled: boolean): Promise<void> {
  await browser.executeObsidian(
    async ({ app }, id, on) => {
      const plugins = (
        app as unknown as {
          plugins: {
            enablePlugin(id: string): Promise<void>;
            disablePlugin(id: string): Promise<void>;
          };
        }
      ).plugins;
      if (on) await plugins.enablePlugin(id);
      else await plugins.disablePlugin(id);
    },
    EXCALIDRAW_PLUGIN_ID,
    enabled,
  );
  if (enabled) {
    // The ExcalidrawAutomate global appears once the plugin finishes loading.
    await browser.waitUntil(
      () =>
        browser.executeObsidian(
          () =>
            (window as unknown as Record<string, unknown>)[
              'ExcalidrawAutomate'
            ] != null,
        ),
      { timeout: 15_000, timeoutMsg: 'ExcalidrawAutomate never appeared' },
    );
  }
}

/**
 * Turn Excalidraw's own autosave off/on (its public `autosaveEnabled` flag).
 *
 * Scenarios that need a drawing to STAY dirty must disable it first: otherwise
 * Excalidraw saves in the background mid-scenario, the view goes clean, and the
 * run greens without ever exercising the guard. Always restore it afterwards.
 */
export async function setExcalidrawAutosave(enabled: boolean): Promise<void> {
  await browser.executeObsidian(
    ({ app }, id, on) => {
      const plugin = (
        app as unknown as {
          plugins: { plugins: Record<string, { autosaveEnabled?: boolean }> };
        }
      ).plugins.plugins[id];
      if (!plugin) throw new Error('Excalidraw plugin is not enabled');
      plugin.autosaveEnabled = on;
    },
    EXCALIDRAW_PLUGIN_ID,
    enabled,
  );
}

/**
 * Mark the open drawing dirty via Excalidraw's public `setDirty()`.
 *
 * Needed as a re-arm right before an assertion: Excalidraw force-saves on a
 * window `blur` (registerDomEvent(ownerWindow, "blur", ...) -> forceSave, which
 * ignores its autosave setting), and WebDriver interaction can produce one.
 */
export async function markDrawingDirty(path: string): Promise<void> {
  await browser.executeObsidian(({ app }, p) => {
    interface ViewLike {
      file?: { path: string };
      setDirty?: () => void;
    }
    const leaf = app.workspace
      .getLeavesOfType('excalidraw')
      .find((l) => (l.view as unknown as ViewLike).file?.path === p);
    if (!leaf) throw new Error(`no open Excalidraw view for ${p}`);
    (leaf.view as unknown as ViewLike).setDirty?.();
  }, path);
}

/**
 * What FDM's write-safety gate says about this file right now
 * ('markdown' | 'excalidraw' | null). This is the exact gate every write path
 * consults - the automatic pass, the manual command, and `applyFrontmatterWrite`
 * for bulk - so asserting on it proves the bulk skip without driving the modal
 * UI (which cannot be done here: any click outside the drawing blurs the window
 * and Excalidraw force-saves, cleaning the very state under test).
 */
export async function fdmWriteBlock(path: string): Promise<string | null> {
  return browser.executeObsidian(async ({ app }, p) => {
    const plugin = (
      app as unknown as { plugins: { plugins: Record<string, unknown> } }
    ).plugins.plugins['frontmatter-date-manager'] as
      | { getWriteBlock(f: unknown): Promise<string | null> }
      | undefined;
    if (!plugin) throw new Error('frontmatter-date-manager is not loaded');
    const file = app.vault.getAbstractFileByPath(p);
    if (!file) throw new Error(`no such file: ${p}`);
    return await plugin.getWriteBlock(file);
  }, path);
}

/** Run one FDM pass on this file exactly as a vault `modify` event would. */
export async function fdmHandleFileChange(path: string): Promise<{
  status: string;
  wrote?: boolean;
  blocked?: string;
  reason?: string;
}> {
  return browser.executeObsidian(async ({ app }, p) => {
    const plugin = (
      app as unknown as { plugins: { plugins: Record<string, unknown> } }
    ).plugins.plugins['frontmatter-date-manager'] as
      | {
          handleFileChange(f: unknown): Promise<{
            status: string;
            wrote?: boolean;
            blocked?: string;
            reason?: string;
          }>;
        }
      | undefined;
    if (!plugin) throw new Error('frontmatter-date-manager is not loaded');
    const file = app.vault.getAbstractFileByPath(p);
    if (!file) throw new Error(`no such file: ${p}`);
    return await plugin.handleFileChange(file);
  }, path);
}

/**
 * Create a real drawing via ExcalidrawAutomate (silent - no view opened),
 * then wait until metadataCache has indexed its `excalidraw-plugin` marker
 * (the plugin's isExcalidrawFile() reads that cache).
 * Returns the vault path of the new .md drawing.
 */
export async function createDrawing(
  folder: string,
  filename: string,
): Promise<string> {
  const path = await browser.executeObsidian(
    async (_ctx, foldername, fname) => {
      const ea = (window as unknown as Record<string, unknown>)[
        'ExcalidrawAutomate'
      ] as EaLike | undefined;
      if (!ea) throw new Error('Excalidraw plugin is not enabled');
      interface EaCreate {
        create(p: {
          filename?: string;
          foldername?: string;
          silent?: boolean;
        }): Promise<string>;
      }
      return await (ea as EaCreate).create({
        filename: fname,
        foldername,
        silent: true,
      });
    },
    folder,
    filename,
  );
  await browser.waitUntil(
    () =>
      browser.executeObsidian(({ app, obsidian }, p) => {
        const f = app.vault.getAbstractFileByPath(p);
        if (!(f instanceof obsidian.TFile)) return false;
        const fm: Record<string, unknown> | undefined =
          app.metadataCache.getFileCache(f)?.frontmatter;
        return Boolean(fm?.['excalidraw-plugin']);
      }, path),
    {
      timeout: 15_000,
      timeoutMsg: `metadataCache never indexed the drawing marker of ${path}`,
    },
  );
  return path;
}

/** Open a drawing in an Excalidraw view and wait until it is mounted. */
export async function openDrawing(path: string): Promise<void> {
  await browser.executeObsidian(async ({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    if (!(f instanceof obsidian.TFile)) throw new Error(`no such file: ${p}`);
    await app.workspace.getLeaf(false).openFile(f);
  }, path);
  await browser.waitUntil(
    () =>
      browser.executeObsidian(({ app }, p) => {
        interface ViewLike {
          file?: { path: string };
          excalidrawAPI?: unknown;
        }
        return app.workspace.getLeavesOfType('excalidraw').some((leaf) => {
          const view = leaf.view as unknown as ViewLike;
          return view.file?.path === p && view.excalidrawAPI != null;
        });
      }, path),
    {
      timeout: 20_000,
      timeoutMsg: `Excalidraw view for ${path} never mounted`,
    },
  );
}

/** Add a rectangle to the OPEN drawing via EA and mark the view dirty
 * (save=false - the change stays unsaved). */
export async function addRectToOpenDrawing(path: string): Promise<void> {
  await browser.executeObsidian(async ({ app }, p) => {
    const ea = (window as unknown as Record<string, unknown>)[
      'ExcalidrawAutomate'
    ] as EaLike | undefined;
    if (!ea) throw new Error('Excalidraw plugin is not enabled');
    interface ViewLike {
      file?: { path: string };
      setDirty?: () => void;
    }
    const leaf = app.workspace
      .getLeavesOfType('excalidraw')
      .find((l) => (l.view as unknown as ViewLike).file?.path === p);
    if (!leaf) throw new Error(`no open Excalidraw view for ${p}`);
    interface EaScene {
      reset(): void;
      setView(v: unknown): unknown;
      addRect(x: number, y: number, w: number, h: number): string;
      addElementsToView(r?: boolean, save?: boolean): Promise<boolean>;
    }
    const eas = ea as EaScene;
    eas.reset();
    eas.setView(leaf.view);
    eas.addRect(0, 0, 120, 80);
    await eas.addElementsToView(false, false);
    // addElementsToView(save=false) updates the scene without saving; make the
    // unsaved state explicit and deterministic via the public setDirty().
    (leaf.view as unknown as ViewLike).setDirty?.();
  }, path);
}

/** True when the open drawing view reports unsaved changes. */
export async function isDrawingDirty(path: string): Promise<boolean> {
  return browser.executeObsidian(({ app }, p) => {
    interface ViewLike {
      file?: { path: string };
      isDirty?: () => boolean;
    }
    const leaf = app.workspace
      .getLeavesOfType('excalidraw')
      .find((l) => (l.view as unknown as ViewLike).file?.path === p);
    if (!leaf) throw new Error(`no open Excalidraw view for ${p}`);
    return (leaf.view as unknown as ViewLike).isDirty?.() === true;
  }, path);
}

/** Force-save the open drawing and wait until the save fully settles. */
export async function forceSaveDrawing(path: string): Promise<void> {
  await browser.executeObsidian(async ({ app }, p) => {
    interface ViewLike {
      file?: { path: string };
      forceSave?: (silent?: boolean, waitIfBusy?: boolean) => Promise<void>;
    }
    const leaf = app.workspace
      .getLeavesOfType('excalidraw')
      .find((l) => (l.view as unknown as ViewLike).file?.path === p);
    if (!leaf) throw new Error(`no open Excalidraw view for ${p}`);
    await (leaf.view as unknown as ViewLike).forceSave?.(true, true);
  }, path);
  await browser.waitUntil(
    () =>
      browser.executeObsidian(({ app }, p) => {
        interface ViewLike {
          file?: { path: string };
          isDirty?: () => boolean;
          semaphores?: { saving?: boolean; autosaving?: boolean };
        }
        const leaf = app.workspace
          .getLeavesOfType('excalidraw')
          .find((l) => (l.view as unknown as ViewLike).file?.path === p);
        if (!leaf) return false;
        const view = leaf.view as unknown as ViewLike;
        return (
          view.isDirty?.() === false &&
          view.semaphores?.saving !== true &&
          view.semaphores?.autosaving !== true
        );
      }, path),
    { timeout: 15_000, timeoutMsg: `forceSave of ${path} never settled` },
  );
}

/**
 * Rewind the view's lastSaveTimestamp so Excalidraw's modifyEventHandler takes
 * its "no save in the last 5 minutes" branch (reload(true) + clearDirty) on
 * the next external write - the data-loss path the plugin's guard must block.
 */
export async function ageDrawing(path: string, minutes: number): Promise<void> {
  await browser.executeObsidian(
    ({ app }, p, min) => {
      interface ViewLike {
        file?: { path: string };
        lastSaveTimestamp?: number;
      }
      const leaf = app.workspace
        .getLeavesOfType('excalidraw')
        .find((l) => (l.view as unknown as ViewLike).file?.path === p);
      if (!leaf) throw new Error(`no open Excalidraw view for ${p}`);
      (leaf.view as unknown as ViewLike).lastSaveTimestamp =
        Date.now() - min * 60_000;
    },
    path,
    minutes,
  );
}

/** Number of elements in the open drawing's scene. */
export async function sceneElementCount(path: string): Promise<number> {
  return browser.executeObsidian(({ app }, p) => {
    interface ViewLike {
      file?: { path: string };
      excalidrawAPI?: { getSceneElements(): unknown[] } | null;
    }
    const leaf = app.workspace
      .getLeavesOfType('excalidraw')
      .find((l) => (l.view as unknown as ViewLike).file?.path === p);
    if (!leaf) throw new Error(`no open Excalidraw view for ${p}`);
    const api = (leaf.view as unknown as ViewLike).excalidrawAPI;
    return api ? api.getSceneElements().length : -1;
  }, path);
}

/** Pan the open drawing WITHOUT changing any element. */
export async function panZoomDrawing(path: string): Promise<void> {
  await browser.executeObsidian(({ app }, p) => {
    interface ViewLike {
      file?: { path: string };
      excalidrawAPI?: {
        getAppState(): { scrollX: number; scrollY: number };
        updateScene(scene: unknown): void;
      } | null;
    }
    const leaf = app.workspace
      .getLeavesOfType('excalidraw')
      .find((l) => (l.view as unknown as ViewLike).file?.path === p);
    if (!leaf) throw new Error(`no open Excalidraw view for ${p}`);
    const api = (leaf.view as unknown as ViewLike).excalidrawAPI;
    if (!api) throw new Error('view not mounted');
    const st = api.getAppState();
    api.updateScene({
      appState: { scrollX: st.scrollX + 200, scrollY: st.scrollY + 150 },
    });
  }, path);
}

/** Close every Excalidraw view (detaches leaves; a dirty drawing saves on close). */
export async function closeAllDrawings(): Promise<void> {
  await browser.executeObsidian(async ({ app }) => {
    for (const leaf of app.workspace.getLeavesOfType('excalidraw')) {
      leaf.detach();
    }
    // Give the on-close save a moment to flush.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 500));
  });
}

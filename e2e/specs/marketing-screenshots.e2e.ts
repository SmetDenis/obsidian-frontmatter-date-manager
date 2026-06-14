/* global describe, it, before -- Mocha BDD globals injected by the WebdriverIO test runner */
import { browser, $ } from '@wdio/globals';
import { assert } from '../helpers/assert';
import { setSettings } from '../helpers/settings';
import { settingsTab } from '../pageobjects/settingsTab';
import { bulkModal } from '../pageobjects/bulkModal';

// Generates polished marketplace/README screenshots from the REAL plugin running
// inside a REAL Obsidian. Not a characterization test - it stages curated notes,
// drives the UI to its most compelling state, overlays a two-line benefit caption
// banner, and captures the window. Run by hand before a release:
//   make screenshots
//
// Store image rules (locked): max 5 shots, 3:2 ratio, recommended 1200x800,
// PNG/JPEG/WebP, max 5 MB each. The window is sized 1200x800 (3:2); Obsidian
// renders at retina 2x, so each raw capture is 2400x1600 (still 3:2) and
// `make screenshots` downscales it to exactly 1200x800 via sips after this spec.
//
// Output: screenshots/0N-*.png at the repo root (tracked in git, embedded in
// README). The dir must already exist - `browser.saveScreenshot` does not create
// it and e2e specs may not import node builtins (obsidianmd/import/no-nodejs-modules).

const ISO = "yyyy-MM-dd'T'HH:mm:ss";
const OUT = './screenshots';

/** Inject a two-line marketing benefit-banner across the top of the window. */
async function captionOn(line1: string, line2: string): Promise<void> {
  await browser.executeObsidian(
    (_o, l1, l2) => {
      const styleId = 'fdm-caption-style';
      if (!activeDocument.getElementById(styleId)) {
        const style = activeDocument.createElement('style');
        style.id = styleId;
        style.textContent =
          '#fdm-caption{position:fixed;top:0;left:0;right:0;z-index:2147483647;' +
          'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
          'gap:3px;padding:11px 28px;box-sizing:border-box;' +
          'background:linear-gradient(90deg,#7C3AED 0%,#4f46e5 100%);' +
          "font-family:'Maple Mono','Maple Mono NF',ui-monospace,monospace;" +
          'box-shadow:0 3px 16px rgba(0,0,0,.45);}' +
          '#fdm-caption .l1{color:#fff;font-size:20px;font-weight:700;line-height:1.3;text-align:center;}' +
          '#fdm-caption .l2{color:#e6dcff;font-size:14px;font-weight:500;line-height:1.3;text-align:center;}';
        activeDocument.head.appendChild(style);
      }
      let band = activeDocument.getElementById('fdm-caption');
      if (!band) {
        band = activeDocument.createElement('div');
        band.id = 'fdm-caption';
        activeDocument.body.appendChild(band);
      }
      band.textContent = '';
      const a = activeDocument.createElement('div');
      a.className = 'l1';
      a.textContent = l1;
      band.appendChild(a);
      const b = activeDocument.createElement('div');
      b.className = 'l2';
      b.textContent = l2;
      band.appendChild(b);
    },
    line1,
    line2,
  );
}

/** Remove the banner so it never leaks into the next shot. */
async function captionOff(): Promise<void> {
  await browser.executeObsidian(() => {
    activeDocument.getElementById('fdm-caption')?.remove();
    activeDocument.getElementById('fdm-caption-style')?.remove();
  });
}

/** Caption the current screen, capture it, then clear the caption. */
async function shot(name: string, line1: string, line2: string): Promise<void> {
  await captionOn(line1, line2);
  await browser.pause(180);
  await browser.saveScreenshot(`${OUT}/${name}.png`);
  await captionOff();
}

/** Create a note at an exact path (creating its parent folder if needed). */
async function mkNote(path: string, content: string): Promise<void> {
  await browser.executeObsidian(
    async ({ app }, p, c) => {
      const slash = p.lastIndexOf('/');
      if (slash > 0) {
        const dir = p.slice(0, slash);
        if (!app.vault.getAbstractFileByPath(dir)) {
          try {
            await app.vault.createFolder(dir);
          } catch {
            /* concurrent create / already exists */
          }
        }
      }
      if (!app.vault.getAbstractFileByPath(p)) {
        await app.vault.create(p, c);
      }
    },
    path,
    content,
  );
}

/** Open a note in the main editor pane. */
async function openNote(path: string): Promise<void> {
  await browser.executeObsidian(async ({ app, obsidian }, p) => {
    const f = app.vault.getAbstractFileByPath(p);
    if (f instanceof obsidian.TFile) {
      await app.workspace.getLeaf(false).openFile(f, { active: true });
    }
  }, path);
}

/** Collapse both side docks so a shot can focus on the note / modal. */
async function collapseSidebars(): Promise<void> {
  await browser.executeObsidian(({ app }) => {
    app.workspace.leftSplit.collapse();
    app.workspace.rightSplit.collapse();
  });
}

/** Scroll an element into view via in-page JS (wdio's scrollIntoView hits an unsupported Electron CDP command). */
async function scrollIntoViewInPage(selector: string): Promise<void> {
  await browser.executeObsidian((_o, sel) => {
    activeDocument
      .querySelector(sel)
      ?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, selector);
}

/** Make the editor use the full pane width (no readable-line-length margins). */
async function fullWidthEditor(): Promise<void> {
  await browser.executeObsidian(({ app }) => {
    try {
      (
        app.vault as unknown as { setConfig(k: string, v: unknown): void }
      ).setConfig('readableLineLength', false);
    } catch {
      /* internal config API absent; keep default */
    }
  });
}

/** Turn off editor spellcheck so red squiggles never leak into a shot. */
async function disableSpellcheck(): Promise<void> {
  await browser.executeObsidian(({ app }) => {
    try {
      (
        app.vault as unknown as { setConfig(k: string, v: unknown): void }
      ).setConfig('spellcheck', false);
      // Re-apply editor options so any already-open editor drops the squiggles too.
      (
        app.workspace as unknown as { updateOptions?: () => void }
      ).updateOptions?.();
    } catch {
      /* internal config API absent; keep default */
    }
  });
}

/**
 * Resize the Electron window. `browser.setWindowSize` (Set Window Rect) is
 * unsupported by Obsidian's Electron chromedriver, so we drive Electron's own
 * window API via the `require` Obsidian exposes to plugins. Best-effort: if the
 * remote bridge is unavailable we silently keep the default size.
 */
async function resizeWindow(width: number, height: number): Promise<void> {
  await browser.executeObsidian(
    ({ require: req }, w, h) => {
      type ElectronWin = {
        setSize: (w: number, h: number) => void;
        center?: () => void;
      };
      type ElectronModule = {
        remote?: { getCurrentWindow?: () => ElectronWin };
        getCurrentWindow?: () => ElectronWin;
      };
      try {
        const electron = req('electron') as unknown as ElectronModule;
        const win =
          electron.remote?.getCurrentWindow?.() ??
          electron.getCurrentWindow?.();
        if (win) {
          win.setSize(w, h);
          win.center?.();
        }
      } catch {
        /* remote bridge unavailable; capture at the default window size */
      }
    },
    width,
    height,
  );
}

describe('marketing screenshots (manual; staged, not characterization)', function () {
  before(async function () {
    // Obsidian-recommended store screenshot ratio is 3:2 (1200x800). Capture at a
    // 1200x800 window; retina 2x makes the raw shot 2400x1600 (still 3:2), which
    // `make screenshots` downscales to exactly 1200x800. The diff modals (max-width
    // min(85vw, 900px)) sit centered in the wider frame.
    await resizeWindow(1200, 800);
    await fullWidthEditor();
    await disableSpellcheck();
    await collapseSidebars();
    await browser.pause(600);
  });

  it('01: automatic, sync-proof dates in a real note', async function () {
    await setSettings({
      enableAutoUpdate: false, // freeze our staged dates while we capture
      enableCreateTime: true,
      enableModifiedTime: true,
      enableLastViewed: true,
      headerCreated: 'created',
      headerUpdated: 'updated',
      headerLastViewed: 'viewed',
      dateFormat: ISO,
      timezone: '',
      enableNumberProperties: false,
      filterRules: '',
    });

    await mkNote(
      'Frontmatter Date Manager.md',
      [
        '---',
        'created: 2024-11-03T09:12:40',
        'updated: 2026-06-14T17:48:05',
        'viewed: 2026-06-14T21:03:11',
        'author: SmetDenis',
        '---',
        'Date metadata that maintains itself, across your whole vault.',
        '',
        'What it does:',
        '',
        '- **Sync-proof** - SHA-256 hashing ignores false edits from iCloud, Sync, Dropbox and Git.',
        "- **Adopt any vault** - bulk-fill created and updated dates from each file's history, with a preview.",
        '- **One format** - reformat every date in the vault; ambiguous day/month values are never guessed.',
        '- **Fix mistakes** - find and repair notes whose edit date is older than their creation date.',
        '- **Precise scope** - gitignore-style include and exclude rules pick which notes get dates.',
        '- **Last-opened** - an optional viewed date, stamped on open, for review and Obsidian Bases workflows.',
        '',
        'Why it helps:',
        '',
        '- **No manual upkeep** - stop editing dates by hand on every save.',
        '- **No sync noise** - rewrites from backup and sync tools are ignored.',
        '- **Safe by design** - only your date properties change; nothing else is touched.',
        '- **Works everywhere** - desktop and mobile, with no setup.',
        '',
        'Set the date format, timezone and tracked properties once, then forget it.',
        '',
      ].join('\n'),
    );

    await collapseSidebars();
    await openNote('Frontmatter Date Manager.md');
    await browser.pause(1200);
    await shot(
      '01-automatic-dates',
      'Created, updated and last-opened dates, maintained automatically',
      'Immune to sync noise from iCloud, Obsidian Sync, Dropbox and Git',
    );
  });

  it('02: bulk-date an existing vault, safely, with a preview', async function () {
    await setSettings({
      enableAutoUpdate: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      timezone: '',
      enableNumberProperties: false,
      filterRules: 'note.md', // drop the seed fixture from this curated table
    });

    // Notes with no dates yet get them filled in; notes that already have dates
    // are left untouched (shown as "skipped"), demonstrating the safe default.
    const missing = [
      'Notes/Weekly review.md',
      'Notes/Reading list.md',
      'Notes/Trip planning.md',
      'Inbox/Quick capture.md',
      'Projects/Q3 roadmap.md',
      'Projects/Backlog.md',
    ];
    for (const path of missing) {
      await mkNote(
        path,
        `---\ntitle: ${path.split('/')[1]?.replace('.md', '')}\n---\n\n# ${path.split('/')[1]?.replace('.md', '')}\n\nThis note has no dates yet.\n`,
      );
    }
    const hasDates: Array<[string, string, string]> = [
      [
        'Reference/Style guide.md',
        '2021-03-04T10:00:00',
        '2023-09-12T14:30:00',
      ],
      ['Reference/Glossary.md', '2020-11-20T08:15:00', '2024-02-01T19:05:00'],
    ];
    for (const [path, created, updated] of hasDates) {
      await mkNote(
        path,
        `---\ncreated: ${created}\nupdated: ${updated}\n---\n\nbody\n`,
      );
    }

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-populate');
    await bulkModal.select('frontmatter-date-manager-populate-mode', 'both');
    await bulkModal.select(
      'frontmatter-date-manager-populate-override',
      'fill-missing',
    );
    await bulkModal.clickPrimary(); // Scan & preview
    await bulkModal.waitForPreview();
    assert.ok(await bulkModal.previewVisible(), 'populate preview must render');
    await shot(
      '02-populate-vault',
      'Date an entire existing vault in one click',
      'Existing dates are never touched - every change shown in a preview',
    );

    await bulkModal.close();
    await settingsTab.close();
  });

  it('03: reformat mixed date formats, with the ambiguous-date guard', async function () {
    await setSettings({
      enableAutoUpdate: false,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO, // target format
      timezone: '',
      enableNumberProperties: false,
      filterRules: '',
    });

    // A spread of real-world formats the plugin auto-detects. The last one is a
    // genuinely ambiguous day/month value that the plugin refuses to guess.
    const notes: Array<[string, string]> = [
      ['Archive/2024 retrospective.md', '2024-11-03 09:12:40'],
      ['Archive/Conference notes.md', '03.11.2024 09:12'],
      ['Archive/Invoice draft.md', '12/25/2024'],
      ['Archive/Garden journal.md', '15.06.2026'],
      ['Archive/Legacy export.md', '1730625160'],
      ['Archive/Recipe collection.md', '2026/06/15 18:30'],
      ['Archive/Travel log.md', '01/05/2024'], // ambiguous -> left unchanged
    ];
    for (const [path, created] of notes) {
      await mkNote(
        path,
        `---\ncreated: ${created}\n---\n\n# ${path.split('/')[1]?.replace('.md', '')}\n\nbody\n`,
      );
    }

    await settingsTab.open();
    await settingsTab.openModal('frontmatter-date-manager-open-reformat');
    await bulkModal.select(
      'frontmatter-date-manager-reformat-scope',
      'created',
    );
    await bulkModal.clickPrimary(); // Scan & preview
    await bulkModal.waitForPreview();
    assert.ok(await bulkModal.previewVisible(), 'reformat preview must render');
    await shot(
      '03-reformat-dates',
      'Standardize every date format across your vault',
      'Ambiguous day/month dates are never guessed',
    );

    await bulkModal.close();
    await settingsTab.close();
  });

  it('04: organised, plain-language settings', async function () {
    await setSettings({
      enableCreateTime: true,
      enableModifiedTime: true,
      enableLastViewed: true,
      headerCreated: 'created',
      headerUpdated: 'updated',
      headerLastViewed: 'viewed',
      dateFormat: ISO,
      timezone: '',
    });

    await settingsTab.open();
    await browser.pause(900);
    await shot(
      '04-settings',
      'Organised, plain-language settings',
      'Formats, timezones and sync-safe change detection',
    );
    await settingsTab.close();
  });

  it('05: gitignore-style filter rules', async function () {
    await setSettings({
      enableAutoUpdate: true,
      headerCreated: 'created',
      headerUpdated: 'updated',
      dateFormat: ISO,
      timezone: '',
      filterRules: [
        '# Skip template and attachment folders',
        'templates/',
        'attachments/',
        '',
        '# Skip daily-note scratch space',
        'daily/**/*.md',
        '',
        '# Skip the whole archive, but keep one note',
        'Archive/',
        '!Archive/2024 retrospective.md',
        '',
        '# Skip Excalidraw and Canvas drawings',
        '**/*.excalidraw.md',
        '**/*.canvas',
      ].join('\n'),
    });

    await settingsTab.open();
    await browser.pause(500);
    await $('.frontmatter-date-manager-filter-setting').waitForExist({
      timeout: 5_000,
    });
    await scrollIntoViewInPage('.frontmatter-date-manager-filter-setting');
    await browser.pause(400);
    await shot(
      '05-filter-rules',
      'Choose exactly which notes get dates',
      'Gitignore-style rules: exclude folders, re-include exceptions, comment freely',
    );
    await settingsTab.close();
  });
});

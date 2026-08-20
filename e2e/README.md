# End-to-end tests (real Obsidian)

These tests drive a **real Obsidian** instance via WebdriverIO and
[`wdio-obsidian-service`](https://github.com/jesse-r-s-hines/wdio-obsidian-service).
The service downloads Obsidian, runs it in a sandbox, copies the vault fixture,
and installs + enables the built plugin. They are separate from the `vitest`
unit tests in `src/__tests__/` and are not run by `npm test`.

They exist to cover the seams a unit mock cannot reach: real
`processFrontMatter` serialization (body / key order / comments / unrelated
keys must survive), `number`-vs-`string` on disk, self-trigger suppression on a
real `mtime`, and the bulk-modal UI wiring (every bulk modal is driven through
real DOM clicks). Pure logic (format combinatorics, inversion math, filter
rules, pagination) is already covered by unit tests and is **not** re-tested
here.

## Scenarios

**Group A - auto / command path (no UI):**

- `specs/auto-stamp.e2e.ts`
  - A1 - data-safety: an edit auto-stamps `updated`, keeps `created`
    byte-for-byte, and leaves the body, unrelated keys, and a YAML comment
    intact.
  - A2 - serialization: epoch (`t`) format with number properties writes an
    **unquoted** number; ISO format writes a date-like **string**.
  - A3 - no re-stamp: the plugin's own write does not loop into a second stamp
    (`lastPluginWriteMtime` guards self-triggered `modify`).
- `specs/command-update.e2e.ts`
  - A4 - with auto-update OFF an edit must not stamp, but the
    "Update timestamps for current file" command does; `created` and body
    preserved.
- `specs/editor-safe-write.e2e.ts` - the single-file write into a **clean** open
  editor (the case the dirty-buffer guard lets through). Complements
  `editor-dirty-merge.e2e.ts`, which owns every dirty case.
  - E1 - a note open with a clean buffer is stamped; an unrelated property,
    `created`, the body, and the live editor's body text are all untouched.
  - E2 - the write reaches disk (`mtime` advances). The plugin no longer pins
    `{ ctime, mtime }`: the pin never stopped the merge, and it made a
    size-neutral re-stamp invisible to the open editor, which then reverted it.
- `specs/editor-dirty-merge.e2e.ts` - **regression net for issue #10** (the
  dirty-buffer write guard). Written as a reproduction suite: 9 of its 11
  scenarios failed on 1.2.1, which is what proved the bug causally; the other two
  are controls that had to stay green through the fix. Runs by default.

  Every scenario is causal, not symptomatic: `helpers/editorProbe.ts` wraps
  `fileManager.processFrontMatter` and records the `dirty` flag of every Markdown
  leaf showing the file **at the moment of each call**. The shared invariant is
  _never call `processFrontMatter` while any leaf showing that file has unsaved
  changes_ - asserting only "no merge notice appeared" would green just as
  happily when the plugin never wrote at all. Scenarios that must drive UI use
  `holdBufferDirty`, a simulated typist (patching `TextFileView.save` does not
  work: the autosave debounce binds the original method at construction).

  The nine that failed on 1.2.1 (each recorded `dirty:[true]` at the write):
  - D1 - the ordinary automatic `modify` path.
  - D1R - the human-faithful variant: continuous real typing. Also asserts every
    typed character survives (it does today; the merge notice still appears).
  - D2 - the default 5 s `delayForNewFiles` create window: the real first-write
    path on a genuinely new note.
  - D3 - the manual command with the wikilink suggester open on a real match;
    plus a control that the deferred stamp lands once the buffer is clean.
  - D4 - `viewed` on file-open while _another_ leaf of the same file is dirty;
    plus a control that a clean note still gets stamped.
  - D5 - a bulk reformat run (UI-driven) against a dirty open note, which must
    now be skipped visibly; the control is a second, clean note that must still
    be reformatted in the same run.
  - D6 - the rate-limited `retryAfterMs` path, with the edit counter enabled.
  - D7 - the inversion notice, which used to announce a fix before any write.
  - D9 - with the old pinned `mtime`, a same-length re-stamp emitted no vault
    event at all, so the editor never learned about the write and its next save
    silently reverted the stamp. The failure message reports the whole mechanism
    at once: unchanged size, unmoved mtime, no `modify` event, and a buffer that
    never received the new value.

  The two controls, green before and after the fix:
  - D8 - a note open in _reading_ mode has no buffer to protect and must still
    be stamped promptly (guards against a guard phrased as "the file is open"
    rather than "a buffer has unsaved changes").
  - D10 - a size-changing re-stamp (variable-width `dateFormat`) does reach the
    editor and survives its next save, so the D9 defect is specific to the
    size-neutral case.

- `specs/update-count.e2e.ts`
  - UC1 - first counted edit writes `updated_count: 1` as a **native unquoted
    number**, co-located with the bumped `updated`; `created`, an unrelated key,
    and the body survive.
  - UC2 - an existing count increments by exactly one (4 -> 5).
  - UC3 - R11 stale-base: an externally-set `updated_count: 45` is read from disk
    and increments to `46` (native number), not clobbered from a stale cache.
  - UC4 - with the counter OFF an edit never writes `updated_count`.
- `specs/external-fresh-updated.e2e.ts`
  - F1 - freshness / no-op-write guard: an external write that changes the body
    **and** carries a fresh, correctly-formatted `updated` is preserved
    byte-for-byte - FDM detects the change (a `modify` probe proves the event
    fired) but does not re-stamp; `mtime` is unchanged (no redundant write).
  - F2 - control: an external body-only edit that leaves a **stale** `updated`
    is re-stamped to a current value **exactly once** (no self-trigger loop);
    `created` and the new body survive.

**Group B - bulk operations (full UI-driven, all five modals):**

- `specs/bulk-populate.e2e.ts` - fill-missing (blue Run) and overwrite-all
  (red Run), preview table renders, unrelated keys/body intact.
- `specs/bulk-rename.e2e.ts` - rename a key across files, value preserved.
- `specs/bulk-reformat.e2e.ts` - rewrite an existing date into the configured
  format (always-red Run).
- `specs/bulk-inversions.e2e.ts` - auto-scan on open, Run disabled until a
  strategy is picked, then the inversion is fixed.
- `specs/bulk-rebuild-cache.e2e.ts` - non-destructive confirm screen; notes are
  not mutated.

**Group C - settings UI:**

- `specs/settings-exclude-list.e2e.ts` - "Ignore these properties" (native
  Obsidian 1.13 `type: 'list'` control): a comma-separated entry splits into
  separate list rows (S1), input dedupes against existing keys and drops
  empty segments (S2), and a row's native delete control removes a single key
  (S3). S1 and S3 also pin the render-row cleanup invariant: an in-place
  `update()` (add/delete commits) must not duplicate `settingEl` children
  (asserted via a single `-plugin-description` element).

**Group D - real Excalidraw integration (`specs/excalidraw.e2e.ts`):**

The only spec that drives a THIRD-PARTY plugin: `wdio.conf.mts` installs the
real `obsidian-excalidraw-plugin` (pinned to `2.26.4`) as an installed-but-
DISABLED community plugin, and this spec enables it in `before` / disables it in
`after`, so every other spec runs exactly as before. The first run downloads the
release into `e2e/.obsidian-cache/` (network required).

Why it exists: drawings are ordinary `.md` notes with an `excalidraw-plugin`
property, and Excalidraw answers an external write into a drawing that has been
dirty for > 5 minutes with `reload(true)` + `clearDirty()` - discarding unsaved
strokes. No mock can reproduce that; this spec is where the drawing-aware write
guard (`getWriteBlock`) is proven against the real thing.

- X1 closed drawing gets `created`/`updated` from the manual command; the
  `# Excalidraw Data` payload stays byte-identical and the scene still loads.
- X2 with `trackExcalidraw: false` the command explains the exclusion and writes
  nothing.
- X3 an unchanged tracked drawing answers honestly (hash gate or freshness
  guard) and never claims a false "Timestamps updated".
- X4 an Excalidraw save stamps `updated`; a following no-op save does NOT revert
  it, and no "modified externally" notice appears.
- X5 panning the canvas does not move the date.
- X6 a dirty drawing blocks the write (`getWriteBlock` -> `'excalidraw'`, the
  pass returns `blocked` and writes nothing, the command says so), and the
  stamp lands after Excalidraw saves - modify-driven, no polling.
- X7 **the core safety scenario**: for a drawing dirty for > 5 min (via
  `ageDrawing`) the shared write gate blocks, nothing is written, and the
  unsaved rectangle survives. X7b is the control (saved drawing -> a real bulk
  run writes, scene and payload intact).
- X8 the last-opened date is never written to a drawing (a plain note still
  gets it).
- X9 Rename key covers drawings even with the toggle off (documented contract).
- X10 filter rules still exclude a drawing while tracking is on.
- X11 the marker is honoured with Excalidraw disabled (detection reads
  `metadataCache`, not the `ExcalidrawAutomate` global).

Two Excalidraw behaviours shape how these are written, and both bit earlier
drafts of this spec:

- **Excalidraw force-saves on a window `blur`** (`registerDomEvent(ownerWindow,
  "blur", ... -> forceSave)`), ignoring its own autosave setting. So a scenario
  cannot keep a drawing dirty while clicking through modal UI - the click blurs
  the window and cleans the state under test. That is why X6/X7 assert on
  `fdmWriteBlock` / `fdmHandleFileChange` (the exact gate `applyFrontmatterWrite`
  consults) instead of driving the bulk modal; the modal's skipped-table UI is
  covered for Markdown notes by `editor-dirty-merge.e2e.ts` (D5). Scenarios that
  need a dirty drawing also call `setExcalidrawAutosave(false)` and re-arm
  `markDrawingDirty()` right before each assertion; the spec's `afterEach`
  restores autosave, `filterRules` and the toggle so a mid-scenario failure
  cannot poison the rest of the file.
- **A dirty view and a mid-save view are different blocks.** `saving`/
  `autosaving` yields `'excalidraw-busy'`, which DEFERS on the normal timer;
  only a dirty (or unverifiable) view drops the pass. X6 asserts the dirty
  path; the busy path is unit-tested.
- **The hash gate runs before the write guard.** Once a file's hash is cached
  and its on-disk body is unchanged, `shouldFileBeIgnored` answers `unchanged`
  and the guard is never consulted (correct - there is nothing to write). X6
  therefore dirties the drawing BEFORE it ever gets a cache entry.

All Excalidraw coupling lives in `helpers/excalidraw.ts` (create/open drawings
via `ExcalidrawAutomate`, `addRectToOpenDrawing`, `forceSaveDrawing`,
`isDrawingDirty`, `markDrawingDirty`, `ageDrawing`, `sceneElementCount`,
`panZoomDrawing`, `setExcalidrawAutosave`, plus `fdmWriteBlock` /
`fdmHandleFileChange` for gate-level assertions).

**Marketing screenshots (manual; NOT a test):** `specs/marketing-screenshots.e2e.ts`
generates the README / store screenshots (`make screenshots` - runs the spec, then
downscales to the Obsidian store spec of exactly 1200x800, 3:2).
The behind-the-scenes - the shots, the caption banner, the Electron gotchas, and
when to refresh them - lives in `CLAUDE.md` under "Store screenshots (marketing)".

## Layout

- `wdio.conf.mts` - WebdriverIO config (Obsidian capability, vault, plugin path).
- `vaults/simple/note.md` - seed vault fixture (tests create their own notes
  per-test via the real vault API and assert only on those).
- `helpers/` - `frontmatter.ts` (raw-text parsing for assertions), `vault.ts`
  (per-test note create/read/append + `waitForKey`), `settings.ts`
  (programmatic plugin-settings patch).
- `pageobjects/` - `settingsTab.ts` (forces `settingsPopoutWindow=false` via
  vault config so Obsidian 1.13's settings open in-window instead of a
  separate OS window - required for every selector below to stay in the main
  webdriver context; opens settings, clicks a bulk button by its stable
  class, drives the "Ignore these properties" native list - comma input +
  rows, and `openSubPage(name)`/`backFromSubPage()` to navigate the
  declarative Filter rules / Advanced sub-pages by their visible row name,
  the only way to reach them since sub-pages carry no class hook) and
  `bulkModal.ts` (drive the shared `PhaseModal` chrome: dropdowns,
  primary/footer buttons, preview table, pager). All DOM coupling lives
  here, so a UI drift is fixed in one place. Interaction is visible-element-
  only throughout - the settings modal keeps other tabs'/pages' DOM around
  hidden, so helpers filter to `isDisplayed()` elements before clicking.
- `tsconfig.json` - types for the specs; type-checked by `npm run typecheck:e2e`.

## Run

```bash
npm run test:e2e     # builds the plugin (dist/) first, then runs every spec
```

Run a single spec (faster while iterating - build once, then run one file):

```bash
npm run build
npx wdio run e2e/wdio.conf.mts --spec e2e/specs/auto-stamp.e2e.ts
```

Type-check the specs/page objects without launching Obsidian (cheap; part of
`make pre-commit`):

```bash
npm run typecheck:e2e
```

Requirements:

- Network access (Obsidian is downloaded on first run and cached under
  `e2e/.obsidian-cache/`, gitignored).
- A display server. On headless Linux/CI wrap with `xvfb-run -a npm run test:e2e`
  (or enable WebdriverIO's `autoXvfb`).

## When these run

**Locally, by hand, before a release - they are not part of CI.** The trade-off
is deliberate (see `docs/superpowers/specs/2026-06-07-e2e-tests-design.md`): the
full UI-driven suite is most valuable when run consciously, where selector drift
surfaces immediately and is fixed on the spot, rather than silently rotting in a
pipeline.

### Before release

- [ ] Run `npm run test:e2e` locally and confirm all Group A-D specs pass.

## Notes

- `installerVersion: 'earliest'` / `browserVersion: 'latest'` pick the Obsidian
  app/installer pair. Override the matrix with the `OBSIDIAN_VERSIONS` env var,
  e.g. `OBSIDIAN_VERSIONS='latest/latest 1.4.11/earliest' npm run test:e2e`.
- Testing Obsidian **beta** builds needs an Insider (Catalyst) account via
  `OBSIDIAN_EMAIL` / `OBSIDIAN_PASSWORD` env vars (2FA disabled).
- The plugin is loaded from `dist/` - make sure it is built (the `test:e2e`
  script does this for you).
- These tests are **characterization** tests: they assert the plugin's existing
  behavior, so a fresh spec should pass on its first run. A failure means a real
  bug/regression or an Obsidian serialization quirk - investigate the root cause
  before weakening any assertion (and never weaken the `created`/`updated`/body
  safety assertions).

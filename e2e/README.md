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

- `specs/settings-exclude-chips.e2e.ts` - "Ignore these properties": a
  comma-separated entry splits into separate chips (S1), input dedupes against
  existing keys and drops empty segments (S2), and a chip's remove control
  deletes a single key (S3).

## Layout

- `wdio.conf.mts` - WebdriverIO config (Obsidian capability, vault, plugin path).
- `vaults/simple/note.md` - seed vault fixture (tests create their own notes
  per-test via the real vault API and assert only on those).
- `helpers/` - `frontmatter.ts` (raw-text parsing for assertions), `vault.ts`
  (per-test note create/read/append + `waitForKey`), `settings.ts`
  (programmatic plugin-settings patch).
- `pageobjects/` - `settingsTab.ts` (open settings, click a bulk button by its
  stable class, and drive the "Ignore these properties" exclude list - comma
  input + chips) and `bulkModal.ts` (drive the shared `PhaseModal` chrome:
  dropdowns, primary/footer buttons, preview table, pager). All DOM coupling
  lives here, so a UI drift is fixed in one place.
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

- [ ] Run `npm run test:e2e` locally and confirm all Group A and Group B specs
      pass.

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

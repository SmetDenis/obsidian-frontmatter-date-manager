# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian plugin that automatically maintains frontmatter date properties — `created` (on file creation), `updated` (on edit), and `viewed` (last-viewed, stamped on file open; opt-in, disabled by default) — and provides bulk tools to populate timestamps from filesystem dates, rename keys, reformat date strings, and detect/fix `updated < created` inversions across a vault.

**Target: Obsidian v1.4.11+** (`minAppVersion` in manifest.json). The public stable Obsidian release is the 1.12.x line; 1.13.0 is early-access (insider-only). Do NOT adopt 1.13+ APIs (e.g. `getSettingDefinitions()`, `ButtonComponent.setDestructive()`) or bump `obsidian` types past `~1.12.3` until 1.13 ships publicly — doing so makes the plugin unusable on every public install and breaks the settings tab. The `obsidian` dev dependency is pinned to `~1.12.3` (tilde, not caret) to prevent `npm` from pulling the early-access 1.13 types.

## Safety first (core principle)

The user's notes are irreplaceable — never corrupt, lose, or reorder note data. Every change to a vault file must be the smallest, safest mutation that achieves the goal; when a write is uncertain or unnecessary, do nothing. This invariant outranks any feature. Concretely:

- **Mutate frontmatter only through `app.fileManager.processFrontMatter()`** — never hand-write note files (no whole-file `vault.modify`, no string-replacing YAML). This preserves the body, key order, comments, and unrelated keys.
- **Touch only the configured keys.** Leave all other frontmatter and the entire note body untouched.
- **Write only on a real, detected change** — never an unconditional or no-op write. Respect the hash-gated pipeline (see Key Patterns); needless writes churn `mtime` and fight sync.
- **Never guess-and-overwrite a value you can't safely parse.** Disambiguate ambiguous input (e.g. epoch seconds-vs-ms via `epochNumberToDate`); if a date can't be parsed safely, leave it unchanged rather than corrupt it.
- **New mutation / bulk / "fix" paths are opt-in and safe-by-default:** default new fix strategies to disabled, default bulk operations to fill-missing (not overwrite), and require a mandatory dry-run preview plus a red Run button with explicit irreversibility wording for anything destructive (see Destructive operation UX).

## Obsidian API — IMPORTANT

Claude's training knowledge about the Obsidian plugin API is outdated. **Always** use context7 MCP and official Obsidian developer documentation to verify API signatures, available methods, and current patterns before writing or modifying plugin code. Do not rely on memory — check the docs. Likewise, before bumping or trusting a pinned version, verify the **currently published** versions of the `obsidian` types and `eslint-plugin-obsidianmd` (the community review linter) against npm — the review bot always runs the latest linter, so a stale local pin can let new rule violations slip through.

Key Obsidian API used in this plugin:
- `Plugin` lifecycle: `onload()`, `onunload()`
- Vault events: `app.vault.on('modify' | 'create' | 'rename' | 'delete', ...)`
- Frontmatter: `app.fileManager.processFrontMatter(file, callback, options)`
- Data persistence: `Plugin.loadData()` / `Plugin.saveData()`
- UI: `PluginSettingTab`, `Setting`, `Modal`, `Notice`, `AbstractInputSuggest`
- Status bar: `Plugin.addStatusBarItem()`

## Build & Dev Commands

```bash
make                  # Show all available commands
make install          # Install dependencies (npm ci)
make build            # Type-check + production build → dist/
make dev              # Dev mode with watch (esbuild + CSS + optional vault sync)
make lint             # ESLint with eslint-plugin-obsidianmd (matches community review bot)
make format-check     # Prettier check
make format           # Prettier fix
make test             # Run all tests (vitest)
make test-watch       # Run tests in watch mode
make pre-commit       # Run all checks: format, lint, test, build
make local-test       # Build and copy plugin to local Obsidian vault
```

Run a single test file: `npm test -- src/__tests__/formatDate.test.ts`

### Local vault testing

Set the `OBSIDIAN_VAULT_TEST` env var in your shell to your vault path. `make local-test` builds the plugin and copies artifacts to `<vault>/.obsidian/plugins/frontmatter-date-manager/`. `make dev` uses the same variable for auto-copy on file changes.

## Build Output

esbuild bundles `src/main.ts` → `dist/main.js` (CJS, ES2018 target). `manifest.json` is copied to `dist/`. CSS from `styles.css` is processed with lightningcss → `dist/styles.css`. The `__DEV_MODE__` global is `true` in dev, `false` in production (controls console logging).

## Architecture

- **`src/main.ts`** — `FrontmatterDateManagerPlugin` (extends `Plugin`). Entry point. Handles vault events (`modify`, `create`, `rename`, `delete`) plus the workspace `file-open` event via `handleFileOpen()`, which stamps the `viewed`/last-viewed key when that feature is enabled. Per-file debouncing (2s). SHA-256 content hashing to detect real changes. Hash cache persisted to `hash-cache.json` with LRU eviction, debounced flushing, GC on startup, auto-population, and pruning of invalid/old-format cache entries on load. Pause/resume with countdown timer and status bar indicator (clicking the status bar toggles auto-update). `onExternalSettingsChange()` reloads settings when `data.json` is changed externally (e.g. by sync). Three commands: `update-timestamps-current-file`, `toggle-auto-update`, `pause-auto-update`. Uses `processingFiles` Set to prevent concurrent modifications of the same file. `log()` and `logError()` are public methods gated behind `__DEV_MODE__` — used by modals and other files for dev-only logging.
- **`src/filterRules.ts`** — Gitignore-style filter rule engine. Pure functions, no Obsidian dependency. `parseFilterRules(text)` parses multiline text into `FilterRule[]` with validation errors. `isFileExcluded(filePath, rules)` applies rules top-to-bottom (last match wins).
- **`src/Settings.ts`** — `FrontmatterDateManagerSettings` interface + `FrontmatterDateManagerSettingsTab` (settings UI). `HashTrackingMode` type (`'body'` | `'frontmatter'` | `'both'`). The UI is organized into sections (in `display()` order): **Timestamp fields** (enable toggle + key name for `created`, `updated`, and `viewed`/last-viewed), **Date formatting** (date format, timezone, number-property toggle), **Behavior** (auto-update toggle, min time between saves, gitignore-style filter rules with live preview, content hash check toggle + hash tracking mode dropdown + frontmatter key exclusion list), **Timestamp inversion** (fix strategy + tolerance), an **Advanced** collapsible (delay for new files, hash cache auto-populate + max size, post-update command), and **Bulk operations** (buttons that open the bulk modals). Uses the imperative `display()` render method (required by the public 1.12.x API; `display()` is only deprecated in early-access 1.13+).
- **`src/bulk/`** — Shared building blocks composed by all five bulk modals (there is no longer a `BaseBulkModal`). `write.ts` (`applyFrontmatterWrite(app, plugin, file, mutator)` — the one safe frontmatter mutation: `processFrontMatter` without `{ctime,mtime}`, then `lastPluginWriteMtime` + hash-cache refresh), `scan.ts` (`runBatchedScan` — batched per-file compute with progress + abort, yields every `SCAN_BATCH_SIZE`=50 files), `executePhase.ts` (`runExecutePhase` — execute loop that owns `bulkRunning`, counts per-file errors without aborting, **collects each failure as `{label, message}` in `result.failures`** so the modal can show the user which files failed and why — `logError` is a no-op in production, so the console cannot carry these details; supports abort + `onComplete`), `chrome.ts` (shared render helpers `renderHeader`/`renderButtonBar`/`renderWarning`/`renderSummary`/`renderPaginatedDiffTable`/`renderCopyPreviewButton`/`renderFailureTable`/`renderProgress` + `PREVIEW_MAX_ROWS`=100, now the table page size; `renderFailureTable` renders `result.failures` as a paginated `File | Error` table + Copy), `pagination.ts` (pure `getPageCount`/`clampPage`/`getPageSlice` page math — unit-tested), `export.ts` (pure `toTSV` + `copyPreviewToClipboard` — TSV to clipboard, no vault file), and `PhaseModal.ts` (thin `Modal` subclass: phase navigation `goTo`/`back`/`isOpenState` only — no operation logic). `renderPaginatedDiffTable` shows the FULL diff a page at a time (Prev / "Page X of Y" / Next, pager hidden at ≤1 page; only the current page's tbody lives in the DOM), so no row cap hides changes; it re-renders only the tbody + pager on page change. DOM rendering in `chrome.ts`/`PhaseModal` is not unit-tested (the `obsidian` mock no-ops DOM); the testable seams are `write.ts`, `scan.ts`, `executePhase.ts`, `pagination.ts`, `export.ts`, and each modal's `compute*`/`rebuildAll` methods.
- **`src/UpdateAllCacheData.ts`** — Modal (extends `PhaseModal`) for rebuilding the SHA-256 hash cache for all files. Non-destructive: a confirm screen (file count, blue Run, disabled at 0 files) → execute. Uses `populateCacheForFileDirect` per file and an `onComplete` that evicts + marks dirty + flushes; the rebuild core is the testable `rebuildAll()` method.
- **`src/BulkPopulateTimestampsModal.ts`** — Wizard modal for bulk-populating frontmatter timestamps from filesystem dates (`ctime`/`mtime`). Three-phase flow: configure (mode/override selection + platform warnings) → preview (dry-run with paginated full-diff table + copy full preview) → execute (progress bar). Supports `PopulateMode` (`'created'`|`'updated'`|`'both'`) and `OverrideMode` (`'fill-missing'`|`'overwrite-all'`). Uses `Platform.*` API for platform-specific ctime reliability warnings. Extends `PhaseModal` and composes the `src/bulk/` blocks.
- **`src/RenameKeyModal.ts`** — Wizard modal for renaming frontmatter keys across all files. Three-phase flow: configure (old/new key names + delete toggle) → preview (paginated full-diff table with conflict detection + copy full preview) → execute (processFrontMatter rename + optional delete). Scans ALL markdown files (`vault.getMarkdownFiles()`), not just filter-eligible ones. Extends `PhaseModal` and composes the `src/bulk/` blocks.
- **`src/inversionDetection.ts`** — Pure functions for detecting `updated < created` inversions and computing fixes. `isInversion(created, updated, toleranceSec)` is symmetric and tolerance-aware; `applyInversionFix(strategy, sources)` returns new Date objects per the strategy (`created-to-updated`, `updated-to-created`, `max-all`). No Obsidian dependency.
- **`src/FindInversionsModal.ts`** — Bulk modal (extends `PhaseModal`). Detection-first and dual-purpose (report + fixer): opens straight into a preview that auto-scans via `runBatchedScan` (per-file `computeInvertedForFile` runs inside the batch so large vaults don't freeze), then shows the paginated full inversion table (`renderPaginatedDiffTable`, Δ column accent via `columnClasses`) + copy full preview + an inline strategy dropdown + tolerance hint, with a red `Run` disabled until a non-`disabled` strategy is chosen (no Configure phase, no Back). Changing the strategy refreshes only the warning + Run button, never the table, so the current page is preserved. `computeInvertedFiles` delegates to `computeInvertedForFile` (both covered by tests). `processFile` applies the selected strategy and writes via `applyFrontmatterWrite`.
- **`src/ReformatDateModal.ts`** — Wizard modal for standardizing date formats across all files. Three-phase flow: configure (target format display + scope dropdown) → preview (auto-detect existing formats, show conversions in a paginated full-diff table + copy full preview) → execute (processFrontMatter rewrite). Has public `tryParseDate()` that auto-detects formats via `parseISO`, common date-fns format strings, and native `Date()` fallback. Extends `PhaseModal` and composes the `src/bulk/` blocks; its Run is unconditionally red (it always rewrites existing date values in place).
- **`src/suggesters/`** — Input autocomplete using Obsidian's `AbstractInputSuggest`. `TimezoneSuggest` for IANA timezones.
- **`src/utils.ts`** — `isTFile` type guard, `onlyUniqueArray` filter, `isGlobPattern` detector, `matchesPathPattern` (picomatch for globs, prefix match for plain folder names), `getMomentFormatHint` (detects Moment.js tokens and suggests date-fns equivalents), `epochNumberToDate` (seconds-vs-ms disambiguation, see Key Patterns), `errorToMessage` (`Error.message`, else `String(e)` — used to surface failure reasons to the user instead of the dev-only `logError`), `__DEV_MODE__` global declaration.
- **`src/picomatch.d.ts`** — Type declarations for `picomatch/posix` module.

### Key Patterns

**File modification pipeline** (spans `main.ts`):
vault `modify` event → per-file debounce (2s) → `processFileWithLock()` → ignore checks (gitignore-style filter rules via `isFileExcluded()`) → read file → `getContentForHashing()` (body/frontmatter/both per `hashTrackingMode`) → SHA-256 hash → compare with cache → if changed: `computeFrontmatterUpdates()` → `processFrontMatter()` → re-hash updated file → mark cache dirty → debounced cache flush to disk. When `minSecondsBetweenSaves` blocks an otherwise-needed update, `computeFrontmatterUpdates()` returns `retryAfterMs`, the hash is deliberately NOT cached, and a retry is scheduled so the still-pending change is re-detected.

**Self-triggered modify event detection** (`main.ts`):
Never pass `{ ctime, mtime }` to `processFrontMatter()` to preserve timestamps — it prevents Obsidian's editor from reflecting changes (the editor doesn't re-render if mtime is unchanged). Instead, call `processFrontMatter()` without the options argument and use `lastPluginWriteMtime` Map to detect and skip self-triggered modify events: store `file.stat.mtime` immediately after the write, then check it in `handleFileChange` before processing. This pattern applies to ALL automated `processFrontMatter` calls (`handleFileChange`, `handleFileOpen`) **and to every bulk modal write** — every bulk modal writes through the single canonical `applyFrontmatterWrite()` (`src/bulk/write.ts`), which omits `{ ctime, mtime }`, sets `lastPluginWriteMtime`, then refreshes the hash cache via `populateCacheForFile`. Preserving mtime is forbidden even for bulk operations: it stops an open editor from re-rendering the change and leaves the hash cache stale, which lets a self-triggered modify event that escapes the `bulkRunning` window spuriously re-stamp `updated`. `bulkRunning` alone is insufficient because those events arrive asynchronously (after the modify debounce), often once `bulkRunning` has already reset to `false`.

**Inversion prevention** (`main.ts` in `computeFrontmatterUpdates`):
After computing candidate `createdValue`/`updatedValue`, check the final pair (falling back to existing frontmatter values). If `isInversion()` returns true under the configured tolerance, apply `applyInversionFix()` with the configured strategy and show a one-time-per-session Notice via `showInversionNoticeOnce()`. Default strategy is `disabled` — the prevention block is no-op for existing users until they opt in.

**Numeric epoch units — seconds vs. milliseconds** (`utils.ts` `epochNumberToDate`):
Epoch numbers arrive in two units — `file.stat.*` and `T`-format are ms, `t`-format is seconds — but `new Date(n)` assumes ms, so raw seconds (~1.7e9) resolve to ~1970 and corrupt `t`-format vaults. Always parse via `epochNumberToDate()` (disambiguates by magnitude, `< 1e11` → seconds), never bare `new Date(n)`. Used by `parseDate` and `ReformatDateModal.tryParseDate`.

**File filtering** (`filterRules.ts` + `utils.ts`):
Single `filterRules` textarea with gitignore-style syntax. Lines are exclude patterns by default; `!` prefix re-includes; `#` for comments; last matching rule wins. Empty rules = all .md files tracked. `parseFilterRules()` parses text into `FilterRule[]` with error collection. `isFileExcluded()` evaluates rules top-to-bottom using `matchesPathPattern()` (picomatch for globs, prefix match for plain folder names). Compiled rules are cached in `_compiledRules` on the plugin instance and recompiled on settings change.

**Bulk operations and hash bypass** (`src/bulk/`, `main.ts`):
Bulk operations (populate from filesystem, rebuild cache, find inversions) skip the content hash check in `shouldFileBeIgnored()` by passing `{ skipHashCheck: true }` to `getAllFilesPossiblyAffected()` at the file-listing stage. The hash check exists only for automatic change detection on `modify` events — it must not filter files during intentional bulk processing. Per-file, the bulk modals write through `applyFrontmatterWrite` (never through `handleFileChange`), which sets `lastPluginWriteMtime` and refreshes the hash cache.

**Destructive operation UX**:
Every bulk operation that mutates note data must present a **mandatory dry-run preview** before any write — the user cannot reach Run without first seeing the exact diff. This preview is the primary safeguard, and it must show **every** changed row, not a truncated sample: the four diff modals render through `renderPaginatedDiffTable` (`src/bulk/chrome.ts`), which paginates the full in-memory diff (`PREVIEW_MAX_ROWS`=100 per page, Prev/Next pager) so large vaults stay responsive without hiding rows. Each also offers a neutral **Copy full preview** button (`renderCopyPreviewButton` → `copyPreviewToClipboard`, `src/bulk/export.ts`) that copies the complete diff as TSV to the clipboard — no vault file is written — placed between the table and the action bar. The three wizard modals (populate, rename, reformat) use a configure → preview → execute flow; find-inversions is detection-first (auto-scan on open, inline strategy, table on the same screen as Run); rebuild-cache is a non-destructive confirm screen. The unifying invariant: red iff the operation replaces or deletes existing user values; blue iff it only adds missing values or touches sidecar data. Destructive cases — overwrite-all populate, fix inversions, rename with delete/overwrite, and reformat (which always rewrites existing date strings in place, so its Run is unconditionally red) — must be red and restate the consequence at the point of action ("cannot be undone" / "irreversible"). Non-destructive modes (fill-missing populate, pure-copy rename, rebuild cache) stay blue. The Run button is rendered via `renderButtonBar({ primary: { destructive } })` (`src/bulk/chrome.ts`): `destructive: true` → red `.setWarning()`, `false` → blue `.setCta()`; each modal sets the flag from its selected mode (or unconditionally for the always-destructive operations). Bulk buttons are placed last in the settings section. Use `.setWarning()` for the red style — `ButtonComponent.setDestructive()` is 1.13-only and forbidden (see Target note). When an execute phase finishes with per-file errors, the modal must surface **which** files failed and **why** in-place via `renderFailureTable` (a paginated `File | Error` table + Copy) — never tell the user to "check the console", which is empty in production because `logError` is gated behind `__DEV_MODE__`. The single-file "Update timestamps for current file" command follows the same rule: it shows the real reason from `result.error` (via `errorToMessage`) in a `Notice`, not a console pointer.

**Hash cache lifecycle** (`main.ts`):
Stored in `hash-cache.json` as `Record<string, {hash, lastAccessed}>`. Loaded on startup with GC (removes entries for deleted files) and optional auto-population. Flushed to disk via debounced writes (30s debounce, 300s max delay). LRU eviction when exceeding configurable max size.

**Obsidian internal API access pattern**:
When accessing Obsidian APIs without public typings (e.g. `app.commands.executeCommandById`, `app.commands.commands`), use `unknown` intermediate cast — never `any`. Pattern: `const internalApp = this.app as unknown as { commands: { ... } };`. This satisfies both TypeScript and `@typescript-eslint/no-explicit-any`.

**`processFrontMatter` callback typing**:
The `frontmatter` parameter from `processFrontMatter()` is typed as `any` in Obsidian's API. Always annotate the callback parameter explicitly: `(frontmatter: Record<string, unknown>) => { ... }`. Similarly, `getFileCache()?.frontmatter` (typed as `FrontMatterCache` extending `Record<string, any>`) should be cast to `Record<string, unknown>` before accessing keys.

### UI & CSS conventions

Most of these are enforced automatically by `eslint-plugin-obsidianmd` plus the project rules in `eslint.config.mts` and `tsconfig.json` — run `make lint` and let it catch violations instead of memorizing the full list. Keep the non-obvious, project-specific points in mind:

- **CSS class prefix**: every class uses the `frontmatter-date-manager-` prefix, even when nested inside an already-prefixed parent.
- **Styling & colors**: use CSS classes + `toggleClass()` and Obsidian CSS variables (`var(--text-error)`, etc.) — never assign `element.style.*` or hardcode hex. Use `createEl()` / `createDiv()` / `createSpan()`, not `document.createElement()`.
- **Headings**: in the settings tab use `new Setting(el).setHeading()`, never `createEl('h1'..'h6')` (heading elements inside `Modal` subclasses are fine); never show the plugin name as a top-level settings heading.
- **Window timers**: always `window.setTimeout` / `clearTimeout` / `setInterval` / `clearInterval` — never bare globals, never `activeWindow.*`. Timer IDs are window-scoped and `registerInterval()` cleans up on the main window, so the `obsidianmd/prefer-window-timers` rule rejects `activeWindow.*`. The bare `setTimeout(resolve, 0)` inside `new Promise(...)` must also be `window.setTimeout`.
- **Console**: the project routes ALL logging through `plugin.log()` / `plugin.logError()` (gated behind `__DEV_MODE__`); no raw `console.*` in production paths. ESLint's `no-console` would still permit `warn`/`error`/`debug`, but the project convention is stricter.
- **Sentence case**: all UI text (`setName`/`setDesc`/`setText`/`setPlaceholder`/`setButtonText`) in sentence case; avoid proper nouns (keep lowercase if unavoidable, e.g. "daily notes").

Enforced by the linter/compiler — just satisfy `make lint`: no `any` (use `unknown` + narrowing), no floating promises (prefix `void`), `prefer-const`, `eqeqeq`, `??`/`??=` over `||`, `prefer-optional-chain` (no redundant `?.` on non-optional fields like `headerCreated` / `app.metadataCache`), `noUncheckedIndexedAccess` (`arr[i]` is `T | undefined`), and non-async `onunload()` (use `void this.method()` for async cleanup).

### Release

Release tags must be exact version numbers **without** `v` prefix (e.g. `1.0.0`, not `v1.0.0`). Obsidian requires this format to find release assets.

## Obsidian Community Plugin Review Requirements

This plugin targets the Obsidian community plugin store. All code changes must comply with the review process:

### Two-phase review
1. **Automated bot**: Validates `manifest.json` and runs `eslint-plugin-obsidianmd` (recommended ruleset). It re-runs when you push a new release, but the cadence is not guaranteed (rescans can lag by days). Replicate locally with `make lint`, and keep the linter at its latest published version (the bot always runs latest — see the API section).
2. **Human reviewer**: Checks CSS scoping, code patterns, security, UX. Review can take weeks to months (the queue is heavily backlogged); a stale bot may close long-inactive PRs. Exact thresholds change — consult the submission requirements doc rather than relying on fixed numbers here.

### Key ESLint rules (enforced by bot)
`eslint-plugin-obsidianmd` recommended config plus the overrides in `eslint.config.mts`; replicate the bot locally with `make lint`. The ones most likely to bite: `no-console` (route logging through `plugin.log()` / `plugin.logError()`), `no-explicit-any` (tests/mocks exempt), `no-floating-promises`, `settings-tab/no-manual-html-headings`, `ui/sentence-case`, `no-namespace` (use typed casts, not `declare namespace`).

### Reference links
- Official plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Submission requirements: https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins
- Developer policies: https://docs.obsidian.md/Developer+policies
- ESLint plugin: https://github.com/obsidianmd/eslint-plugin
- Sample plugin (reference implementation): https://github.com/obsidianmd/obsidian-sample-plugin
- Release repo: https://github.com/obsidianmd/obsidian-releases

## Key Dependencies

- **date-fns v4** + **@date-fns/tz** — Date formatting/parsing with timezone support via `TZDate`
- **js-sha256** — Content hashing for change detection (prevents false timestamp updates from sync plugins)
- **picomatch v4** — Glob pattern matching for folder include/exclude filters

## Pre-completion Check — MANDATORY

After finishing ANY task (feature, bugfix, refactor, test changes, etc.), **ALWAYS** run:

```bash
make pre-commit
```

If `format-check` fails, fix with `make format` and re-run. Do not consider the task done until all four checks pass.

After all checks pass, update documentation if the task changed user-facing behavior, settings, architecture, or key patterns:
- `README.md` — settings table, feature descriptions, examples
- `CLAUDE.md` — architecture section, key patterns, settings description

Update only the sections the change actually touches — don't refresh unrelated docs or restate what the code and tests already cover. Keep edits concise and proportional; do not pad with filler. When unsure whether a doc edit is warranted, ask the user before editing `CLAUDE.md` or `README.md`.

## Formatting

Prettier 3.x with: single quotes, semicolons, trailing commas (`all`), consistent quote props. Configured in `.prettierrc`.

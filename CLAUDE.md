# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian plugin that automatically maintains frontmatter date properties — `created` (on file creation), `updated` (on edit), and `viewed` (last-viewed, stamped on file open; opt-in, disabled by default) — and provides bulk tools to populate timestamps from filesystem dates, rename keys, reformat date strings, and detect/fix `updated < created` inversions across a vault.

**Target: Obsidian v1.4.11+** (`minAppVersion` in manifest.json). The public stable Obsidian release is the 1.12.x line; 1.13.0 is early-access (insider-only). Do NOT adopt 1.13+ APIs (e.g. `getSettingDefinitions()`, `ButtonComponent.setDestructive()`) or bump `obsidian` types past `~1.12.3` until 1.13 ships publicly — doing so makes the plugin unusable on every public install and breaks the settings tab. The `obsidian` dev dependency is pinned to `~1.12.3` (tilde, not caret) to prevent `npm` from pulling the early-access 1.13 types.

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

Set the `OBSIDIAN_VAULT` env var in your shell to your vault path. `make local-test` builds the plugin and copies artifacts to `<vault>/.obsidian/plugins/frontmatter-date-manager/`. `make dev` uses the same variable for auto-copy on file changes.

## Build Output

esbuild bundles `src/main.ts` → `dist/main.js` (CJS, ES2018 target). `manifest.json` is copied to `dist/`. CSS from `styles.css` is processed with lightningcss → `dist/styles.css`. The `__DEV_MODE__` global is `true` in dev, `false` in production (controls console logging).

## Architecture

- **`src/main.ts`** — `FrontmatterDateManagerPlugin` (extends `Plugin`). Entry point. Handles vault events (`modify`, `create`, `rename`, `delete`) plus the workspace `file-open` event via `handleFileOpen()`, which stamps the `viewed`/last-viewed key when that feature is enabled. Per-file debouncing (2s). SHA-256 content hashing to detect real changes. Hash cache persisted to `hash-cache.json` with LRU eviction, debounced flushing, GC on startup, auto-population, and pruning of invalid/old-format cache entries on load. Pause/resume with countdown timer and status bar indicator (clicking the status bar toggles auto-update). `onExternalSettingsChange()` reloads settings when `data.json` is changed externally (e.g. by sync). Three commands: `update-timestamps-current-file`, `toggle-auto-update`, `pause-auto-update`. Uses `processingFiles` Set to prevent concurrent modifications of the same file. `log()` and `logError()` are public methods gated behind `__DEV_MODE__` — used by modals and other files for dev-only logging.
- **`src/filterRules.ts`** — Gitignore-style filter rule engine. Pure functions, no Obsidian dependency. `parseFilterRules(text)` parses multiline text into `FilterRule[]` with validation errors. `isFileExcluded(filePath, rules)` applies rules top-to-bottom (last match wins).
- **`src/Settings.ts`** — `FrontmatterDateManagerSettings` interface + `FrontmatterDateManagerSettingsTab` (settings UI). `HashTrackingMode` type (`'body'` | `'frontmatter'` | `'both'`). The UI is organized into sections (in `display()` order): **Timestamp fields** (enable toggle + key name for `created`, `updated`, and `viewed`/last-viewed), **Date formatting** (date format, timezone, number-property toggle), **Behavior** (auto-update toggle, min time between saves, gitignore-style filter rules with live preview, content hash check toggle + hash tracking mode dropdown + frontmatter key exclusion list), **Timestamp inversion** (fix strategy + tolerance), an **Advanced** collapsible (delay for new files, hash cache auto-populate + max size, post-update command), and **Bulk operations** (buttons that open the bulk modals). Uses the imperative `display()` render method (required by the public 1.12.x API; `display()` is only deprecated in early-access 1.13+).
- **`src/BaseBulkModal.ts`** — Abstract base class for bulk file operations. Provides progress bar, error counting, Run/Cancel UI. Three optional hooks for richer modals: `narrowFiles(files)` (filter the scanned set after `getAllFilesPossiblyAffected`), `renderExtraSection(parent, files)` (inject custom UI between warning and Run/Cancel), `canRun(files)` (gate the Run button — default: non-empty list). Extended by `UpdateAllModal`, `UpdateAllCacheData`, and `FindInversionsModal`.
- **`src/UpdateAllModal.ts`** — Modal for bulk-updating all vault files' timestamps.
- **`src/UpdateAllCacheData.ts`** — Modal for populating/rebuilding SHA-256 hash cache for all files.
- **`src/BulkPopulateTimestampsModal.ts`** — Wizard modal for bulk-populating frontmatter timestamps from filesystem dates (`ctime`/`mtime`). Three-phase flow: configure (mode/override selection + platform warnings) → preview (dry-run with scrollable table) → execute (progress bar). Supports `PopulateMode` (`'created'`|`'updated'`|`'both'`) and `OverrideMode` (`'fill-missing'`|`'overwrite-all'`). Uses `Platform.*` API for platform-specific ctime reliability warnings. Does NOT extend `BaseBulkModal` (different wizard-based UI flow).
- **`src/RenameKeyModal.ts`** — Wizard modal for renaming frontmatter keys across all files. Three-phase flow: configure (old/new key names + delete toggle) → preview (scrollable table with conflict detection) → execute (processFrontMatter rename + optional delete). Scans ALL markdown files (`vault.getMarkdownFiles()`), not just filter-eligible ones. Does NOT extend `BaseBulkModal`.
- **`src/inversionDetection.ts`** — Pure functions for detecting `updated < created` inversions and computing fixes. `isInversion(created, updated, toleranceSec)` is symmetric and tolerance-aware; `applyInversionFix(strategy, sources)` returns new Date objects per the strategy (`created-to-updated`, `updated-to-created`, `max-all`). No Obsidian dependency.
- **`src/FindInversionsModal.ts`** — Bulk modal extending `BaseBulkModal`. Uses `narrowFiles` hook to read frontmatter via `metadataCache.getFileCache(file)` and keep only inverted entries; `renderExtraSection` adds the strategy dropdown and a preview table (top 50 rows). `processFile` applies the selected strategy via `processFrontMatter` and updates the hash cache + `lastPluginWriteMtime` like `handleFileChange`.
- **`src/ReformatDateModal.ts`** — Wizard modal for standardizing date formats across all files. Three-phase flow: configure (target format display + scope dropdown) → preview (auto-detect existing formats, show conversions) → execute (processFrontMatter rewrite). Has public `tryParseDate()` that auto-detects formats via `parseISO`, common date-fns format strings, and native `Date()` fallback. Does NOT extend `BaseBulkModal`.
- **`src/suggesters/`** — Input autocomplete using Obsidian's `AbstractInputSuggest`. `TimezoneSuggest` for IANA timezones.
- **`src/utils.ts`** — `isTFile` type guard, `onlyUniqueArray` filter, `isGlobPattern` detector, `matchesPathPattern` (picomatch for globs, prefix match for plain folder names), `getMomentFormatHint` (detects Moment.js tokens and suggests date-fns equivalents), `__DEV_MODE__` global declaration.
- **`src/picomatch.d.ts`** — Type declarations for `picomatch/posix` module.

### Key Patterns

**File modification pipeline** (spans `main.ts`):
vault `modify` event → per-file debounce (2s) → `processFileWithLock()` → ignore checks (gitignore-style filter rules via `isFileExcluded()`) → read file → `getContentForHashing()` (body/frontmatter/both per `hashTrackingMode`) → SHA-256 hash → compare with cache → if changed: `computeFrontmatterUpdates()` → `processFrontMatter()` → re-hash updated file → mark cache dirty → debounced cache flush to disk. When `minSecondsBetweenSaves` blocks an otherwise-needed update, `computeFrontmatterUpdates()` returns `retryAfterMs`, the hash is deliberately NOT cached, and a retry is scheduled so the still-pending change is re-detected.

**Self-triggered modify event detection** (`main.ts`):
Never pass `{ ctime, mtime }` to `processFrontMatter()` to preserve timestamps — it prevents Obsidian's editor from reflecting changes (the editor doesn't re-render if mtime is unchanged). Instead, call `processFrontMatter()` without the options argument and use `lastPluginWriteMtime` Map to detect and skip self-triggered modify events: store `file.stat.mtime` immediately after the write, then check it in `handleFileChange` before processing. This pattern applies to ALL automated `processFrontMatter` calls (`handleFileChange`, `handleFileOpen`). The `lastPluginWriteMtime` map is also written by bulk modals (`FindInversionsModal.processFile`) so their writes don't loop back through the modify handler.

**Inversion prevention** (`main.ts` in `computeFrontmatterUpdates`):
After computing candidate `createdValue`/`updatedValue`, check the final pair (falling back to existing frontmatter values). If `isInversion()` returns true under the configured tolerance, apply `applyInversionFix()` with the configured strategy and show a one-time-per-session Notice via `showInversionNoticeOnce()`. Default strategy is `disabled` — the prevention block is no-op for existing users until they opt in.

**File filtering** (`filterRules.ts` + `utils.ts`):
Single `filterRules` textarea with gitignore-style syntax. Lines are exclude patterns by default; `!` prefix re-includes; `#` for comments; last matching rule wins. Empty rules = all .md files tracked. `parseFilterRules()` parses text into `FilterRule[]` with error collection. `isFileExcluded()` evaluates rules top-to-bottom using `matchesPathPattern()` (picomatch for globs, prefix match for plain folder names). Compiled rules are cached in `_compiledRules` on the plugin instance and recompiled on settings change.

**Bulk operations and hash bypass** (`BaseBulkModal.ts`, `main.ts`):
All bulk operations (overwrite timestamps, populate from filesystem, rebuild cache) must skip the content hash check in `shouldFileBeIgnored()` via `skipHashCheck: true`. The hash check exists only for automatic change detection on `modify` events — it must not filter files during intentional bulk processing. Note the double-barrier: both the file listing (`getAllFilesPossiblyAffected`) and per-file processing (`handleFileChange`) call `shouldFileBeIgnored`, so `skipHashCheck` must be passed through both. The `BaseBulkModal` exposes `skipHashCheck()` (default `false`) for subclasses to override; `handleFileChange` auto-skips hash when `triggerSource === 'bulk'`.

**Destructive operation UX**:
Buttons that mass-modify data must use `.setWarning()` (red), clearly state consequences ("permanently lost", "irreversible"), require typed confirmation (via `getConfirmationPrompt()` in `BaseBulkModal`), and be placed last in the settings section.

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

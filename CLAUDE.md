# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian plugin that automatically updates frontmatter `created` and `updated` timestamps when files are edited.

**Target: Obsidian v1.4.11+** (`minAppVersion` in manifest.json).

## Obsidian API — IMPORTANT

Claude's training knowledge about the Obsidian plugin API is outdated. **Always** use context7 MCP and official Obsidian developer documentation to verify API signatures, available methods, and current patterns before writing or modifying plugin code. Do not rely on memory — check the docs.

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

Set `OBSIDIAN_VAULT` env var (or `.env` file, see `.env.example`) to your vault path. `make local-test` builds the plugin and copies artifacts to `<vault>/.obsidian/plugins/frontmatter-date-manager/`. `make dev` uses the same variable for auto-copy on file changes.

## Build Output

esbuild bundles `src/main.ts` → `dist/main.js` (CJS, ES2018 target). `manifest.json` is copied to `dist/`. CSS from `styles.css` is processed with lightningcss → `dist/styles.css`. The `__DEV_MODE__` global is `true` in dev, `false` in production (controls console logging).

## Architecture

- **`src/main.ts`** — `FrontmatterDateManagerPlugin` (extends `Plugin`). Entry point. Handles vault events (`modify`, `create`, `rename`, `delete`). Per-file debouncing (2s). SHA-256 content hashing to detect real changes. Hash cache persisted to `hash-cache.json` with LRU eviction, debounced flushing, GC on startup, auto-population, and format migration. Pause/resume with countdown timer and status bar indicator. Three commands: `update-timestamps-current-file`, `toggle-auto-update`, `pause-auto-update`. Uses `processingFiles` Set to prevent concurrent modifications of the same file. `log()` and `logError()` are public methods gated behind `__DEV_MODE__` — used by modals and other files for dev-only logging.
- **`src/filterRules.ts`** — Gitignore-style filter rule engine. Pure functions, no Obsidian dependency. `parseFilterRules(text)` parses multiline text into `FilterRule[]` with validation errors. `isFileExcluded(filePath, rules)` applies rules top-to-bottom (last match wins).
- **`src/Settings.ts`** — `FrontmatterDateManagerSettings` interface + `FrontmatterDateManagerSettingsTab` (settings UI). `HashTrackingMode` type (`'body'` | `'frontmatter'` | `'both'`). Manages date format, timezone, frontmatter key names, gitignore-style filter rules (textarea with preview), min time between saves, delay for new files, number property toggle, content hash check toggle, hash tracking mode dropdown, frontmatter key exclusion list, hash cache settings, post-update command.
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
vault `modify` event → per-file debounce (2s) → `processFileWithLock()` → ignore checks (gitignore-style filter rules via `isFileExcluded()`) → read file → `getContentForHashing()` (body/frontmatter/both per `hashTrackingMode`) → SHA-256 hash → compare with cache → if changed: `computeFrontmatterUpdates()` → `processFrontMatter()` → re-hash updated file → mark cache dirty → debounced cache flush to disk.

**Self-triggered modify event detection** (`main.ts`):
Never pass `{ ctime, mtime }` to `processFrontMatter()` to preserve timestamps — it prevents Obsidian's editor from reflecting changes (the editor doesn't re-render if mtime is unchanged). Instead, call `processFrontMatter()` without the options argument and use `lastPluginWriteMtime` Map to detect and skip self-triggered modify events: store `file.stat.mtime` immediately after the write, then check it in `handleFileChange` before processing. This pattern applies to ALL automated `processFrontMatter` calls (`handleFileChange`, `handleFileOpen`).

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

### UI & CSS Conventions

These conventions follow Obsidian community plugin review requirements and are enforced by `eslint-plugin-obsidianmd`:

- **CSS class prefix**: All classes use `frontmatter-date-manager-` prefix (e.g. `frontmatter-date-manager-filter-setting`). Never use unprefixed or short-prefix classes — even when nested inside a prefixed parent.
- **Section headings in settings tab**: Use `new Setting(containerEl).setHeading().setName('...')` — not `createEl('h1')`..`createEl('h6')`. Heading elements in modals (`Modal` subclasses) are acceptable.
- **DOM elements**: Use Obsidian's `createEl()` / `createDiv()` / `createSpan()` helpers — not `document.createElement()`.
- **Styling**: Use CSS classes and `toggleClass()` — never assign `element.style.*` in JavaScript.
- **Colors**: Use Obsidian CSS variables (`var(--text-error)`, `var(--text-muted)`, etc.) — never hardcode hex colors.
- **Sentence case**: All UI text (`setName()`, `setDesc()`, `setText()`, `setPlaceholder()`, `setButtonText()`) must use sentence case. No Title Case, no ALL CAPS words. Proper nouns should be avoided where possible; if unavoidable, keep them lowercase (e.g. "daily notes" not "Daily Notes").
- **Console output**: Only `console.debug` and `console.error` are allowed (`console.log`/`console.info` are banned by ESLint). All console calls must go through `plugin.log()` / `plugin.logError()` which are gated behind `__DEV_MODE__`.
- **No `any` types**: The `@typescript-eslint/no-explicit-any` rule is enforced. Use `unknown` with type narrowing instead.
- **Floating promises**: All promises in fire-and-forget positions (setTimeout callbacks, onClick handlers, etc.) must be prefixed with `void`. The `@typescript-eslint/no-floating-promises` rule is enforced.
- **Strict indexed access**: `noUncheckedIndexedAccess` is enabled — `arr[i]` returns `T | undefined`. Use `!` for bounds-checked loops, proper guards elsewhere.
- **No unnecessary optional chaining**: `headerCreated` and `headerUpdated` are `string` (not optional) — use `.trim()`, not `?.trim()`. Same for `app.metadataCache` (always defined).
- **Strict equality**: `eqeqeq` rule enforced — use `===`/`!==` (exception: `== null` / `!= null` allowed).
- **Prefer const**: `prefer-const` at error level — always use `const` unless reassignment is needed.
- **Prefer nullish coalescing**: Use `??` / `??=` instead of `||` for null/undefined checks.
- **Async lifecycle methods**: `onunload()` must NOT be async (returns void per Plugin interface). Use `void this.method()` for async cleanup.
- **No plugin name in settings heading**: The settings tab must not display the plugin name as a top-level heading.

### Release

Release tags must be exact version numbers **without** `v` prefix (e.g. `1.0.0`, not `v1.0.0`). Obsidian requires this format to find release assets.

## Obsidian Community Plugin Review Requirements

This plugin targets the Obsidian community plugin store. All code changes must comply with the review process:

### Two-phase review
1. **Automated bot**: Validates `manifest.json`, runs `eslint-plugin-obsidianmd` (30+ rules). Rescans within 6 hours of each push. Locally replicated via `npm run lint`.
2. **Human reviewer**: Checks CSS scoping, code patterns, security, UX. Takes 2-12 weeks. PR goes stale after 30 days, auto-closes after 45.

### Key ESLint rules (enforced by bot)
- `no-console`: Only `console.warn`, `console.error`, `console.debug` allowed.
- `no-explicit-any`: No `any` types in production code. Tests/mocks exempt.
- `no-floating-promises`: All promises must be awaited, caught, or voided.
- `settings-tab/no-manual-html-headings`: No `createEl('h1')`..`createEl('h6')` in `PluginSettingTab`.
- `ui/sentence-case`: All UI text in sentence case.
- `no-namespace`: Use typed casts instead of `declare namespace`.

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

Keep updates concise and proportional to the change. Do not pad with filler text.

## Formatting

Prettier 3.x with: single quotes, semicolons, trailing commas (`all`), consistent quote props. Configured in `.prettierrc`.

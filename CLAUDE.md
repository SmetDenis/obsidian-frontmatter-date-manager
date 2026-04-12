# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian plugin that automatically updates frontmatter `created` and `updated` timestamps when files are edited.

**Target: Obsidian v1.12.7+** (`minAppVersion` in manifest.json).

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
yarn install          # Install dependencies (yarn.lock present, use yarn)
yarn build            # Type-check + production build → dist/
yarn dev              # Dev mode with watch (esbuild + CSS + optional vault sync)
yarn format:check     # Prettier check
yarn format:write     # Prettier fix
yarn test             # Run all tests (vitest)
yarn test:watch       # Run tests in watch mode
```

Run a single test file: `yarn test src/__tests__/formatDate.test.ts`

### Dev mode vault sync

Set `OBSIDIAN_VAULT` env var (or `.env` file) to your vault path. Dev mode will auto-copy `dist/` output into `<vault>/.obsidian/plugins/frontmatter-date-manager/`.

## Build Output

esbuild bundles `src/main.ts` → `dist/main.js` (CJS, ES2018 target). `manifest.json` is copied to `dist/`. CSS from `styles.css` is processed with lightningcss → `dist/styles.css`. The `__DEV_MODE__` global is `true` in dev, `false` in production (controls console logging).

## Architecture

- **`src/main.ts`** — `FrontmatterDateManagerPlugin` (extends `Plugin`). Entry point. Handles vault events (`modify`, `create`, `rename`, `delete`). Per-file debouncing (2s). SHA-256 content hashing to detect real changes. Hash cache persisted to `hash-cache.json` with LRU eviction, debounced flushing, GC on startup, auto-population, and format migration. Pause/resume with countdown timer and status bar indicator. Three commands: `update-timestamps-current-file`, `toggle-auto-update`, `pause-auto-update`. Uses `processingFiles` Set to prevent concurrent modifications of the same file.
- **`src/filterRules.ts`** — Gitignore-style filter rule engine. Pure functions, no Obsidian dependency. `parseFilterRules(text)` parses multiline text into `FilterRule[]` with validation errors. `isFileExcluded(filePath, rules)` applies rules top-to-bottom (last match wins). `validatePattern()` checks glob syntax via picomatch `makeRe()`.
- **`src/Settings.ts`** — `FrontmatterDateManagerSettings` interface + `FrontmatterDateManagerSettingsTab` (settings UI). `HashTrackingMode` type (`'body'` | `'frontmatter'` | `'both'`). Manages date format, timezone, frontmatter key names, gitignore-style filter rules (textarea with preview), min time between saves, delay for new files, number property toggle, content hash check toggle, hash tracking mode dropdown, frontmatter key exclusion list, hash cache settings, post-update command.
- **`src/BaseBulkModal.ts`** — Abstract base class for bulk file operations. Provides progress bar, error counting, Run/Cancel UI. Extended by `UpdateAllModal` and `UpdateAllCacheData`.
- **`src/UpdateAllModal.ts`** — Modal for bulk-updating all vault files' timestamps.
- **`src/UpdateAllCacheData.ts`** — Modal for populating/rebuilding SHA-256 hash cache for all files.
- **`src/BulkPopulateTimestampsModal.ts`** — Wizard modal for bulk-populating frontmatter timestamps from filesystem dates (`ctime`/`mtime`). Three-phase flow: configure (mode/override selection + platform warnings) → preview (dry-run with scrollable table) → execute (progress bar). Supports `PopulateMode` (`'created'`|`'updated'`|`'both'`) and `OverrideMode` (`'fill-missing'`|`'overwrite-all'`). Uses `Platform.*` API for platform-specific ctime reliability warnings. Does NOT extend `BaseBulkModal` (different wizard-based UI flow).
- **`src/suggesters/`** — Input autocomplete using Obsidian's `AbstractInputSuggest`. `TimezoneSuggest` for IANA timezones.
- **`src/utils.ts`** — `isTFile` type guard, `onlyUniqueArray` filter, `isGlobPattern` detector, `matchesPathPattern` (picomatch for globs, prefix match for plain folder names), `getMomentFormatHint` (detects Moment.js tokens and suggests date-fns equivalents), `__DEV_MODE__` global declaration.
- **`src/picomatch.d.ts`** — Type declarations for `picomatch/posix` module.

### Key Patterns

**File modification pipeline** (spans `main.ts`):
vault `modify` event → per-file debounce (2s) → `processFileWithLock()` → ignore checks (gitignore-style filter rules via `isFileExcluded()`) → read file → `getContentForHashing()` (body/frontmatter/both per `hashTrackingMode`) → SHA-256 hash → compare with cache → if changed: `computeFrontmatterUpdates()` → `processFrontMatter()` → re-hash updated file → mark cache dirty → debounced cache flush to disk.

**File filtering** (`filterRules.ts` + `utils.ts`):
Single `filterRules` textarea with gitignore-style syntax. Lines are exclude patterns by default; `!` prefix re-includes; `#` for comments; last matching rule wins. Empty rules = all .md files tracked. `parseFilterRules()` parses text into `FilterRule[]` with error collection. `isFileExcluded()` evaluates rules top-to-bottom using `matchesPathPattern()` (picomatch for globs, prefix match for plain folder names). Compiled rules are cached in `_compiledRules` on the plugin instance and recompiled on settings change.
**Bulk operations and hash bypass** (`BaseBulkModal.ts`, `main.ts`):
All bulk operations (overwrite timestamps, populate from filesystem, rebuild cache) must skip the content hash check in `shouldFileBeIgnored()` via `skipHashCheck: true`. The hash check exists only for automatic change detection on `modify` events — it must not filter files during intentional bulk processing. Note the double-barrier: both the file listing (`getAllFilesPossiblyAffected`) and per-file processing (`handleFileChange`) call `shouldFileBeIgnored`, so `skipHashCheck` must be passed through both. The `BaseBulkModal` exposes `skipHashCheck()` (default `false`) for subclasses to override; `handleFileChange` auto-skips hash when `triggerSource === 'bulk'`.

**Destructive operation UX**:
Buttons that mass-modify data must use `.setWarning()` (red), clearly state consequences ("permanently lost", "irreversible"), require typed confirmation (via `getConfirmationPrompt()` in `BaseBulkModal`), and be placed last in the settings section.

**Hash cache lifecycle** (`main.ts`):
Stored in `hash-cache.json` as `Record<string, {hash, lastAccessed}>`. Loaded on startup with GC (removes entries for deleted files) and optional auto-population. Flushed to disk via debounced writes (30s debounce, 300s max delay). LRU eviction when exceeding configurable max size.
## Key Dependencies

- **date-fns v4** + **@date-fns/tz** — Date formatting/parsing with timezone support via `TZDate`
- **js-sha256** — Content hashing for change detection (prevents false timestamp updates from sync plugins)
- **picomatch v4** — Glob pattern matching for folder include/exclude filters

## Pre-completion Check — MANDATORY

After finishing ANY task (feature, bugfix, refactor, test changes, etc.), **ALWAYS** run:

```bash
yarn format:check && yarn test && yarn build
```

If `format:check` fails, fix with `yarn format:write` and re-run. Do not consider the task done until all three pass.

After all checks pass, update documentation if the task changed user-facing behavior, settings, architecture, or key patterns:
- `README.md` — settings table, feature descriptions, examples
- `CLAUDE.md` — architecture section, key patterns, settings description

Keep updates concise and proportional to the change. Do not pad with filler text.

## Formatting

Prettier 3.x with: single quotes, semicolons, trailing commas (`all`), consistent quote props. Configured in `.prettierrc`.

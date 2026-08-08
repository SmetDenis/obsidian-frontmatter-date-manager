# Architecture - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Single-part monolith, Obsidian plugin.

## 1. Executive summary

The plugin is an event-driven Obsidian extension bundled to a single CJS file. Its job is to keep three frontmatter date properties (`created`, `updated`, `viewed`) accurate while never corrupting or churning note data. Two subsystems make up the codebase:

1. **The automatic pipeline** (`src/main.ts`) - reacts to vault events, detects real content changes via SHA-256 hashing, and writes only the minimal frontmatter mutation needed.
2. **The bulk operations subsystem** (`src/bulk/` + five `*Modal.ts` files) - opt-in, dry-run-gated tools for retrofitting dates across an entire vault.

Pure, Obsidian-free logic (date parsing/formatting, filter rules, inversion detection, pagination, export, the `{token}` string formatter) is factored into standalone modules so it can be unit-tested without the Obsidian runtime. The entire UI ships in 21 languages, following Obsidian's app language automatically (`src/i18n/`).

## 2. Core safety invariant (the overriding principle)

> The user's notes are irreplaceable. Every change to a vault file must be the smallest, safest mutation that achieves the goal; when a write is uncertain or unnecessary, do nothing. This outranks any feature.

Concrete rules enforced throughout the code:

- **Mutate frontmatter only through `app.fileManager.processFrontMatter()`** - never whole-file `vault.modify`, never string-replaced YAML. This preserves the body, key order, comments, and unrelated keys.
- **Touch only the configured keys** (`created`/`updated`/`viewed` or their renamed equivalents). Everything else is left byte-for-byte intact.
- **Write only on a real, detected change** - no unconditional or no-op writes. Needless writes churn `mtime` and fight sync.
- **Never guess-and-overwrite an unparseable value.** Ambiguous input is disambiguated (epoch seconds-vs-ms via `epochNumberToDate`; day/month ambiguity via `detectSlashDateReadings`) or left unchanged.
- **New mutation / bulk paths are opt-in and safe-by-default:** new fix strategies default to `disabled`; bulk operations default to fill-missing (not overwrite); destructive operations require a mandatory dry-run preview plus a red, irreversibility-worded Run button.

## 3. Technology stack & rationale

| Category | Technology | Version | Why |
| --- | --- | --- | --- |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) | 6.0.3 | Type safety; `noUncheckedIndexedAccess` forces `arr[i]` to be `T \| undefined`. |
| Plugin API | obsidian | ~1.13.1 | Pinned with tilde; any API newer than this must be verified against both the published npm types and the current public Obsidian release before use. Target `minAppVersion` 1.13.0 (raised from 1.11.0 for the declarative `getSettingDefinitions()` settings API). |
| Dates | date-fns v4 + @date-fns/tz | 4.4.0 / ^1.5.0 | Timezone-anchored formatting/parsing via `TZDate`. |
| Hashing | js-sha256 | ^0.11.1 | Content hashing for change detection. |
| Glob | picomatch v4 (`picomatch/posix`) | ^4.0.4 | Gitignore-style filter rules. |
| Bundler | esbuild | 0.28.1 | `src/main.ts` -> `dist/main.js` (CJS, ES2018). `__DEV_MODE__` global gates logging. |

## 4. Architecture pattern

**Event-driven plugin with a hash-gated write pipeline.** There is no framework, router, or store - the plugin is a single `Plugin` subclass that registers event handlers in `onload()` and tears down timers in `onunload()`. State is held in instance fields (Maps/Sets for per-file bookkeeping) plus two on-disk JSON files.

Persistent state:

- **`data.json`** - settings (via `Plugin.loadData()`/`saveData()`), validated at load by `sanitizeSettings()`.
- **`hash-cache.json`** - `Record<path, {hash, lastAccessed}>`, written through `vault.adapter` to the plugin dir.

## 5. The file-modification pipeline (`src/main.ts`)

The heart of the plugin. Flow for an automatic edit:

```
vault 'modify' event
  -> guards (auto-update on? not bulkRunning? not paused? is a TFile?)
  -> recentlyCreated? defer to new-file window
  -> per-file debounce (MODIFY_DEBOUNCE_MS = 2000ms)   [src/constants.ts]
  -> processFileWithLock()  (processingFiles Set prevents concurrent writes)
  -> handleFileChange()
       -> self-trigger check: lastPluginWriteMtime matches file.stat.mtime? skip
       -> shouldFileBeIgnored(): extension, Canvas.md, Excalidraw, filter rules,
          empty file, then SHA-256 hash vs cache
       -> hasUnsavedEditorChanges(): any Markdown leaf of this file dirty?
          -> yes: defer the whole pass (no write, no hash refresh), reschedule
       -> computeFrontmatterUpdates(): decide created/updated values
       -> processFrontMatter() writes ONLY changed keys (no write options)
       -> store lastPluginWriteMtime, re-hash file, mark cache dirty
       -> debounced flush to hash-cache.json
```

### 5.1 Self-triggered modify suppression

After every automated write the code stores `file.stat.mtime` in `lastPluginWriteMtime`, and `handleFileChange` skips the next event whose mtime matches. This breaks the write -> modify -> write loop and applies to `handleFileChange`, `handleFileOpen`, **and every bulk write**. The guard holds whether or not mtime was preserved on the write - it stores whatever `file.stat.mtime` is post-write, which is exactly what the self-triggered event carries.

### 5.1a Dirty-editor-buffer write guard (issue #10)

Obsidian's `TextFileView` 3-way-merges any vault write of its own file into the live buffer - fuzzy diff-match-patch, per-hunk failure flags discarded - and shows "modified externally, merging changes automatically", **iff the view's private `dirty` flag is set** when the `modify` arrives. mtime is never consulted there. So `hasUnsavedEditorChanges(file)` gates every write path: it checks **every** Markdown leaf showing the file (one can be clean while another is dirty), reads `dirty` through an `unknown` cast, and **fails closed** - a non-boolean `dirty` falls back to `getViewData() !== cachedRead()`, and an unreadable buffer counts as dirty.

Per path: `handleFileChange` defers the whole pass (no write, no hash refresh, one coalesced timer, no cap - Obsidian's 2 s autosave clears `dirty` shortly after typing stops); `handleFileOpen` **drops** the `viewed` stamp (it means "at open", so a later write would record a false time); bulk throws `BulkSkipped` and the modal reports the file as skipped. The manual command routes through `processFileWithLock` (which returns the result) so it cannot race the automatic path.

**No write path passes `{ ctime, mtime }`.** An earlier version pinned them for a note open in an editor, on the theory that this prevented the reload - it did not (the merge is gated on `dirty`), and it caused a real defect: a size-neutral re-stamp changed neither mtime nor size, Obsidian emitted no event, the open editor never learned about the write, and its next save reverted the stamp. Consequence accepted with the removal: with last-viewed enabled, opening a note now moves its `mtime`.

### 5.2 Change detection (content hashing)

`getContentForHashing()` extracts the part of the file that counts as a "change" per `hashTrackingMode` (`body` | `frontmatter` | `both`). The `created`/`updated`/`viewed` keys (plus any user-excluded keys) are stripped from the frontmatter before hashing, so the plugin's own writes cannot re-trigger detection. The hash is compared against `hash-cache.json`; equal hash => ignore the event.

### 5.3 Rate limiting & deferred retry

`minSecondsBetweenSaves` throttles `updated`. When a needed `updated` bump is rate-limited, `computeFrontmatterUpdates` returns `retryAfterMs`; `handleFileChange` checks this **before** writing anything, defers the WHOLE update (including a missing-`created` fill) to a scheduled retry, and deliberately does NOT cache the hash. This preserves the proven no-write retry path and avoids permanently losing the pending bump.

### 5.3a Freshness / no-op-write guard

The `updated` branch of `computeFrontmatterUpdates` (and the `viewed` write in `handleFileOpen`) is skipped when re-stamping would be a near-no-op - stopping the delayed redundant write that "shook" notes an external script had already stamped. Two checks: **(a) raw value-identity** - if `String(candidate) === String(existing)` the value FDM would write already equals the on-disk value; compared **raw, before `parseDate`**, so all-digit non-epoch formats (e.g. `yyyyMMdd`) that `parseDate` misreads as an epoch are still covered. **(b) asymmetric freshness** - if `(mtime - parseDate(updated)) / 1000 <= FRESHNESS_SEC` (= 5s, `src/constants.ts`) the stored value already covers mtime or is ahead of it, so it is preserved; signed, so a deliberately future-dated value is never clobbered and sub-window drift is absorbed (an accepted ≤5s precision loss). On a skip no `updatedValue`/`retryAfterMs`/`countedEdit` is produced, so `handleFileChange` takes its "no changes" branch: refresh the hash cache and stop - no write, no retry, no counter increment. `handleFileChange`'s ok result is `{ status: 'ok'; wrote: boolean; deferred?: boolean }`, so the manual command reports "already up to date" on a guarded skip, "will update shortly" when the write is merely rate-limited/deferred (a real change is pending on the retry), and "updated" only on a real write.

### 5.4 Inversion prevention

After computing candidate values, the final `created`/`updated` pair is checked with `isInversion()` (symmetric, tolerance-aware). If inverted and a non-`disabled` strategy is configured, `applyInversionFix()` rewrites the pair and a one-time-per-session Notice is shown. Default strategy is `disabled` (no-op for existing users until opt-in).

### 5.5 New-file delay

Template plugins (Templater, Daily Notes) populate a file right after creation. `delayForNewFiles` (default 5000ms) suppresses processing during a window; a deferred modify is replayed once the window expires, so template-populated files still get stamped without capturing the empty initial state.

### 5.6 Hash cache lifecycle

Loaded on startup with runtime type validation (mirrors `sanitizeSettings`) + GC of orphaned entries + optional auto-population. Capped-debounce flush (30s debounce, 300s max delay). LRU eviction past `hashCacheMaxSize` (default 10,000).

## 6. Bulk operations subsystem (`src/bulk/` + modals)

Shared building blocks (no `BaseBulkModal`; composition over inheritance):

| Module | Responsibility |
| --- | --- |
| `bulk/PhaseModal.ts` | Thin `Modal` host: phase navigation (`goTo`/`back`) + open-state lifecycle only. No operation logic. |
| `bulk/write.ts` | `applyFrontmatterWrite` - the single canonical safe bulk write (no `{ctime,mtime}`, set `lastPluginWriteMtime`, refresh hash). |
| `bulk/scan.ts` | `runBatchedScan` - batched per-file compute (yields every 50 files) with progress + abort. |
| `bulk/executePhase.ts` | `runExecutePhase` - execute loop owning `bulkRunning`, per-file error capture into `result.failures` (label + message), abort + `onComplete`. |
| `bulk/chrome.ts` | Shared render helpers (header, button bar, warning, summary, paginated diff table, download button, failure table, progress). `PREVIEW_MAX_ROWS = 100`. |
| `bulk/pagination.ts` | Pure page math (`getPageCount`/`clampPage`/`getPageSlice`). Unit-tested. |
| `bulk/export.ts` | Pure `toTSV` + `downloadPreviewAsFile` (local TSV download via transient object URL; desktop-only; no clipboard). |

The five modals (each extends `PhaseModal`, composes the blocks):

| Modal | Flow | Destructive? |
| --- | --- | --- |
| `BulkPopulateTimestampsModal` | configure -> preview -> execute | Red iff overwrite-all; blue for fill-missing |
| `RenameKeyModal` | configure -> preview -> execute | Red iff delete/overwrite; blue for pure copy |
| `ReformatDateModal` | configure -> preview -> execute | Always red (rewrites existing values in place) |
| `FindInversionsModal` | detection-first (auto-scan -> table + inline strategy -> execute) | Red (fixes existing values) |
| `UpdateAllCacheData` | confirm -> execute | Blue (non-destructive sidecar rebuild) |

### Destructive operation UX (invariant)

Every data-mutating bulk op presents a **mandatory dry-run preview** showing **every** changed row (paginated, not truncated) before Run is reachable, plus a neutral "Download full preview" (TSV). Run button color is the contract: **red** iff the op replaces/deletes existing user values; **blue** iff it only adds missing values or touches sidecar data. Use `.setDestructive()` for red (`ButtonComponent.setWarning()` is deprecated as of the 1.13 API). On per-file failure the modal shows a `File | Error` table - never "check the console" (the console is empty in production; `logError` is gated behind `__DEV_MODE__`).

## 7. Settings & the ingestion boundary

`data.json` is external input (hand-editable, sync-rewritten). `loadSettings()` runs the raw object through pure `sanitizeSettings(raw)`, which coerces every wrong-typed known field back to its `DEFAULT_SETTINGS` default (finite-number checks, `Array.isArray` for the exclude-keys array, explicit enum membership for `hashTrackingMode`/`inversionFixStrategy`) while preserving unknown keys. This single boundary prevents a whole class of "corrupt settings crash onload" bugs. `parseFilterRules` additionally hardens its own input (accepts `unknown`).

The settings tab itself (`FrontmatterDateManagerSettingsTab`) builds a **declarative** tree via `getSettingDefinitions()` instead of an imperative `display()` render - every control is a plain definition object (`type: 'toggle' | 'text' | 'number' | 'dropdown' | 'list' | 'page' | ...`) that Obsidian renders and diffs itself, which makes every setting searchable from the app's own settings search. All value reads/writes funnel through one `setControlValue` helper so validation and persistence stay centralized. The former "Ignore these properties" chip list is now a native `type: 'list'` control, and the old Advanced/filter-rules collapsible sections became declarative sub-pages (`type: 'page'`) reached by clicking a named row. The plugin keeps the built tab instance on `this.settingsTab`; because the declarative tree is a point-in-time snapshot, `onExternalSettingsChange()` calls `settingsTab.update()` to rebuild it after settings change outside the UI (e.g. sync rewriting `data.json`).

## 8. Date handling - parse must invert format

`formatDate` always renders in the configured timezone (`{ in: tz(timezone) }`). Any code that parses a stored date back must use the **same** zone, or values silently shift by the host<->settings offset on round-trip. `parseDateValueWithZone` (`src/utils.ts`) threads one `tzOptions` through every deterministic strategy. Numeric epochs are disambiguated by magnitude (`epochNumberToDate`, `< 1e11` => seconds) because `new Date(n)` assumes ms.

## 9. Internationalization (`src/i18n/`)

The whole UI ships in 21 languages and follows Obsidian's app language automatically (no plugin setting). The locale is resolved **once at module load**:

```
getLanguage()  [obsidian]
  -> code in LANGUAGE_MAP? use it, else 'en'   [src/i18n/index.ts]
  -> deep-merge the locale over STRINGS_EN (per-key fallback to English)
  -> exported read-only `strings`
  -> read by settings tab / the five modals / bulk chrome / main.ts (commands, notices, status bar)
```

- **`i18n/locales/en.ts`** (`STRINGS_EN`) is both the source-of-truth string object **and** the type shape (`type Strings = typeof STRINGS_EN`; never `as const`, so leaves infer as `string` and each locale's `Strings` stays assignable). `ru.ts` is hand-verified; the other 19 (`ar de es fa fr id it ja ko nl pl pt pt_br th tr uk vi zh_cn zh_tw`) are AI-generated baselines. Every locale is a COMPLETE `Strings` object (all keys declared, untranslated leaves seeded with the English value); completeness is enforced by the type and the `locale completeness` test, and the per-key English fallback is kept only as runtime defense.
- **`i18n/format.ts`** is the pure `{token}` substituter (no Obsidian dependency, unit-tested). Static strings are plain properties; dynamic ones are `{token}` templates resolved by `format()` (unknown/missing tokens render the literal `{key}` - loud, not silent).
- **`i18n/index.ts`** owns detection + the deep-merge and re-exports `format` + `LANGUAGE_MAP`. `LANGUAGE_MAP` keys on exact codes plus explicit aliases (`zh`/`zh-CN`/`zh_cn` -> Simplified, `zh-TW`/`zh_tw` -> Traditional, `pt-BR` -> Brazilian); codes are never "normalized". `strings` is **read-only** - merge returns untouched subtrees by reference from `STRINGS_EN`, so assigning to `strings.*` would mutate the English source.
- **RTL:** `styles.css` uses logical CSS properties (`*-inline-start`/`-end`, `text-align: start`) so the `ar`/`fa` locales mirror correctly; lightningcss downlevels them to direction-aware `:lang()` rules at build.
- **Floor:** detection relies on `getLanguage()` (`@since 1.8.7`), comfortably below the current `minAppVersion` floor of 1.13.0 (raised `1.11.0 -> 1.13.0` for the declarative settings API, not for i18n).
- **Out of scope (kept English):** `manifest.json` name/description, note content/frontmatter values (safety invariant), the marketing-screenshots pipeline, and `filterRules.ts` parse-error messages (the module is Obsidian-free; only its error *wrapper* is translated). The three files that already import date-fns `format` (`main.ts`, `ReformatDateModal.ts`, `Settings.ts`) import the i18n helper aliased as `t`.

## 10. Testing strategy

- **Unit (vitest, 36 spec files in `src/__tests__/`):** all pure logic and testable seams - date parse/format, filter rules, inversion detect/prevent, sanitizeSettings, hash cache, debounce, `handleFileChange` entry point, each modal's `compute*`/`rebuildAll`, the bulk blocks (`write`, `scan`, `executePhase`, `pagination`, `export`), and the i18n layer (`format.test.ts`; `i18n.test.ts` adds locale key-coverage plus value-integrity guards - no empty-string overrides, every translated value keeps English's exact `{token}` set). The `obsidian` module is mocked (`src/__mocks__/obsidian.ts`, now including a `getLanguage()` stub); DOM rendering is not unit-tested (the mock no-ops DOM).
- **E2E (WebdriverIO + real Obsidian, pinned 1.13.4, in `e2e/`):** only the seams the unit mock cannot reach - real `processFrontMatter` serialization (body/key-order/comments survive), number-vs-string on disk, self-trigger suppression on real `mtime`, the five bulk modals via real DOM clicks, and the native settings exclude-list UI. Manual/pre-release, not in CI. Requires Node <= 22.

See [Development Guide](./development-guide.md) for commands.

## 11. Build & distribution

esbuild bundles to `dist/`; `manifest.json` is copied; `styles.css` -> `dist/styles.css` via lightningcss. Release is driven by pushing a bare `N.N.N` tag (no `v` prefix - Obsidian requires this) which triggers `.github/workflows/release.yml` to build and publish assets. See [Deployment Guide](./deployment-guide.md).

## 12. Community review compliance (a hard constraint)

The plugin targets the Obsidian community store, whose automated scanner runs `eslint-plugin-obsidianmd` (recommended ruleset), **ignores this repo's eslint config**, and **forbids disabling its rules** (`Disabling '<rule>' is not allowed`). `eslint.config.mts` mirrors that with `no-restricted-disable: obsidianmd/*` so `make lint` is a true superset. The 2026 safety scorecard adds **capability disclosures** (informational, non-failing): this plugin keeps Vault Enumeration (irreducible - `getMarkdownFiles()` only) and removed Clipboard Access (replaced clipboard export with a file download). See `CLAUDE.md` -> "Obsidian Community Plugin Review Requirements" for the full ruleset.

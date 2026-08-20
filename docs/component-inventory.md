# Component Inventory - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Modules grouped by role. "Pure" = no Obsidian dependency, unit-tested directly.

## Core runtime

| Component | File | Type | Responsibility |
| --- | --- | --- | --- |
| `FrontmatterDateManagerPlugin` | `src/main.ts` | `Plugin` | Entry point. Event handlers (`create`/`modify`/`rename`/`delete`/`file-open`), per-file debounce + lock, content hashing, hash-cache lifecycle, pause/resume + status bar, 3 commands, self-trigger suppression, the write-safety gate (`getWriteBlock` = `hasUnsavedEditorChanges` for Markdown leaves + `excalidrawWriteBlock` for open Excalidraw drawing views - never write into a buffer/drawing with unsaved changes; Markdown defers, Excalidraw drops the pass, `viewed` is dropped), three-valued Excalidraw classification (`classifyExcalidraw` + `isExcalidrawContent` fallback for a metadataCache miss), typed ignore reasons + `ignoreReasonToNotice`, inversion prevention. |
| `FrontmatterDateManagerSettingsTab` | `src/Settings.ts` | `PluginSettingTab` | The entire settings UI via the declarative `getSettingDefinitions()` tree (Obsidian 1.13 - no `display()` override), making every setting searchable. All value reads/writes funnel through one `setControlValue` write funnel. Sections: Dates to track, Date formatting, Behavior (with a declarative Filter rules sub-page), Modified-before-created, an Advanced sub-page, and Bulk operations. The tab instance is kept on `plugin.settingsTab` so `onExternalSettingsChange()` can call `settingsTab.update()` to rebuild the tree (a point-in-time snapshot) after an out-of-band settings change. |

## Settings & validation

| Component | File | Pure? | Responsibility |
| --- | --- | --- | --- |
| `FrontmatterDateManagerSettings` / `DEFAULT_SETTINGS` | `src/Settings.ts` | - | Settings interface + defaults. |
| `sanitizeSettings(raw)` | `src/Settings.ts` | Yes | Boundary validator: coerces every wrong-typed field from external `data.json` back to default; preserves unknown keys. |
| `HashTrackingMode` | `src/Settings.ts` | - | `'body' \| 'frontmatter' \| 'both'`. |

## Pure logic (Obsidian-free, unit-tested)

| Component | File | Responsibility |
| --- | --- | --- |
| `parseFilterRules` / `isFileExcluded` / `validatePattern` | `src/filterRules.ts` | Gitignore-style filter engine (last-match-wins; allowlist mode; hardened against non-string input). |
| `isInversion` / `applyInversionFix` | `src/inversionDetection.ts` | Symmetric, tolerance-aware inversion detection + 3 fix strategies (`created-to-updated`, `updated-to-created`, `max-all`). |
| `parseDateValueWithZone` + `COMMON_DATE_FORMATS` | `src/utils.ts` | Timezone-anchored multi-strategy date parser (ISO / common formats / epoch). Inverse of `formatDate`. |
| `epochNumberToDate` | `src/utils.ts` | Epoch seconds-vs-ms disambiguation by magnitude. |
| `detectSlashDateReadings` / `detectSlashOrderFromLocale` | `src/utils.ts` | Probe `D/D/yyyy` (and dot) ambiguity; map OS locale to `dmy`/`mdy`. Never guesses. |
| `getMomentFormatHint` | `src/utils.ts` | Detect Moment.js tokens, suggest date-fns equivalents. |
| `parsePropertyKeys` / `errorToMessage` | `src/utils.ts` | Comma-split property keys; error-to-message. |
| `isTFile` / `onlyUniqueArray` / `isGlobPattern` / `matchesPathPattern` | `src/utils.ts` | Type guard, dedup, glob detect, path match (picomatch for globs, prefix for plain folders). |
| `MODIFY_DEBOUNCE_MS` | `src/constants.ts` | The per-file modify debounce (2000ms). |
| `FRESHNESS_SEC` | `src/constants.ts` | Freshness margin (5s) for the automatic `updated`/`viewed` no-op-write guard. |
| `EXCALIDRAW_FRONTMATTER_KEY` / `EXCALIDRAW_VIEW_TYPE` | `src/constants.ts` | The `excalidraw-plugin` frontmatter marker and the `excalidraw` workspace view type, used to classify drawings and find their open views. |

## Bulk subsystem - shared blocks (`src/bulk/`)

| Component | File | Pure? | Responsibility |
| --- | --- | --- | --- |
| `PhaseModal` | `bulk/PhaseModal.ts` | No (DOM) | Modal host: `goTo`/`back`/`isOpenState`. No operation logic. |
| `applyFrontmatterWrite` + `BulkSkipped` | `bulk/write.ts` | Yes | The one safe bulk frontmatter write (no `{ctime,mtime}`, set `lastPluginWriteMtime`, refresh hash). Throws the `BulkSkipped` sentinel instead of writing when the note has unsaved editor changes. |
| `runBatchedScan` | `bulk/scan.ts` | Mostly | Batched per-file compute (yields every 50), progress + abort. |
| `runExecutePhase` | `bulk/executePhase.ts` | Mostly | Execute loop owning `bulkRunning`, per-file failure capture (`{label, message}`), deliberate skips (`{label, reason}` from `BulkSkipped`), abort + `onComplete`. |
| render helpers + `PREVIEW_MAX_ROWS` | `bulk/chrome.ts` | No (DOM) | `renderHeader`/`renderButtonBar`/`renderWarning`/`renderSummary`/`renderPaginatedDiffTable`/`renderDownloadPreviewButton`/`renderFailureTable`/`renderSkippedTable`/`renderProgress`. |
| `getPageCount` / `clampPage` / `getPageSlice` | `bulk/pagination.ts` | Yes | Pure page math. |
| `toTSV` / `downloadPreviewAsFile` | `bulk/export.ts` | Yes/No | Pure TSV serialization + local file download (transient object URL; desktop-only; no clipboard). |

## Bulk subsystem - modals (each extends `PhaseModal`)

| Component | File | Flow | Run color | Testable seam |
| --- | --- | --- | --- | --- |
| `BulkPopulateTimestampsModal` | `src/BulkPopulateTimestampsModal.ts` | configure -> preview -> execute | red iff overwrite-all | `compute*` |
| `RenameKeyModal` | `src/RenameKeyModal.ts` | configure -> preview -> execute | red iff delete/overwrite | `compute*` |
| `ReformatDateModal` | `src/ReformatDateModal.ts` | configure -> preview -> execute | always red | `tryParseDate`, `renderPreviewResult` |
| `FindInversionsModal` | `src/FindInversionsModal.ts` | detection-first -> execute | red | `computeInvertedForFile` |
| `UpdateAllCacheData` | `src/UpdateAllCacheData.ts` | confirm -> execute | blue | `rebuildAll` |

## Internationalization (`src/i18n/`)

The whole UI ships in 21 languages, following Obsidian's app language automatically (no plugin setting). Every user-facing string (settings tab, the five bulk modals, bulk chrome, `export.ts` download notices, and `main.ts` commands/notices/status bar) reads from `strings.*`; dynamic strings go through `format()`.

| Component | File | Pure? | Responsibility |
| --- | --- | --- | --- |
| `format` | `src/i18n/format.ts` | Yes | Pure `{token}` substituter (unknown/missing tokens render the literal `{key}`). Unit-tested. |
| `strings` / `LANGUAGE_MAP` / `mergeTranslationValues` / `Strings` | `src/i18n/index.ts` | No (`getLanguage`) | Resolves the active locale once at module load, deep-merges the locale over English (fallback kept as defense; locales are complete), exposes the read-only `strings`, re-exports `format`. `LANGUAGE_MAP` keys on codes + aliases (`zh`/`zh-CN`/`zh_cn` -> Simplified, `zh-TW`/`zh_tw` -> Traditional, `pt-BR` -> Brazilian). |
| `STRINGS_EN` | `src/i18n/locales/en.ts` | Yes | Source-of-truth string object **and** type shape (`type Strings = typeof STRINGS_EN`; never `as const`). |
| 20 locale files | `src/i18n/locales/*.ts` | Yes | `ru.ts` hand-verified; the other 19 (`ar de es fa fr id it ja ko nl pl pt pt_br th tr uk vi zh_cn zh_tw`) are AI baselines. Every locale is a COMPLETE `Strings` object (untranslated leaves seeded with English); completeness is enforced by the type + the `locale completeness` test. |

## UI helpers

| Component | File | Responsibility |
| --- | --- | --- |
| `TimezoneSuggest` | `src/suggesters/TimezoneSuggest.ts` | `AbstractInputSuggest` autocomplete for IANA timezones in the settings timezone field. |

## Commands (registered in `main.ts`)

| ID | Name |
| --- | --- |
| `update-timestamps-current-file` | Update timestamps for current file |
| `toggle-auto-update` | Toggle auto-update on/off |
| `pause-auto-update` | Pause auto-update for 5 minutes |

## Stable-selector contract (for e2e)

Interactive bulk-UI controls carry `frontmatter-date-manager-*` classes (button bar + pager in `bulk/chrome.ts`; mode/override/scope/strategy dropdowns; reformat order dropdown `-slash-order`; rename inputs/toggle; the five settings bulk buttons; exclude input `-exclude-input`/`-add` and the native list `-exclude-list`). Page Objects key off these - keep them when changing the UI or update the PO. Add via `addClass`/`cls:`, never inline styles. Declarative sub-pages (Filter rules, Advanced) have no class hook of their own - e2e navigates them by the visible row name (`settingsTab.openSubPage(name)` / `backFromSubPage()`).

# Component Inventory - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Modules grouped by role. "Pure" = no Obsidian dependency, unit-tested directly.

## Core runtime

| Component | File | Type | Responsibility |
| --- | --- | --- | --- |
| `FrontmatterDateManagerPlugin` | `src/main.ts` | `Plugin` | Entry point. Event handlers (`create`/`modify`/`rename`/`delete`/`file-open`), per-file debounce + lock, content hashing, hash-cache lifecycle, pause/resume + status bar, 3 commands, self-trigger suppression, inversion prevention. |
| `FrontmatterDateManagerSettingsTab` | `src/Settings.ts` | `PluginSettingTab` | The entire settings UI via imperative `display()`. Sections: Dates to track, Date formatting, Behavior, Modified-before-created, Advanced (collapsible), Bulk operations. |

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
| `parsePropertyKeys` / `parseCacheMaxSize` / `errorToMessage` | `src/utils.ts` | Comma-split property keys; parse cache size; error-to-message. |
| `isTFile` / `onlyUniqueArray` / `isGlobPattern` / `matchesPathPattern` | `src/utils.ts` | Type guard, dedup, glob detect, path match (picomatch for globs, prefix for plain folders). |
| `MODIFY_DEBOUNCE_MS` | `src/constants.ts` | The per-file modify debounce (2000ms). |

## Bulk subsystem - shared blocks (`src/bulk/`)

| Component | File | Pure? | Responsibility |
| --- | --- | --- | --- |
| `PhaseModal` | `bulk/PhaseModal.ts` | No (DOM) | Modal host: `goTo`/`back`/`isOpenState`. No operation logic. |
| `applyFrontmatterWrite` | `bulk/write.ts` | No | The one safe bulk frontmatter write (no `{ctime,mtime}`, set `lastPluginWriteMtime`, refresh hash). |
| `runBatchedScan` | `bulk/scan.ts` | Mostly | Batched per-file compute (yields every 50), progress + abort. |
| `runExecutePhase` | `bulk/executePhase.ts` | Mostly | Execute loop owning `bulkRunning`, per-file failure capture (`{label, message}`), abort + `onComplete`. |
| render helpers + `PREVIEW_MAX_ROWS` | `bulk/chrome.ts` | No (DOM) | `renderHeader`/`renderButtonBar`/`renderWarning`/`renderSummary`/`renderPaginatedDiffTable`/`renderDownloadPreviewButton`/`renderFailureTable`/`renderProgress`. |
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

Interactive bulk-UI controls carry `frontmatter-date-manager-*` classes (button bar + pager in `bulk/chrome.ts`; mode/override/scope/strategy dropdowns; reformat order dropdown `-slash-order`; rename inputs/toggle; the five settings bulk buttons; exclude input `-exclude-input`/`-add` and property chips). Page Objects key off these - keep them when changing the UI or update the PO. Add via `addClass`/`cls:`, never inline styles.

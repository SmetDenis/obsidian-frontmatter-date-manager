# Source Tree Analysis - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Annotated layout of the tracked source and supporting files.

## Annotated tree

```
obsidian-frontmatter-date-manager/
├── src/                              # All plugin source (TypeScript)
│   ├── main.ts                       # ENTRY POINT. FrontmatterDateManagerPlugin extends Plugin.
│   │                                 #   Vault/workspace event handlers, debounce, hashing,
│   │                                 #   hash-cache lifecycle, pause/resume, 3 commands.
│   ├── Settings.ts                   # Settings interface + DEFAULT_SETTINGS + sanitizeSettings()
│   │                                 #   + FrontmatterDateManagerSettingsTab (the whole settings UI).
│   ├── utils.ts                      # Pure helpers: date parsing/formatting, epoch units,
│   │                                 #   slash-date ambiguity, locale order, property-key parsing.
│   ├── constants.ts                  # Obsidian-free constants (MODIFY_DEBOUNCE_MS).
│   ├── filterRules.ts                # Gitignore-style filter engine (pure, no Obsidian dep).
│   ├── inversionDetection.ts         # Pure isInversion() + applyInversionFix() strategies.
│   ├── picomatch.d.ts                # Type decls for picomatch/posix.
│   │
│   ├── BulkPopulateTimestampsModal.ts  # Bulk wizard: fill dates from ctime/mtime.
│   ├── RenameKeyModal.ts               # Bulk wizard: rename a property across notes.
│   ├── ReformatDateModal.ts            # Bulk wizard: rewrite date strings to target format.
│   ├── FindInversionsModal.ts          # Bulk modal: detect + fix updated<created.
│   ├── UpdateAllCacheData.ts           # Bulk modal: rebuild SHA-256 hash cache.
│   │
│   ├── bulk/                         # Shared building blocks composed by all 5 modals
│   │   ├── PhaseModal.ts             #   Modal host: phase navigation + lifecycle only.
│   │   ├── write.ts                  #   applyFrontmatterWrite - the one safe bulk write.
│   │   ├── scan.ts                   #   runBatchedScan - batched compute + abort.
│   │   ├── executePhase.ts           #   runExecutePhase - execute loop + failure capture.
│   │   ├── chrome.ts                 #   Render helpers (header/diff table/failure table/...).
│   │   ├── pagination.ts             #   Pure page math (unit-tested).
│   │   └── export.ts                 #   Pure TSV + local file download (no clipboard).
│   │
│   ├── suggesters/
│   │   └── TimezoneSuggest.ts        # AbstractInputSuggest for IANA timezones.
│   │
│   ├── __mocks__/
│   │   └── obsidian.ts               # Unit-test mock of the obsidian module (DOM no-ops).
│   └── __tests__/                    # 33 vitest spec files + helpers/setup.
│
├── e2e/                             # WebdriverIO + real Obsidian (1.12.7). Manual, not CI.
│   ├── specs/                       #   *.e2e.ts (Group A auto path, Group B bulk modals,
│   │                                #   marketing-screenshots.e2e.ts).
│   ├── helpers/                     #   Per-test notes, frontmatter parsing, settings patch.
│   ├── pageobjects/                 #   ALL DOM coupling (settingsTab, bulkModal).
│   ├── vaults/simple/               #   Seed vault (each spec gets its own copy).
│   └── README.md                    #   Full e2e scenario list.
│
├── screenshots/                     # 5 generated store/README PNGs (1200x800). Never hand-edited.
├── .github/
│   ├── workflows/ci.yml             # CI: format, lint, typecheck, test, build.
│   ├── workflows/release.yml        # Release: triggered by N.N.N tag; publishes assets.
│   ├── ISSUE_TEMPLATE/, PULL_REQUEST_TEMPLATE.md, dependabot.yml
│
├── dist/                            # Build output (main.js, manifest.json, styles.css). Gitignored.
├── manifest.json                    # Obsidian plugin manifest (id, version, minAppVersion).
├── package.json                     # Deps + npm scripts.
├── tsconfig.json                    # Strict TS, ES2018, excludes tests/e2e/tmp.
├── eslint.config.mts                # eslint-plugin-obsidianmd + no-restricted-disable mirror.
├── vitest.config.ts                 # Unit test config.
├── esbuild.config.mjs               # Bundler config (dev watch / production).
├── Makefile                         # Dev workflow entry (make build/dev/lint/test/...).
├── styles.css                       # Source CSS -> dist/styles.css via lightningcss.
├── CLAUDE.md                        # Authoritative engineering memory (read first).
├── README.md                        # User-facing docs + screenshots.
├── CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
└── docs/                            # THIS generated documentation set.
```

## Critical directories

| Path | Role | Notes |
| --- | --- | --- |
| `src/` | All production code | Bundled from `main.ts`; tests/mocks excluded from `tsconfig`. |
| `src/bulk/` | Shared bulk toolkit | The testable seams: `write`, `scan`, `executePhase`, `pagination`, `export`. `chrome`/`PhaseModal` are DOM and not unit-tested. |
| `src/__tests__/` | Unit tests | 33 specs; mirrors the pure logic and computable seams. |
| `e2e/` | Real-Obsidian integration | Only seams the mock cannot reach; needs Node <= 22 and a display. |
| `screenshots/` | Marketing assets | Regenerated via `make screenshots`; a stale shot is a store regression. |

## Entry points

- **Runtime:** `src/main.ts` -> `onload()` registers everything; `dist/main.js` is what Obsidian loads.
- **Settings UI:** `FrontmatterDateManagerSettingsTab.display()` in `src/Settings.ts`.
- **Bulk tools:** opened from settings buttons -> the five `*Modal.ts` files.
- **Build:** `esbuild.config.mjs` (invoked by `package.json` `dev`/`build` and the Makefile).

## No-go zones (single-part monolith, so a few clarifications)

- There is **no** REST API, database, or server - the `requires_api_scan`/`requires_data_models` flags for the "extension" project type do not apply here.
- `dist/` and `e2e/.obsidian-cache/` are generated/gitignored - never edit by hand.
- `screenshots/*.png` are generated - never edit by hand.

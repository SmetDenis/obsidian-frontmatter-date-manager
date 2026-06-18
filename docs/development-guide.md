# Development Guide - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Source of truth for commands: `Makefile` + `package.json`.

## Prerequisites

- **Node.js** - default toolchain works on Node 20 and 22 (CI matrix). **E2E requires Node <= 22** (WebdriverIO 9.x cannot open a WebDriver session on Node 26 - undici rejects forbidden headers, [wdio #15265](https://github.com/webdriverio/webdriverio/issues/15265)).
- **npm** (project uses `npm ci` against the committed `package-lock.json`).
- For e2e: a display (use `xvfb-run -a` on headless) and a Node 22 bin dir (`E2E_NODE_DIR`, default Homebrew `node@22`).
- For local manual testing: an Obsidian vault, path in the `OBSIDIAN_VAULT_TEST` env var.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `OBSIDIAN_VAULT_TEST` | `make dev`, `make local-test` | Path to your test vault. Plugin is copied to `<vault>/.obsidian/plugins/frontmatter-date-manager/`. |
| `E2E_NODE_DIR` | `make test-e2e`, `make test-e2e-spec` | Node <= 22 bin dir, prepended to `PATH` for the e2e run only (default `/opt/homebrew/opt/node@22/bin`). |

## Common commands (run `make` to list all)

| Command | What it does |
| --- | --- |
| `make install` | `npm ci` - install dependencies. |
| `make build` | Type-check (`tsc -noEmit`) + production esbuild bundle -> `dist/`. |
| `make dev` | Watch mode (esbuild + CSS + optional vault auto-copy). |
| `make lint` | ESLint with `eslint-plugin-obsidianmd` - matches the community review bot. |
| `make format` / `make format-check` | Prettier fix / check. |
| `make test` / `make test-watch` | Vitest unit tests (all / watch). |
| `make typecheck-e2e` | Type-check e2e specs/PO without launching Obsidian (part of pre-commit). |
| `make test-e2e` | All e2e specs in real Obsidian (manual, Node <= 22). |
| `make test-e2e-spec SPEC=<name>` | One e2e spec (e.g. `SPEC=auto-stamp`). |
| `make screenshots` | Regenerate store/README screenshots at 1200x800 (macOS `sips`). |
| `make local-test` | Build + copy plugin into `OBSIDIAN_VAULT_TEST`. |
| `make pre-commit` | **Mandatory gate:** format-check, lint, typecheck-e2e, test, build. |

Run a single unit test file: `npm test -- src/__tests__/formatDate.test.ts`.

## Build output

esbuild bundles `src/main.ts` -> `dist/main.js` (CJS, ES2018 target). `manifest.json` is copied to `dist/`; `styles.css` is processed with lightningcss -> `dist/styles.css`. The `__DEV_MODE__` global is `true` in dev and `false` in production (it gates all `plugin.log()`/`plugin.logError()` output).

## Local manual testing loop

```bash
export OBSIDIAN_VAULT_TEST=/path/to/your/test/vault
make local-test     # one-shot build + copy
# or
make dev            # watch + auto-copy on change
```

Then enable the plugin in Obsidian (Settings -> Community plugins) and reload.

## Testing approach

- **Unit (vitest, `src/__tests__/`, 36 specs):** required for any logic change. Targets pure functions and computable seams; the `obsidian` module is mocked (`src/__mocks__/obsidian.ts`, DOM is a no-op). Never weaken the `created`/`updated`/body safety assertions.
- **E2E (`e2e/`, WebdriverIO + real Obsidian 1.12.7):** only seams the mock cannot reach (real `processFrontMatter` serialization, on-disk number-vs-string, self-trigger suppression on real `mtime`, the five bulk modals via DOM, the settings exclude-list UI). Characterization style: a fresh spec passes on first run. Manual / pre-release - not in CI. First run downloads Obsidian to `e2e/.obsidian-cache/` (gitignored). Full scenario list: `e2e/README.md`.

## Continuous integration

`.github/workflows/ci.yml` runs on push/PR to `main` across Node **20 and 22**: `make install` -> `format-check` -> `lint` -> `test` -> `build`. (E2E is intentionally not in CI.)

## Pre-completion check - MANDATORY

After finishing any task, run `make pre-commit` and ensure all five checks pass. If `format-check` fails, run `make format` and re-run. Update docs the change touched (`README.md`, `CLAUDE.md`, `e2e/README.md`) and regenerate screenshots if a captured surface changed.

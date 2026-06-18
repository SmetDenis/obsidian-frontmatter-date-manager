# Contributing

Thanks for helping improve Frontmatter Date Manager. This file is a short hub: it covers the workflow and the rules that gate a merge, and links to [`CLAUDE.md`](CLAUDE.md) for the full conventions instead of repeating them.

## Safety first (read before any code change)

The user's notes are irreplaceable. Every change to a vault file must be the smallest, safest mutation that achieves the goal; when a write is uncertain or unnecessary, do nothing. This outranks any feature. Concretely:

- Mutate frontmatter **only** through `app.fileManager.processFrontMatter()` - never hand-write note files or string-replace YAML.
- Touch only the configured keys; leave all other frontmatter and the note body untouched.
- Write only on a real, detected change - never an unconditional or no-op write.
- Never guess-and-overwrite a value you can't safely parse - leave it unchanged.
- New mutation / bulk / "fix" paths are opt-in and safe-by-default: new fix strategies default to disabled, bulk operations default to fill-missing (not overwrite), and anything destructive requires a mandatory dry-run preview plus a red Run button with explicit irreversibility wording.

Full rationale and the file-modification pipeline: see "Safety first" and "Key Patterns" in [`CLAUDE.md`](CLAUDE.md).

## Quick start

```bash
make install      # npm ci
make dev          # watch build (esbuild + CSS), optional vault auto-copy
make local-test   # build and copy into a local vault for manual testing
```

`make local-test` and `make dev` use the `OBSIDIAN_VAULT_TEST` env var (your vault path), or pass it inline: `make local-test OBSIDIAN_VAULT_TEST=/path/to/vault`. Run `make` to list every target.

## Development workflow

1. Branch off `main`.
2. Make the change. Match the surrounding code's style, naming, and comment density.
3. Add or update tests (see below).
4. Run `make pre-commit` - this is mandatory and must pass before a PR (format, lint, typecheck-e2e, test, build). If `format-check` fails, run `make format` and re-run.
5. Update docs you touched: `README.md` for user-facing behavior, `CLAUDE.md` for architecture / patterns / invariants, `e2e/README.md` for e2e changes. Regenerate marketing screenshots (`make screenshots`) if you changed a captured surface (settings, a bulk modal, the note / Properties / editor view, filter rules).
6. Open a PR using the template.

The architecture map (entry point, bulk modals, pure helpers, key patterns) lives in the "Architecture" section of [`CLAUDE.md`](CLAUDE.md) - start there to find where code belongs.

## Tests

- **Unit (vitest)** is required for any logic change: `make test` (or `make test-watch`). Pure functions and each modal's compute/rebuild seams are unit-tested; never weaken the `created`/`updated`/body safety assertions.
- **E2E (real Obsidian, WebdriverIO)** covers only the seams the unit mock cannot reach (real `processFrontMatter` serialization, on-disk number-vs-string, self-trigger suppression, the bulk-modal DOM). Don't duplicate pure logic here. Run with `make test-e2e` (all) or `make test-e2e-spec SPEC=<name>` (one). **Requires Node <= 22 locally** (WebdriverIO 9.x can't open a session on Node 26). E2E is manual / pre-release, not CI. Scenario list and details: [`e2e/README.md`](e2e/README.md).

## Community-store constraints

This plugin ships to the Obsidian community store, which gates submissions. Do not:

- Bump the `obsidian` types past `~1.12.3` or adopt 1.13+ APIs (e.g. `getSettingDefinitions()`, `ButtonComponent.setDestructive()`) - it breaks every public install. Target is `minAppVersion` 1.11.0.
- Disable any `obsidianmd/*` ESLint rule - the review scanner forbids `eslint-disable` of its rules and `make lint` mirrors that. Fix the code instead.
- Let the linter pin go stale - the bot always runs the latest `eslint-plugin-obsidianmd`.

Replicate the bot locally with `make lint`. More detail: "Obsidian Community Plugin Review Requirements" in [`CLAUDE.md`](CLAUDE.md).

## Commits & pull requests

- **Conventional Commits**, in **English only**, written so the subject reads as an imperative (`fix(bulk): ...`, `feat(settings): ...`).
- Use a plain minus `-`, never an em/en dash, in commits, code, UI, and docs.
- Keep PRs focused; fill in the checklist in the PR template. A green `make pre-commit` is the bar for review.

## What's in scope

Welcome: bug fixes, safer edge-case handling, tests, docs, accessibility and UX polish that respects the safety contract.

Likely to be declined: anything that breaks safety-first (unconditional writes, overwriting parseable values, destructive defaults), bumping the Obsidian API past the supported line, disabling lint rules, or features that add risk to vault data without an opt-in + dry-run.

If unsure whether a feature fits, open an issue first and we'll scope it together.

## Translations

The UI is translatable (`src/i18n/`) and follows Obsidian's app language automatically. English (`src/i18n/locales/en.ts`, `STRINGS_EN`) is the source-of-truth shape and the only fully hand-authored locale; every other locale is a `DeepPartial<Strings>` deep-merged over English, so any missing key falls back to English and a partial translation never breaks the UI.

To add or improve a locale:

1. Copy the shape of `en.ts` into `src/i18n/locales/<code>.ts` as `export const STRINGS_<CODE>: DeepPartial<Strings> = { ... }` (import the type from `../index`). Translate only the **values**; omit keys you are unsure about and they fall back to English.
2. Keep every `{token}` placeholder **byte-identical** to English (e.g. `{count}`, `{processed}`) - the token name is substituted at runtime; a mistranslated token would print the literal `{name}` to the user. Keep `\n` escapes and literal data fragments (`templates/`, `01/05/2024`, `yyyy-MM-dd'T'HH:mm:ss`, etc.) as-is. Use a plain `-`, never an em/en dash. File comments stay English.
3. Register the locale in `LANGUAGE_MAP` in `src/i18n/index.ts` (add any code aliases Obsidian may report, as the Chinese entries show).
4. Run `npm test -- src/__tests__/i18n.test.ts`. The coverage test rejects keys that do not exist in English; the value-integrity test rejects empty-string overrides and any value whose `{token}` set drifts from English. Then `make pre-commit`.

`ru` is maintainer-verified; the other non-English locales are machine-generated baselines marked "Improvements welcome" - translation PRs are very welcome.

## Tools we use (optional)

This repo carries a [`CLAUDE.md`](CLAUDE.md) that AI coding agents read automatically, so AI-assisted contributions are a first-class path. The maintainer happens to use the [Claude Code](https://docs.claude.com/en/docs/claude-code) CLI plus the [superpowers](https://github.com/obra/superpowers) plugin (brainstorm before a feature, TDD, written plans). You're free to use any tools - or none.

Whatever you use, the same bar applies: **AI-generated code must still pass `make pre-commit`, ship with tests, and you are responsible for the diff you open.** Unreviewed machine output is not acceptable.

## Reporting bugs

Use the bug template and include: Obsidian version, OS, plugin version, exact steps, and a minimal frontmatter sample where relevant. Security issues go through [`SECURITY.md`](SECURITY.md), not public issues.

## License of contributions

By contributing, you agree your work is licensed under the project's [MIT License](LICENSE). No CLA or sign-off required.

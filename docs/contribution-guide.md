# Contribution Guide - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Condensed from `CONTRIBUTING.md`; that file + `CLAUDE.md` remain authoritative.

## Safety first (read before any code change)

The user's notes are irreplaceable. Every change to a vault file must be the smallest, safest mutation that achieves the goal; when a write is uncertain or unnecessary, do nothing. This outranks any feature.

- Mutate frontmatter **only** through `app.fileManager.processFrontMatter()` - never hand-write note files or string-replace YAML.
- Touch only the configured keys; leave all other frontmatter and the note body untouched.
- Write only on a real, detected change - never an unconditional or no-op write.
- Never guess-and-overwrite a value you can't safely parse - leave it unchanged.
- New mutation / bulk / "fix" paths are opt-in and safe-by-default (new fix strategies default to disabled; bulk defaults to fill-missing; destructive ops require a dry-run preview + red, irreversibility-worded Run button).

## Development workflow

1. Branch off `main`.
2. Make the change. Match the surrounding code's style, naming, and comment density.
3. Add or update tests (unit is required for any logic change).
4. Run `make pre-commit` (mandatory: format, lint, typecheck-e2e, test, build). If `format-check` fails, run `make format` and re-run.
5. Update docs you touched: `README.md` (user-facing), `CLAUDE.md` (architecture/patterns/invariants), `e2e/README.md` (e2e changes). Regenerate screenshots (`make screenshots`) if you changed a captured surface.
6. Open a PR using the template; fill in the checklist.

## Commit & PR conventions

- **Conventional Commits**, **English only**, imperative subject (`fix(bulk): ...`, `feat(settings): ...`).
- Use a plain minus `-`, never an em/en dash - in commits, code, UI, and docs.
- Keep PRs focused. A green `make pre-commit` is the bar for review.

## Community-store constraints (will block a merge)

- Do **not** bump `obsidian` types past `~1.12.3` or adopt 1.13+ APIs (`getSettingDefinitions()`, `ButtonComponent.setDestructive()`) - it breaks every public install. Target is `minAppVersion` 1.11.0 (raised from 1.4.11 for the i18n `getLanguage()` floor).
- Do **not** disable any `obsidianmd/*` ESLint rule - the review scanner forbids `eslint-disable` of its rules and `make lint` mirrors that. Fix the code instead.
- Keep the linter pin current - the bot always runs the latest `eslint-plugin-obsidianmd`.

## Scope

- **Welcome:** bug fixes, safer edge-case handling, tests, docs, accessibility/UX polish that respects the safety contract.
- **Likely declined:** anything that breaks safety-first (unconditional writes, overwriting parseable values, destructive defaults), bumping the Obsidian API past the supported line, disabling lint rules, or vault-data-risky features without an opt-in + dry-run.

## Reporting

- Bugs: use the bug template; include Obsidian version, OS, plugin version, exact steps, minimal frontmatter sample.
- Security: via `SECURITY.md`, not public issues.
- License: contributions are MIT (no CLA or sign-off required).

## Reference

- `CONTRIBUTING.md` - the full hub (this is a digest).
- `CLAUDE.md` - authoritative engineering memory: safety, key patterns, review requirements, UI/CSS conventions.
- `e2e/README.md` - e2e scenario list.

---
name: obsidian-plugin-release
description: Use when cutting a public release of this Obsidian plugin (frontmatter-date-manager). Drives the full gated workflow - detect the last published release, analyze changes, propose the next version from conventional commits, build a no-fluff changelog in tmp/, bump package.json/manifest.json/versions.json, run checks, push the bare N.N.N tag so release.yml publishes assets, then replace the auto notes with the changelog and verify links. Triggers on /obsidian-plugin-release, "release the plugin", "cut a release", "publish a new version".
---

# Obsidian plugin release

Drive a public release of this plugin end to end. Releases are public and irreversible, so every irreversible action (push to main, push tag, publish) sits behind an explicit confirmation gate. Do not skip phases. Use the minus sign `-` in all generated text, never an em or en dash.

## When to use

The user wants to cut and publish a new release of this plugin. Run the phases in order. Ask the user at every gate.

## Phase 0 - Preflight

Verify the environment before touching anything:

- Inside this git repo and `manifest.json` exists (this is the plugin).
- On branch `main`: `git rev-parse --abbrev-ref HEAD` returns `main`. If not, stop and ask.
- Working tree clean: `git status --short` is empty. If not, stop and ask the user to commit or stash.
- `gh auth status` succeeds. If not, tell the user to authenticate.
- Sync tags and remote state: `git fetch --tags origin`.
- Compare local and remote main: `git rev-parse main` vs `git rev-parse origin/main`. If they differ, warn and ask whether to continue, push, or pull first.

## Phase 1 - Baseline (last published release)

Find the version this release builds on, using BOTH sources and reconciling:

- Remote tags: `git ls-remote --tags origin | grep -oE 'refs/tags/[0-9]+\.[0-9]+\.[0-9]+$' | sed 's#refs/tags/##' | sort -V | tail -1`
- Published releases: `gh release list --limit 5`. The latest non-draft, non-prerelease entry is the published baseline.
- Reconcile: if the top remote `N.N.N` tag and the latest published release disagree, warn the user and ask which to treat as the baseline. Ignore non-standard tags such as `v0.1.0`.
- Record the chosen baseline as `<baseline>` (e.g. `1.0.1`).

## Phase 2 - Analyze changes

Summarize everything between baseline and HEAD:

- Commit history: `git log <baseline>..main --pretty=format:'%h %s'`. Group commits by conventional type (`feat`, `fix`, `refactor`, `chore`, `ci`, `build`, `style`, `test`, `docs`).
- Code surface: `git diff <baseline>..main --stat`, then look closer at any change to settings, `manifest.json` `minAppVersion`, or removed/renamed commands and options.
- Collect breaking-change signals: `feat!`/`fix!`/`!:` markers or `BREAKING CHANGE` in commit bodies (`git log <baseline>..main --format='%h%n%b'`), a raised `minAppVersion`, changed setting defaults, removed user-facing features.
- Count commits: `git rev-list --count <baseline>..main`.

## Phase 3 - Version proposal (GATE 1)

Propose the next version from the analysis:

- Primary signal - conventional commits: any breaking signal -> major; else any `feat` -> minor; else (only `fix`/chore/etc.) -> patch.
- Secondary signal - diff size: if the bump looks understated for a very large diff, say so, but do not override the commit signal silently.
- Present the proposed `<version>`, the bump level, and the reasoning (cite the commits that drive it).
- ASK the user to confirm or override the number before continuing.

## Phase 4 - Build the changelog

Read `references/changelog-format.md` and generate `tmp/CHANGELOG-<version>.md` following it exactly:

- Title, compare blockquote with commit count, intro paragraph, Highlights, the change sections, short-hash commit links, an optional Breaking changes / Migration section (only if Phase 2 found signals), and the Full changelog footer.
- Use `<baseline>...<version>` in compare links (the final version, never `main`, so links stay stable).
- No fluff, no dashes (minus only).

## Phase 5 - Changelog review (GATE 2)

Show the full `tmp/CHANGELOG-<version>.md` to the user. Apply requested edits and regenerate. Do not proceed until the user approves the changelog.

## Phase 6 - Bump versions and validate

- `package.json`: set `version` to `<version>`.
- `manifest.json`: set `version` to `<version>`. Change `minAppVersion` ONLY if the user explicitly decided to (e.g. a new API was adopted); otherwise leave it.
- `versions.json`: add `"<version>": "<minAppVersion from manifest>"`.
- Validate, and stop on any failure:
  - All three files are valid JSON.
  - `version` is identical across `package.json`, `manifest.json`, and the new `versions.json` key.
  - `<version>` is valid semver and greater than `<baseline>`.
  - The future tag will equal `manifest.json` `version` (this is what `release.yml` checks).
- Run `make pre-commit`. It must pass (format, lint, typecheck-e2e, test, build). Then confirm `node -p "require('./dist/manifest.json').version"` equals `<version>`.
- Screenshots: if the Phase 2 diff touched a captured surface (the settings tab, a bulk modal, the note/Properties/editor view, or the filter-rules UI), warn the user that the marketing screenshots are stale and offer to regenerate them with `make test-e2e-spec SPEC=marketing-screenshots` (needs a display and Node <= 22). If no captured surface changed, skip this.

## Phase 7 - Obsidian requirements check (live)

Read `references/obsidian-requirements.md` and run its checklist. Then do the LIVE step it describes: re-verify the current official Obsidian "Submission requirements" and "Releasing" guidance, anchored to today's date, using ONLY fresh, trustworthy official sources (the official Obsidian developer docs via `context7`, or the Jina/Tavily/Firecrawl MCP tools pointed at `docs.obsidian.md`). Do not rely on memory. Flag any requirement that changed since the last release and ask the user how to proceed if something now fails.

## Phase 8 - Commit and push main (GATE 3)

- Show the version diff: `git diff package.json manifest.json versions.json`.
- ASK the user to confirm the release commit. On approval:
  - `git add package.json manifest.json versions.json`
  - `git commit -m "chore(release): <version>"`
- ASK the user to confirm pushing main. On approval: `git push origin main`.

## Phase 9 - Tag, publish, and finalize (GATE 4 and GATE 5)

- Create the tag on the release commit (NO `v` prefix): `git tag <version>`.
- GATE 4: ASK for explicit confirmation that pushing the tag will publish a public release. On approval: `git push origin <version>`. This triggers `release.yml`.
- Watch CI: `gh run list --workflow=release.yml --limit 1`, then `gh run watch <run-id>`. If it fails, fetch logs with `gh run view <run-id> --log-failed`, surface the reason, and stop.
- After the workflow succeeds, confirm the release exists with assets: `gh release view <version> --json assets,tagName,isLatest`. Expect `main.js`, `manifest.json`, `styles.css`.
- GATE 5: ASK to replace the auto-generated notes with our changelog. On approval: `gh release edit <version> --notes-file tmp/CHANGELOG-<version>.md`.
- Verify links are not broken:
  - Every commit hash in the changelog resolves: for each `<hash>`, `gh api repos/SmetDenis/obsidian-frontmatter-date-manager/commits/<hash> --jq .sha` returns a sha.
  - The compare endpoints exist: `gh api repos/SmetDenis/obsidian-frontmatter-date-manager/compare/<baseline>...<version> --jq .status` returns a value.
- Report the release URL (`gh release view <version> --json url --jq .url`), the version, the asset list, and that notes were replaced.

## Gates summary

1. Version number (Phase 3)
2. Changelog content (Phase 5)
3. Commit + push main (Phase 8)
4. Push tag = publish (Phase 9)
5. Replace release description (Phase 9)

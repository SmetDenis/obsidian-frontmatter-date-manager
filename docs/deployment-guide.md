# Deployment Guide - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Distribution: Obsidian community plugin store via GitHub release assets.

## Distribution model

This is an Obsidian community plugin. There is no server or hosting - "deployment" means publishing release assets (`main.js`, `manifest.json`, `styles.css`) to a GitHub release, which the Obsidian community store and the in-app updater pull from.

## Release trigger and tag convention

`.github/workflows/release.yml` runs on pushing a tag matching `[0-9]+.[0-9]+.[0-9]+`.

> **Tags must be the exact version with NO `v` prefix** (e.g. `1.1.1`, not `v1.1.1`). Obsidian requires this format to locate release assets.

The tag version must equal `manifest.json` -> `version`; the workflow fails fast if they differ.

## Release pipeline (`release.yml`)

1. **Verify tag matches manifest** - aborts if `GITHUB_REF_NAME != manifest.json.version`.
2. **Setup Node 22**, `make install`.
3. **`make pre-commit`** - the full strict gate (format, lint, typecheck-e2e, test, build) runs before publishing, so a lint/format/test failure blocks the release. The final `make build` here produces the exact `dist/` bytes that are attested and uploaded (no rebuild in between).
4. **Attest build provenance** - `actions/attest-build-provenance` mints a Sigstore OIDC attestation over `dist/main.js`, `dist/manifest.json`, `dist/styles.css`.
5. **Create GitHub release** - `softprops/action-gh-release` uploads the three assets with generated notes (`fail_on_unmatched_files: true`).

Required permissions: `contents: write`, `id-token: write`, `attestations: write`.

## Version bump checklist (before tagging)

The repo ships an `obsidian-plugin-release` skill that drives the full gated flow. Manually, the steps are:

1. Decide the next version from conventional commits (semver).
2. Bump `version` in `package.json`, `manifest.json`, and add the entry to `versions.json` (maps plugin version -> `minAppVersion`).
3. Build a changelog (the skill stages it under `tmp/`).
4. Run `make pre-commit` locally.
5. Commit, then push the bare `N.N.N` tag so `release.yml` publishes assets.
6. After the release is created, replace the auto-generated notes with the curated changelog and verify links.

> Note: `minAppVersion` (currently 1.4.11) and the pinned `obsidian` types (`~1.12.3`) must not be advanced to 1.13+ - that breaks every public install. See `CLAUDE.md` -> Target note.

## Manual / local verification before release

- `make build` produces `dist/`; `make local-test` (with `OBSIDIAN_VAULT_TEST`) copies it into a real vault for a final smoke test.
- Optionally run `make test-e2e` (Node <= 22) for the real-Obsidian seams.
- Disclosures (capability scorecard) are confirmed via the Developer-Dashboard preview scan on the branch/tag/commit. See `CLAUDE.md` -> Capability disclosures.

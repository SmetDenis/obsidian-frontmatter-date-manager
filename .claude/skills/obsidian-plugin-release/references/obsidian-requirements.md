# Obsidian release requirements

A release for the Obsidian community store must satisfy these. Run the static checklist, then do the live re-check.

## Static checklist

- The git tag is an exact version number with NO `v` prefix (e.g. `1.1.0`). `release.yml` only triggers on tags matching `[0-9]+.[0-9]+.[0-9]+` (exact `N.N.N`, no suffix).
- The tag equals `manifest.json` `version` (the `release.yml` "Verify tag matches manifest.json" step fails otherwise).
- Release assets are the three loose files `main.js`, `manifest.json`, `styles.css` (not a zip). `release.yml` uploads them from `dist/`.
- `manifest.json` is valid JSON with `id`, `name`, `version`, `minAppVersion`, `description`, `author`, `isDesktopOnly`.
- `versions.json` maps `<version>` to the current `minAppVersion`.
- `minAppVersion` is accurate. This repo targets the public 1.12.x line and pins `obsidian` types to `~1.12.3`; do not raise `minAppVersion` to a 1.13+ early-access value unless the user explicitly adopts a 1.13 API.
- The release workflow generates artifact attestations (SLSA build provenance) for the assets via `actions/attest-build-provenance`. This is a review-bot scorecard RECOMMENDATION, not a hard blocker - a release without it still publishes, but the bot flags `main.js`/`styles.css` as missing provenance. For it to work, `release.yml` must keep the `id-token: write` and `attestations: write` permissions alongside `contents: write`, and the attest step must run on the same `dist/` bytes that get uploaded (no rebuild in between).

## Live re-check (required, do not skip)

Obsidian's submission and release rules change over time. Anchored to today's date, re-verify the CURRENT official guidance using ONLY fresh, trustworthy official sources. Do not answer from memory.

- Preferred sources: the official Obsidian developer docs via `context7` (resolve `obsidianmd/obsidian-developer-docs` or the `obsidian` docs), or the Jina/Tavily/Firecrawl MCP tools pointed at `docs.obsidian.md`.
- Pages to check:
  - "Submission requirements for plugins" (https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins)
  - "Release your plugin with GitHub Actions" / "Releasing" (https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions)
  - "Plugin guidelines" (https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- Also confirm the latest published versions of `obsidian` (types) and `eslint-plugin-obsidianmd` on npm, since the community review bot always runs the latest linter.
- If any requirement changed since the last release, flag it and ask the user how to proceed before publishing.

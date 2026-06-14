# Changelog format

Model every release changelog on `tmp/CHANGELOG-1.1.0.md` for overall structure, but use plain section headers with NO emojis (this format supersedes the emoji headers in that sample). Generate into `tmp/CHANGELOG-<version>.md` (the `tmp/` directory is gitignored; the changelog lives only in the GitHub release).

## Hard style rules

- Use the minus sign `-` only. Never an em dash or en dash anywhere.
- No fluff. Each entry states what changed and why it matters to a user, then stops.
- Plain, user-facing language consistent with the plugin's vocabulary: "property" not "frontmatter key", "date" / "date & time" not "timestamp". Keep implementation jargon out of user-facing lines.
- Moderately detailed: a short clause of context per entry is good; a paragraph of backstory is not.

## Structure (in order)

1. `# Release <version>`
2. Compare blockquote:
   `> Compare: [\`<baseline>...<version>\`](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/compare/<baseline>...<version>) - N commits`
3. One intro paragraph: a 2-3 sentence summary of the release's theme.
4. `## Highlights` - 3 to 5 bullets, each a single user-facing win.
5. `---`
6. Change sections. Every section is optional: include a section only if it has at least one entry, and omit any empty section entirely (no empty header, no "None" placeholder). Use these plain headers, with NO emojis:
   - `## New`
   - `## Fixed`
   - `## Removed`
   - `## UX & polish`
   - `## Internal & maintenance` (when present, prefix with the line `*No action needed by users; listed for completeness.*`)
7. `## Breaking changes / Migration` - optional, no emoji. Include ONLY when Phase 2 found breaking signals. Describe what breaks and the exact migration step. Omit the whole section when there are none.
8. `---`
9. Footer: `**Full changelog:** [\`<baseline>...<version>\`](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/compare/<baseline>...<version>)`

## Entry format

Each entry links one or more short commit hashes:
`- **Short title** - one clause of context. ([\`<hash>\`](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/<hash>))`

Multiple related commits go in one entry, comma-separated inside the parentheses.

## Conventional-commit type -> section mapping

- `feat`, `feat(scope)` -> New
- `fix`, `fix(scope)` -> Fixed
- a `refactor`/`feat` that removes a user-facing feature -> Removed (judge by the commit's content, not just its type)
- `refactor(ui)`, `style`, or a user-facing polish `fix` -> UX & polish (judge by content)
- `chore`, `ci`, `build`, `test`, `docs` -> Internal & maintenance

When a commit could fit two sections, place it where a user would look for it, not by its type prefix.

## Breaking-change signals (drive the Migration section and the major bump)

- `feat!` / `fix!` / `!:` in the subject, or `BREAKING CHANGE` in the body.
- A raised `minAppVersion` in `manifest.json`.
- A changed default for an existing setting.
- A removed or renamed command, setting, or default property key.

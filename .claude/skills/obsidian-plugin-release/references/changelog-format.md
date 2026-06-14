# Changelog format

This file fully specifies the changelog format - structure, labels, emoji headers, and per-section semantics. Follow it directly; there is deliberately no stored sample changelog to copy, because a fixed sample biases the content toward a past release instead of describing the one being shipped. The bold fragments below illustrate the SHAPE of a label, not text to reuse. Generate into `tmp/CHANGELOG-<version>.md` (the `tmp/` directory is gitignored; the changelog lives only in the GitHub release).

## Hard style rules

- Use the minus sign `-` only. Never an em dash or en dash anywhere. The compare-line separator is the middle dot `·` (the one allowed non-minus punctuation, see Structure).
- Plain, user-facing language consistent with the plugin's vocabulary: "property" not "frontmatter key", "date" / "date & time" not "timestamp". Keep implementation jargon out of prose. Inline code (`mtime`, `data.json`, a setting value) is fine when naming a concrete token a user could see.
- Detailed, not padded. Each entry earns its length by adding a real specific - a control name, a column, a strategy, a default, a worst-case. Length scales with the change: there is no line, sentence, or entry-count cap, and a big release or an intricate change should get a full, multi-sentence description rather than be trimmed to fit a size. The only thing to cut is padding - a sentence that restates the label without adding a specific.
- Ground every specific in the actual diff, commits, and source. The richer the description, the more this matters: never invent a column, strategy name, default, or "worst case" the code does not actually do. If you cannot verify a detail from the diff or by reading the code, leave it out. An inaccurate detail in a public changelog is worse than a shorter true one.

## Labels (the bold lead-in on every entry)

Every bullet in every change section leads with a bold label, then ` - `, then the explanation:
`- **Label** - explanation. ([hash])`

The label is a punchy noun phrase, not a full sentence. What it should name depends on the section, because a user scans labels to find whether a change affects them:

- **New / Removed / UX & polish / Internal**: the label names the thing itself - the feature, the removed action, the visible polish, the internal change. A short plain-language gloss in parentheses is good when the feature name alone is opaque, e.g. `**Find & fix out-of-order dates (last-edited earlier than created)**`.
- **Fixed**: the label names the BUG as the user experienced it - the broken behavior, in the past tense (`**Unix-seconds dates parsed as 1970**`, `**"Rebuild hash cache" was lost on reload**`, `**A corrupt data.json could crash startup**`). Do NOT frame the label as the resolved state ("parsed correctly", "no longer crashes"). Naming the symptom lets a user recognize whether they hit it; the body then explains the fix.

Highlights use a different label shape: a headline that ends with a period inside the bold, followed by a full sentence (see Structure step 4).

## Structure (in order)

1. `# Release <version>`
2. Compare blockquote, separator is the middle dot `·`:
   `> Compare: [\`<baseline>...<version>\`](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/compare/<baseline>...<version>) · N commits`
   Use `<baseline>...<version>` (the final version, never `main`) so the link stays stable after the branch moves.
3. One intro paragraph naming the release's theme. As long as the release warrants - a short paragraph for a small release, more for a big one.
4. `## Highlights` - the top user-facing wins, one per bullet: `- **Headline.** Sentence(s) summarizing the win.` The headline ends with a period inside the bold; no ` - ` separator and no commit links here (Highlights are the human summary, the change sections below carry the hashes). List every genuine highlight; do not cap the count.
5. `---`
6. Change sections, each with its emoji header. Every section is optional: include it only if it has at least one entry, and omit empty sections entirely (no empty header, no "None" placeholder). Headers, in this order:
   - `## ✨ New`
   - `## 🐛 Fixed`
   - `## 🗑️ Removed`
   - `## 💅 UX & polish`
   - `## 🧰 Internal & maintenance` (when present, prefix the bullets with the line `*No action needed by users; listed for completeness.*`)
7. `## Breaking changes / Migration` - optional. Include ONLY when Phase 2 found breaking signals. Describe what breaks and the exact migration step. Omit the whole section when there are none.
8. `---`
9. Footer: `**Full changelog:** [\`<baseline>...<version>\`](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/compare/<baseline>...<version>)`

## Skeleton (shape only - fill every placeholder with this release's real content; omit any section with no entries)

```text
# Release <version>

> Compare: [`<baseline>...<version>`](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/compare/<baseline>...<version>) · N commits

<one intro paragraph: the theme of this release>

## Highlights

- **<Win headline.>** <a sentence or two of plain context>

---

## ✨ New

- **<Feature name (plain gloss if opaque)>** - <what it does, the specifics a user sees, the default state>. ([<hash>](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/<hash>))

## 🐛 Fixed

- **<The bug as the user hit it, past tense>** - <symptom; Worst case: ... when data is at risk; the fix>. ([<hash>](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/<hash>))

## 🗑️ Removed

- **<What was removed>** - <why it was unsafe or misleading, and what now covers the need>. ([<hash>](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/<hash>))

## 💅 UX & polish

- **<The visible change>** - <the rule behind it>. ([<hash>](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/<hash>))

## 🧰 Internal & maintenance

*No action needed by users; listed for completeness.*

- <terse clause>. ([<hash>](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/<hash>))

---

**Full changelog:** [`<baseline>...<version>`](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/compare/<baseline>...<version>)
```

## Entry format and depth per section

Each entry ends with one or more short commit-hash links - bare hash, NO backticks - comma-separated inside one set of parentheses:
`- **Label** - explanation. ([abc1234](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/abc1234), [def5678](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/commit/def5678))`

(The compare-range link text in the blockquote and footer IS backticked; only the commit-hash link text is not.)

Cover this per section, judged by content not type. Use as many sentences as the change genuinely needs - there is no upper limit, and never trim real detail just to make an entry shorter. The only thing to cut is padding (a sentence that restates the label without adding a specific):

- **New** - what the feature does, the concrete specifics a user will see (the controls, columns, strategy names, the inline order picker, etc.), and its default state (on / off / opt-in). Disabled-by-default safety features must say so.
- **Fixed** - after the bug-named label, state the symptom, the worst-case impact when it actually bites (open with a `Worst case: ...` clause when a bug could corrupt or lose data), and the fix. Lead with what went wrong, close with how it is resolved.
- **Removed** - what was removed, why it was unsafe or misleading, and what now covers the real need.
- **UX & polish** - the visible change and the rule behind it (e.g. red iff the action replaces or deletes existing values).
- **Internal & maintenance** - what changed. Keep these terse since users take no action, but completeness still beats brevity.

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

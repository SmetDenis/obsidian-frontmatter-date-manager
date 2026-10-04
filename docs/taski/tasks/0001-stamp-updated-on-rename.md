---
id: 1
title: Stamp the last-edited date when a note is renamed (opt-in)
description: 'New setting, off by default: a rename made inside Obsidian counts as an edit and goes through the normal update pipeline; renames arriving via sync or the OS never reach it.'
status: todo
stage: main
size: L
priority: normal
kind: feature
links: ['https://github.com/SmetDenis/obsidian-frontmatter-date-manager/issues/26']
deps: []
soft_deps: []
area: [events, pipeline, ui]
created: 2026-10-04
---

# #1. Stamp the last-edited date when a note is renamed (opt-in)

<!-- taski:meta:start -->
- **Status:** 📎 todo
- **Stage:** main. Plugin work
- **Size:** 🌳 L
- **Priority:** 🔵 normal
- **Kind:** ✨ feature
- **Links:** <https://github.com/SmetDenis/obsidian-frontmatter-date-manager/issues/26>
- **Areas:** Vault events (rename, create, delete), Automatic dates pipeline, Settings, UI and translations
<!-- taski:meta:end -->

## Why

GitHub issue 26 (reporter `anstapabol`, 2026-10-03): the requester treats renaming a note as a deliberate edit, because the file name is the note's title. Today a rename changes neither the content nor the file's mtime, so the last-edited date never moves. The requester runs a local patch on plugin 1.6.0 that writes outside the plugin's update pipeline and skips most of its safety checks; it was reviewed and rejected (see Sources). The scope below was agreed with the requester on the issue on 2026-10-04. If this task is never done, the requester stays on an unsafe patch and the request stays open.

## What

A new setting, off by default. When it is on, renaming a Markdown note inside Obsidian counts as an edit of that note.

- **Which renames count.** Renames made inside Obsidian on this device: the inline title, the tab title, F2, the file explorer (including its context-menu "Rename"), the rename dialog, and scripts or plugins that call Obsidian's rename API (`fileManager.renameFile`). The requester renames mostly through the context menu and sometimes through scripts, and wants both counted.
- **Same path as a content edit.** The rename goes through the same update pipeline as a normal edit, with every existing check: the "Automatic dates" switch and the pause, "Track last-edited date", filter rules, the unsaved-editor and Excalidraw write guards, "Minimum seconds between updates", the "already fresh" check, the date-order fix strategy.
- **Full edit semantics** (agreed with the requester, who has no preference and asked for consistency): increments `updated_count` when the counter is enabled, fills a missing `created`, runs "Command after update".
- **Only a name change counts.** Moving a note to another folder under the same name does not count; a move that also changes the name does; a case-only rename counts.
- **Create-then-rename is not an edit.** A note still inside the new-file delay window (Templater and QuickAdd create a note and rename it right away) is not stamped by its rename. With the delay set to 0 there is no window; the setting's description says so.
- **Sync and the OS are out of reach by design.** Renames arriving through sync (Obsidian Sync, Synology Drive, iCloud, Syncthing, git) or made in the OS file manager reach Obsidian as a delete plus a create, never as a rename (verified in the Obsidian 1.13.4 bundle, see Sources), so they are never stamped. The stamp made on the original device syncs over like any other edit, with no second stamp. The requester (Synology Drive) confirmed this is the wanted behaviour.
- **The stamp records the moment of the rename,** even when the write is deferred (decided in this session: it keeps the "already fresh" check meaningful for date formats with seconds; the requester uses minute precision and has no preference).
- **A pending stamp is never lost and never late.** It survives every deferral the pipeline already has (unsaved editor changes, the rate limit, a busy file, a running bulk operation) and is dropped when its preconditions go away: automatic dates turned off or paused, the setting turned off, the note deleted, the plugin unloaded, settings changed by sync.
- **Setting off means today's behaviour, byte for byte.**

**Not in scope.**

- Rename and rename back within a few seconds gets no special handling; whatever the pipeline produces is fine (requester: "one stamp is perfectly acceptable").
- A manual "Set last-edited date to now" command (requester: a nice extra, not a replacement) - a separate task if it is ever wanted.
- Heading renames and property renames (no rename event exists for them).
- Any change to the experimental option that skips stamping other notes whose links a rename rewrote.

**Open forks, to put to the user at entry** (asked on 2026-10-04 and declined at that moment, so still open):

1. **Which rename events count.** (a) Every rename the vault reports - no hidden API, but also stamps the "(Conflicted copy)" renames Obsidian Sync makes in its "create conflict file" mode, and plugins that use the low-level `vault.rename`. (b) Only renames through Obsidian's file manager - more precise, but relies on an undocumented Obsidian field, so the setting could silently stop working after an Obsidian update. Recommendation: (a).
2. **Where the setting lives.** Under "Track last-edited date", visible only when that date is on (easy to find; the store screenshots must be regenerated), or on the Advanced sub-page next to the experimental rename option. Recommendation: under "Track last-edited date".
3. **Excalidraw drawings.** Stamp them like any note (the existing guards apply; a long-idle open drawing may visibly reload) or exclude them. Recommendation: like any note.

**How.** The rename listener and the shared write path in `src/main.ts` (the `vault.on('rename')` handler, `migratePendingWork`, `handleFileChange`, `computeFrontmatterUpdates` and its `fillMissingOnly` option as the pattern for a per-pass option, `scheduleRetry`); the setting in `src/Settings.ts` with `sanitizeSettings` and every locale under `src/i18n/locales/`. The decision record in Sources lists the pitfalls two independent reviews found in the first design (the self-write check runs before the hash check, manual-origin coalescing, bulk runs not checked on the retry path, the self-link rewrite after the "Update links" dialog). Landmarks, not a description - the code may have moved since this was written; check them before relying on them.

## Done criterion

1. With the setting off, every existing unit and e2e test passes unchanged, and a new test shows that a rename writes nothing.
2. With the setting on, unit tests show: a name change stamps the last-edited date once, through the normal pipeline; a pure folder move stamps nothing; a rename inside the new-file window stamps nothing; a rename while the editor holds unsaved changes is stamped after the save - never lost, never written into the unsaved buffer; turning automatic dates off, pausing, turning the setting off, deleting the note and unloading the plugin each drop a pending stamp; the counter goes up by one; a missing `created` is filled.
3. e2e on a real Obsidian 1.13.4: renaming through the file explorer and through the inline title stamps the renamed note and no other note; a pure move stamps nothing; a note that links to itself, renamed with the "Update links" dialog left open, has its observed stamp count recorded by the test.
4. `make pre-commit` passes; README (settings table), CLAUDE.md (key pattern) and `docs/` describe the setting; the store screenshots are regenerated if the setting lands on a captured surface.
5. The requester has been offered a BRAT pre-release on the issue, and their result (or the fact that they were asked) is recorded here.

## Knowledge

Generated: the records this task rests on - those that came out of it, those its body links or mentions, then those sharing an `area`. Capped and never edited by hand - look wider with `taski knowledge --area <term>`.

<!-- taski:knowledge:start -->
—
<!-- taski:knowledge:end -->

## Consider

## Sources

- GitHub issue 26 (link in the frontmatter) - the request, the requester's patch, and the requester's answers of 2026-10-04 that fixed the scope above.
- [docs/decisions/rename-as-edit.md](/docs/decisions/rename-as-edit.md) - the Obsidian 1.13.4 rename internals read from the bundle (sync and OS renames never fire a rename event; every core rename path goes through the file manager; self-links are rewritten after the dialog), why the requester's patch was rejected, the candidate design and the holes both reviewers found.
- [docs/decisions/rename-induced-link-updates.md](/docs/decisions/rename-induced-link-updates.md) - the opposite request (GitHub issue 18) and the shipped experimental option this feature must coexist with.

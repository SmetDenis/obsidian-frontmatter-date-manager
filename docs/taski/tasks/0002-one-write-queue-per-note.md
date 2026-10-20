---
id: 2
title: 'fix: One queue per note for every date write, so none is lost or doubled'
description: 'A bulk tool running at the same moment as a pending date update can swallow it or write it twice, so a note quietly keeps a date that misses the edit the user just made.'
status: todo
stage: main
size: M
priority: normal
kind: fix
deps: []
soft_deps: []
area: [guards, pipeline, bulk]
created: 2026-10-20
---

# #2. fix: One queue per note for every date write, so none is lost or doubled

<!-- taski:meta:start -->
- **Status:** 📎 todo
- **Stage:** main. Plugin work
- **Size:** 🌿 M
- **Priority:** 🔵 normal
- **Kind:** 🐛 fix
- **Areas:** Write-safety guards, Automatic dates pipeline, Bulk operations
<!-- taski:meta:end -->

## Why

The plugin does not stamp a note the instant it changes. It waits a couple of seconds, and waits longer while the note is open with unsaved changes. If the user starts one of the bulk tools during that wait - filling dates from the file system, rebuilding the change-detection cache, renaming a property across the whole vault - the bulk run and the waiting update meet over the same note. The waiting update can then be dropped as if the note had never changed, or land on top of the value the bulk run has just written.

Nobody has reported this. It was found while hardening the write path for notes open in the editor, and it is a mechanism rather than an observed bug: the note's text is never damaged. What can quietly go wrong is the date itself. A note keeps a last-edited date that misses the edit which earned it, and a wrong date is the one thing this plugin exists to prevent.

The gap was written down in the project's own guidance while fixing the write guard for notes with unsaved editor changes (GitHub issue 10), which widened it, and it came up again while the rename feature was being designed, where two independent reviews pointed at the same place. See [#1](/docs/taski/tasks/0001-stamp-updated-on-rename.md), which rides the same write path.

## What

Every date the plugin writes into a note goes through one queue for that note: the creation date, the last-edited date, the last-opened date and the writes the bulk tools make. While one of them is writing, the others wait their turn instead of racing. An update still waiting to be written survives a bulk run passing over the same note. And the plugin tells its own writes apart by what it wrote rather than by the clock, so a write somebody else made is never taken for one of its own.

Not included: when dates are written, which dates exist and every existing setting stay exactly as they are, and nothing here is a switch a user has to find and turn on. The guard that keeps the plugin out of a note with unsaved editor changes, and the one that keeps it out of a drawing being edited, stay as they are. Making bulk runs faster is not part of this task.

The details:

- One lock per note, taken by every path that writes dates: the automatic pass after an edit, the last-opened stamp and every bulk operation. Today only the automatic pass takes it, so a bulk write can begin while an automatic one is already under way.
- A bulk run must not refresh a note's change-detection fingerprint while an update for that note is still waiting. Either the waiting update survives the refresh and is written afterwards, or it is deliberately run again; it must not be absorbed in silence.
- The way the plugin recognises its own writes changes. Today it remembers the note's modification time right after writing and ignores the change notification carrying that time. Times can coincide, and two writes a second apart look alike, so a fingerprint of the content it actually wrote identifies the write instead.
- What must not change: no write happens unless a value would really differ, nothing is written into a note with unsaved editor changes, and the preview a user sees before a bulk run still describes exactly what the run then does.

Estimated as a medium result: there is no new setting and no translation work, but arranging two writes to meet on one note inside a test is the part most likely to grow.

The mechanism, measured once: read in Obsidian's own code (version 1.12.7, read 2026-08, and a hypothesis by the time this task is taken), the calls this plugin uses to change a note's properties run through a single serial chain inside Obsidian, so two overlapping writes cannot leave damaged text behind - they interleave as whole read-modify-write units. What they can do is make one write redundant or replace the other's value. Eleven scripted scenarios driving a real Obsidian failed to reproduce any loss of note text, which is why this is recorded as a mechanism with no observed occurrence.

**How.** `src/main.ts` holds the per-file processing lock, the automatic change handler, the file-open stamp, the retry scheduler and the self-write marker; `src/bulk/write.ts` is the single helper every bulk modal writes through, and `src/bulk/executePhase.ts` owns the flag saying a bulk run is in progress. Landmarks, not a description - the code may have moved since this was written; check them before relying on them.

## Done criterion

1. Unit tests cover the three cases that were only reasoned about before: a pending update is not lost when a bulk run passes over the same note while it waits; an automatic write and a bulk write on one note never overlap; a write made outside the plugin is not mistaken for one of the plugin's own.
2. An end-to-end run against a real Obsidian starts a bulk populate while a note is waiting for its stamp, and both the bulk result and the pending stamp come out correct.
3. Every existing test passes unchanged, and what a bulk preview promises still matches what the run writes.
4. `make pre-commit` passes, and the project guidance describing the write path no longer carries this gap as a separate open task.

## Results

## Knowledge

Generated: the records this task rests on - those that came out of it, those its body links or mentions, then those sharing an `area`. Capped and never edited by hand - look wider with `taski knowledge --area <term>`.

<!-- taski:knowledge:start -->
—
<!-- taski:knowledge:end -->

## Consider

## Sources

- [#1](/docs/taski/tasks/0001-stamp-updated-on-rename.md) - the rename feature rides the same write path, retry scheduler and bulk interplay; whichever of the two lands second has to fit the other.
- The project's guidance file records this gap under the write guard for notes with unsaved editor changes, together with the Obsidian finding that overlapping writes cannot damage a note's text.
- GitHub issue 10, https://github.com/SmetDenis/obsidian-frontmatter-date-manager/issues/10 - the editor write guard whose fix widened this gap and whose scenarios failed to reproduce any data loss.

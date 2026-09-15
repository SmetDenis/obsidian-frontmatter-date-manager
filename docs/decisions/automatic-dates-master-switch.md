# Decision record: the "Automatic dates" master switch (issue #24)

- **Status:** ACCEPTED and BUILT (2026-09-15). Maintained summary: `CLAUDE.md` -> "Automatic dates master switch".
- **Driver:** [issue #24](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/issues/24) - "Split auto-update setting from new-file creation-date timestamp" (reporter `n-konig`, label `enhancement`).
- **Plugin version at time of analysis:** 1.5.1.
- **Reviewed by:** an independent Codex (gpt-5.6-sol) pass and an independent Fable pass; every code claim below was re-verified against the source.

## 1. The report

A user who wanted only `created` turned off "Track last-edited date" and "Track last-opened date", and also left "Auto-update" off because its text ("Automatically update dates when you edit a note") read as `updated`-only. Automatic `created` stamping silently stopped. The reporter pointed at `if (!this.settings.enableAutoUpdate) return;` at the top of the `modify` listener and proposed completing the new-file path whenever `enableCreateTime` is on.

## 2. Root causes (not the one `return`)

1. **A master switch named after one of its outputs.** `enableAutoUpdate` gated every automatic write (`created`, `updated`, `viewed`, rename suppression). Its label, its position (two groups below the date toggles), and its status bar text ("Paused", the same word as the 5-minute pause) all hid that. Mobile had no signal at all.
2. **The switch was only an admission check.** It was tested when an event arrived, never when queued work ran. The 2 s debounce, the dirty-buffer deferral, the rate-limit retry, the lock retry and the new-file window expiry all wrote after the switch was turned off or a pause started.
3. **There is no on-create writer.** `created` is a fill-if-missing side effect of processing an edit (`computeFrontmatterUpdates`). The `create` listener only arms the new-file window. Docs claimed "`created` on file creation".
4. **New-file window defects.** The `create` listener was registered in `onload` (Obsidian fires `create` for every existing file during vault load); a rename inside the window lost the pending processing (the timer captured the old path, the rename handler did not migrate); a modify inside the window during a bulk run was dropped.
5. **The documented fallback did not work.** The manual command bypassed the switch but not the hash gate, so it could not re-add a deleted `created` on unchanged content.

## 3. Options considered

| Option | What | Verdict |
| --- | --- | --- |
| B. Reporter's decoupling | Write `created` even with the switch off | **Rejected.** Breaks the kill switch for existing `enableAutoUpdate: false` users (imports, sync storms) - they would silently start getting writes. Inconsistent: new notes would get `created`, old notes edited while off would not. Does not help notes that arrive with content and are never edited. |
| A. Wording only | Rename + describe the switch | **Insufficient** - leaves causes 2, 4, 5 in place. |
| C. Enforced, explained master switch + lifecycle fixes | This record | **Built.** |
| D. Opt-in "stamp `created` when a note appears" mode | Write on `create` after the window, without an edit | **Deferred to a separate task.** A `create` event does not mean "authored now": sync pulls, imports, restores and copies would record pull/import time as the creation date and push it back through sync. Needs its own opt-in, warning and e2e (incl. Excalidraw). The `onLayoutReady` registration done here is its prerequisite. |

## 4. What was built (option C)

- **One gate, checked twice.** `automaticDatesAllowed()` = switch on and not paused. Checked on event admission, at the top of `handleFileChange` (before any read), right before `processFrontMatter`, and before the `viewed` write.
- **Work origin.** `WorkOrigin = 'auto' | 'manual'`. The manual command and its own deferred retries run regardless of the switch (e2e D3 depends on it). One `scheduleRetry(file, delay, origin)` replaced four copies of the coalesced timer; `manualPending` keeps a manual request alive when an automatic debounce re-arms the shared per-file timer.
- **No silent catch-up.** A dropped automatic pass does not refresh the hash; the next edit after re-enabling detects the change. Chosen over replaying queued work, which would write at a moment the user did not expect.
- **Manual fill-missing mode.** A manual pass on content whose hash matches the cache adds only missing `created`/`updated`, keeps an existing `updated`, never counts an edit, schedules no retry, and skips the out-of-order fix (it would rewrite an existing value with no change to justify it; "Find out-of-order dates" stays the explicit tool). Rejected alternative: a full refresh that also moves a stale `updated` to mtime - after a sync, mtime is the sync time, not an edit.
- **New-file lifecycle.** `create` registered inside `workspace.onLayoutReady`; the window timer captures the `TFile` and a deadline; `migratePendingWork` re-arms the window (remaining time, remembered modify) and any pending retry (with its origin) under the new path; the window is extended while a bulk run is in progress; the in-window modify is remembered even during bulk.
- **UI.** The switch is renamed "Automatic dates" and is the first row of the dates group; a hint row appears while it is off and any date is enabled; the status bar shows `FDM: on` / `FDM: off` / `FDM: paused (Xm)` under a new `statusBarMode` setting (`always` / `when-inactive` default / `never`); status bar clicks and the toggle command go through `setAutomaticDates()`, which also refreshes the settings snapshot; pausing while off is a no-op with its own notice, and the resume notice is skipped if the switch was turned off meanwhile.
- **Naming rule for "FDM".** The short prefix only where space is scarce and the owner is not obvious (the status bar, shared by all plugins). The full plugin name in notices that arrive without a user action (the resume notice). Nothing extra where Obsidian already shows the plugin (command palette, the plugin's settings tab).
- **Compatibility.** Persisted key `enableAutoUpdate` and command ids `toggle-auto-update` / `pause-auto-update` unchanged; new key `statusBarMode` with a default equal to the old behavior. Release level: MINOR.

## 5. Accepted residuals

- A `create` event without a later edit still never stamps `created` (option D, separate task).
- Pausing or switching off drops, not defers, automatic work; edits made during that time are dated on the next edit after re-enabling.
- `lastPluginWriteMtime` is not migrated on rename: a self-triggered modify arriving under the new path costs one extra pass that ends at the hash gate.

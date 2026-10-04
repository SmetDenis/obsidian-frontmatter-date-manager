# Decision record: stamp `updated` when a note is renamed (issue #26)

- **Status:** SCOPE AGREED (2026-10-04) - the requester answered every question (section 6); Design B is the plan and the work is tracked in the project's task registry. Nothing built yet; three product forks remain for the maintainer (section 7).
- **Driver:** [issue #26](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/issues/26) - "Option to update the modified date when a note is renamed" (reporter `anstapabol`, label `enhancement`). The reporter runs a local patch on 1.6.0.
- **Plugin version at time of analysis:** 1.6.0.
- **Reviewed by:** an independent Codex (gpt-6-astra, high) pass and an independent Fable pass, both blind to authorship; the Obsidian internals below were read from the shipped `obsidian-1.13.4.asar` and the key claims re-checked by hand.

## 1. The request

Renaming a note changes neither its content nor its mtime, so the modify pipeline never runs and `updated` stays put. The reporter treats a rename as a deliberate edit and asks for an opt-in: on `vault.on('rename')`, if the basename changed, set `updated` to now after the usual debounce, skipping pure moves and files inside the new-file window.

This is NOT a bug and NOT a regression: the `rename` handler (`src/main.ts`) only migrates per-path state (hash-cache entry, pending timers via `migratePendingWork`, the experimental rename-link suppression for OTHER notes). It is the mirror image of issue #18 (there: "a link rewrite is not an edit"; here: "a rename is an edit") - both camps exist, so any behaviour is opt-in, default off.

## 2. Verified facts about Obsidian 1.13.4 (read from the bundle)

Method: extract `app.js` from `e2e/.obsidian-cache/obsidian-app/obsidian-1.13.4.asar` (plain archive, a short script suffices), pretty-print it, search by the names below.

- **R-1 `renameFile` path (re-confirms F-A / F-G of `rename-induced-link-updates.md`).** `FileManager.renameFile(f, p)` is `runAsyncLinkUpdate(() => vault.rename(f, p))`, with no folder branch. `runAsyncLinkUpdate` sets `inProgressUpdates = []` around `await op()` (plus the drain of nested ops) and resets it to `null` in `finally`, BEFORE `updateAllLinks` (the "Update links" modal or the silent rewrite). Only the constructor and `runAsyncLinkUpdate` assign `inProgressUpdates`. Other callers: the multi-file move (every item renamed inside ONE `runAsyncLinkUpdate`), and the note composer extract/merge (array set, nothing renamed). A nested call pushes the op and returns immediately.
- **R-2 UI paths.** All core rename/move UI goes through `runAsyncLinkUpdate`: file-explorer inline rename, the rename modal, inline title and tab-header title (`saveTitle`), F2 (`workspace:edit-file-title`), single and multi drag-and-drop, cut/paste, "Move file to...", "New folder with selection", Bases card drop, the Obsidian CLI move/rename. No core UI path calls `vault.rename` directly. Moves therefore set the array too - a "basename changed" check is mandatory.
- **R-3 Obsidian Sync never replays a rename on the receiving device.** The sender transmits it (`previouspath` sent as `relatedpath`), but the receiver decodes only `path` + `hash`; `relatedpath` is used only by the push sender and the version-history UI. The old path is applied as `vault.delete` / `adapter.remove`, the new one as `adapter.writeBinary` (sender's `ctime`/`mtime`) or `vault.modifyBinary`. So a receiver sees `create` + `delete`, never `rename`. Sync's only own renames are conflict handling, all with `inProgressUpdates === null`: `vault.rename(file, "<name> (Conflicted copy)")`, and two `adapter.rename` calls for folder case/type collisions.
- **R-4 External renames (Finder/Explorer, iCloud, Syncthing, git) never reach the plugin as a rename.** The desktop `fs.watch` `change` callback ignores the event type and reconciles each path independently: old path -> `delete` (after a 100 ms recheck), new path -> `create`. Only `adapter.rename` emits `renamed`.
- **R-5 mtime.** The desktop adapter renames with `fsPromises.rename` and re-keys the same stat record without re-statting; the vault's `renamed` handler only calls `setPath`. `TFile.stat.ctime` is `birthtimeMs`. That the OS itself keeps mtime on rename is inferred (POSIX/NTFS), not verified. Mobile: `CapacitorAdapter.rename` calls a native Filesystem plugin whose implementation is not in the bundle - UNKNOWN whether it keeps mtime.
- **R-6 Case-only rename** (`note.md` -> `Note.md`): allowed, one `fs.rename`, one `rename` event.
- **R-7 Self-links.** The renamed note's own links are re-resolved from its new path and rewritten by a plain `vault.process` AFTER the `finally` (after the modal). Sequence: `rename` -> (modal) -> `modify` of the same note, which the normal pipeline already stamps today.
- **R-8 No provenance signal.** There is no dedicated rename event or operation id; `fileBeingRenamed` belongs to individual UI components.

Consequences: (a) the feature can never create a second stamp on a synced device - the receiver has no rename to react to, the first device's stamp syncs over like any edit; (b) "renames made outside Obsidian do not count" is a limit of Obsidian, not a design choice; (c) plugins that call `fileManager.renameFile` (Templater, QuickAdd, title-to-filename plugins) are indistinguishable from the user.

## 3. Design A - the reporter's patch: REJECTED

A second writer next to the pipeline (own `processFrontMatter`, own self-write token, own cache refresh, own 3-try retry). Both reviewers rated it "doesn't hold":

- skips `enableModifiedTime` (writes `updated` with "Track last-edited date" off), raw-identity and `FRESHNESS_SEC`, the rate limit, the inversion fix, the counter, the `created` fill, and the execution-time `automaticDatesAllowed()` re-check;
- lock check and lock acquisition are split by an await (`processingFiles.has` before `getWriteBlock`, `.add` after);
- bare `window.setTimeout` outside `modifyTimers`: not cancelled on delete/unload, not migrated on rename, N renames -> N writes; a still-dirty note is silently dropped after 3 tries;
- `populateCacheForFile` after an unconditional write can absorb a pending real edit (the project deliberately never refreshes the hash on a deferral).

## 4. Design B - route the rename through the pipeline: the candidate

On `rename` (after `armRenameSuppression`, which stays first and synchronous; before the cache-miss early return), if the toggle is on, automatic dates are allowed, the file is a Markdown `TFile` whose basename changed, and it is not in the new-file window (checked AFTER `migratePendingWork`): record `renamePending.set(newPath, renamedAt)` in a dedicated map and schedule an ordinary pass. That pass bypasses the "hash unchanged" ignore and uses `max(stat.mtime, renamedAt)` as the modified-time candidate (a virtual mtime bump), threaded like `fillMissingOnly`. All existing guards then apply.

Both reviewers: "holds with caveats". "All guards apply unchanged" was wrong - B needs an explicit marker state machine:

- **Survive deferrals, clear on write or drop.** A rename cannot be rediscovered from the hash, so the marker must persist across the dirty-buffer / Excalidraw-busy / rate-limit / lock deferrals (an inline-title rename almost always happens with a dirty buffer), and be cleared on a real write, an accepted no-op, any drop (automatic dates off, Excalidraw dirty, ignored), and explicit cancellation (toggle off, pause, external settings change, delete, unload). A marker left behind would let the next no-op sync `modify` bypass the hash gate. Clear only the marker the pass consumed, so a newer rename arriving during an await survives.
- **The self-write token** check at the top of `handleFileChange` runs before the hash gate and can swallow the rename pass (a `viewed` or bulk write can set a new token first).
- **Manual origin.** `scheduleRetry` keeps a pending manual origin, and an unchanged-content manual pass runs `fillMissingOnly`; rename eligibility must stay separate from pass origin, so an automatic rename cannot ride a manual authorization while automatic dates are off.
- **Bulk.** `bulkRunning` is checked only by the `modify` listener, not by `scheduleRetry` / `processFileWithLock` / `handleFileChange` - decide drop vs defer during bulk and enforce it at execution.
- **Side effects of full pipeline reuse** (need explicit acceptance): fills a missing `created`, increments `updated_count`, runs "Command after update", and the inversion fix sees the virtual mtime (`max-all` / `created-to-updated` could set `created` to the rename time; strategy default is `disabled`).
- **Self-link double stamp** (R-7): with the "Update links" modal open longer than the debounce, the rename stamps first and the self-link rewrite stamps (and counts) again.
- **Rename-back** `A -> B -> A` stamps twice unless the marker remembers the basename at first arming.
- **`delayForNewFiles = 0`**: no window exists, so create-then-rename automation is stamped (harmless - it coalesces with the template's own modify pass).

### The `inProgressUpdates` gate - demoted, undecided

Originally proposed as the sync discriminator. R-3/R-4 make that unnecessary: sync and external renames never fire `rename`. What the gate still excludes: Sync's "(Conflicted copy)" renames and third-party plugins calling bare `vault.rename`. Its cost (Fable): it is an undocumented internal, and on drift the enabled toggle would silently never write - against the project's "no silently inert enabled-but-never-writes toggle" rule. Open choice: keep the gate (accepting the inert-on-drift risk, perhaps with a dev tripwire), or drop it and exclude conflicted copies another way, or accept stamping them. Also note (Codex, inferred): the array is instance-wide, so an unrelated `vault.rename` landing during another rename's `await op()` would pass.

## 5. Alternatives considered

- **Manual "Set last-edited date to now" command** - no internals, no provenance question, user picks the moment; not automatic. The existing "Update timestamps for current file" does NOT help: on unchanged content it runs fill-missing and keeps `updated`.
- **Separate `renamed` property** - keeps `updated` meaning "content changed", no interplay with counter/inversion/freshness; but the reporter's queries read `updated`, and it adds a key.
- **Active-file heuristic** (`workspace.getActiveFile()`) - catches inline title / F2, misses explorer renames of other notes; still a heuristic.
- **Do nothing** - one requester so far, who already has a local patch.

## 6. Questions posted to the requester (2026-10-04)

1. How do you rename (inside Obsidian vs plugins)? Plugin renames through Obsidian's API would count - wanted?
2. Should a rename behave exactly like an edit (counter, `created` fill, "Command after update"), and should `updated` be the rename time even when the write is delayed?
3. Rename and rename back within seconds: 0, 1 or 2 updates?
4. Would a manual "Set last-edited date to now" command cover the need?

Plus: willing to test a BRAT pre-release?

(The posted comment lost chunks of questions 2-4 and of the last sentence when it was copied from a terminal; the requester reconstructed them correctly.)

### The requester's answers (issue comment, 2026-10-04)

1. **Renames:** mostly the file context menu "Rename"; occasionally scripts calling `fileManager.renameFile` - those must count too. Create-then-rename by Templater/QuickAdd is part of creating the note and should not stamp (the new-file window). Both context-menu paths were then checked in the 1.13.4 bundle: the file-explorer menu goes `startRenameFile` -> inline rename -> `fileManager.renameFile`, the tab/file menu goes `promptForFileRename` -> rename dialog -> `fileManager.renameFile`.
2. **Rename = edit:** yes, same pipeline and same guards; no preference on the counter, the `created` fill or "Command after update" - consistency with a normal edit. Uses minute precision (`yyyy-MM-dd'T'HH:mm`), so rename time vs write time makes no difference to them.
3. **Rename-back:** either way is fine; not worth extra complexity.
4. **Manual command:** a nice extra, not a replacement - the point is that the date stays correct without remembering anything.
5. **Sync:** Synology Drive (not Obsidian Sync); delete + create on the other device with the stamp syncing over is exactly the wanted behaviour (consistent with R-4).

### Consequences for Design B

- Full pipeline reuse with no exceptions: counter, `created` fill and "Command after update" all apply.
- The rename-back basename memory is dropped from B.
- The stamp records the moment of the rename (`renamedAt`), decided by the maintainer: it keeps the freshness guard meaningful for second-precision formats.
- The manual command is out of scope.

## 7. What would move this forward

- Three product forks for the maintainer, each with a recommendation: (1) count every `rename` event the vault reports (no internal API; also stamps Sync "(Conflicted copy)" renames and plugins using bare `vault.rename`) vs only `fileManager.renameFile` renames via the `inProgressUpdates` gate (precise, but inert on drift) - recommended: every event; (2) setting placement under "Track last-edited date" (regenerate screenshots) vs the Advanced sub-page - recommended: under the date; (3) Excalidraw drawings stamped like any note vs excluded - recommended: like any note.
- The marker state machine written down with unit tests, plus e2e for an inline-title rename with a dirty buffer, case-only rename, the self-link + modal case, and a dirty/idle Excalidraw drawing.
- Unknown and worth a probe before claiming mobile support: whether the native mobile rename keeps mtime.

## 8. Related

- `docs/decisions/rename-induced-link-updates.md` (issue #18) - the opposite request; its F-A / F-G are re-confirmed by R-1 above.
- `CLAUDE.md` -> "Experimental rename-link suppression", "Automatic dates master switch", "Dirty-editor-buffer write guard", "Excalidraw drawings".

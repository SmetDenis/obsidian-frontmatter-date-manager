# Work spec: experimental "skip the date after a rename" option

- **Status:** **BUILT and shipped (2026-09-04).** All acceptance criteria in section 8 are met; the section 9 pre-check passed on a live Obsidian 1.13.4. See [Build notes](#12-build-notes-2026-09-04) for what changed against this spec. The maintained record now lives in `CLAUDE.md` -> "Experimental rename-link suppression"; this file is kept as the original brief.
- **Type:** new feature behind a flag. Opt-in, default off, labelled experimental.
- **Issue:** [#18](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/issues/18)

This document is self-contained. You do not need any other context to build it.

---

## 1. What you are building

Today: when the user renames note `A`, Obsidian rewrites the `[[A]]` links inside notes `B`, `C`, `D`. Those files change on disk, the plugin sees a real content change, and stamps a fresh `updated` on `B`, `C`, `D` even though the user never opened them.

The feature: an opt-in setting that skips the `updated` stamp on `B`, `C`, `D` **when the only difference is the link rewrite Obsidian just performed** - and stamps normally in every other case.

### The one rule that governs every decision below

> **The feature must fail toward stamping, never toward not stamping.**

An extra `updated` is cosmetic and visible. A missing `updated` is silent and the information is gone. Whenever anything is uncertain, unexpected, out of range, or simply not understood by your code, do nothing and let the normal pipeline stamp the file.

The mechanism is built so that this holds automatically: you **predict the exact bytes** Obsidian should have written and compare the whole file byte for byte. If your prediction is wrong for any reason, the comparison fails, nothing is suppressed, and behaviour is identical to today. **A bug in your prediction costs coverage, never data.** Design every branch to preserve that property.

---

## 2. Obsidian facts you need

These were extracted from `obsidian-1.13.7.asar`. Some are undocumented internals; each is marked. Read all of section 2 before writing code.

### 2.1 Event order (documented behaviour, verified)

`FileManager.renameFile(file, newPath)` internally does, in this order:

1. snapshots every link reference in the vault (pre-rename state),
2. performs the actual rename, which fires the vault `rename` event,
3. **then** rewrites the links in every file that pointed at the old path.

So your `rename` listener runs **before** any link has been rewritten. That is the window in which you take your snapshot.

### 2.2 Link rewrites are indistinguishable from human edits

The rewrites are applied with a plain `vault.process`, producing an ordinary `modify` event with no flag, no operation id and no dedicated event. **This is why the feature works by prediction and byte comparison rather than by detecting anything.**

### 2.3 The rewrite can be delayed indefinitely, but its completion is awaitable

Obsidian's setting "Automatically update internal links" defaults to **off**, in which case Obsidian shows a modal (`Always update` / `Just once` / `Do not update`) and waits for a click. The user can leave it open for hours.

**Internal, undocumented.** `app.fileManager.updateQueue` is an object of this shape:

```js
{
  promise: Promise,
  queue(fn) { const t = this.promise.then(fn, fn); this.promise = t; return t }
}
```

`renameFile` queues its whole operation, modal wait included, onto this queue. So the value of `app.fileManager.updateQueue.promise` **read at the moment of the rename event** settles after the link rewrites are done.

Two traps:
- `promise` is a **mutable field** reassigned on every `queue()` call. Read it once, at arming time. Do not read it again later.
- It **can reject**. `.then(fn, fn)` only means the next queued item still runs after a failure; it does not make this promise non-rejecting. Always `await` it inside `try/catch`.

### 2.4 Telling a link-updating rename from a plain one

**Internal, undocumented.** `app.fileManager.inProgressUpdates` is `null` at rest. `renameFile` sets it to `[]` immediately before performing the rename and restores `null` afterwards.

So **during** your `rename` listener it is an **array** for a rename that will rewrite links, and `null` for a plugin calling the public `Vault.rename()` (which never rewrites links). Use this as your gate: if it is not an array, do nothing.

### 2.5 A folder rename fires one event per moved child

Renaming or moving a folder fires a `rename` event for the folder plus one for **every** file inside it. v1 does not support this (see section 4).

### 2.6 How Obsidian rewrites one link - reproduce this exactly

This is the only grammar you must implement. The hard part is not here: choosing between shortest / relative / absolute link form depends on the whole vault, and **Obsidian exposes it publicly** as `metadataCache.fileToLinktext(file, sourcePath, omitMdExtension)`. Call it; do not reimplement it.

For each reference, Obsidian computes:

```
isWikilink   = /^(!?\[\[)(.*?)(\|(.*))?(]])$/.test(ref.original)
subpath      = parseLinktext(ref.link).subpath          // "" or "#Heading" or "#^blockid"
newLinktext  = metadataCache.fileToLinktext(renamedFile, sourceFile.path, isWikilink) + subpath
```

and rewrites the reference **only when `ref.link !== newLinktext`**. Reproduce that condition too.

The wikilink replacement itself:

```
const WIKILINK = /^(!?\[\[)(.*?)(\|(.*))?(]])$/;

function rewriteWikilink(original, newLinktext) {
  const m = original.match(WIKILINK);          // [, open, linkPart, _, alias, close]
  const [, open, linkPart, , alias, close] = m;

  if (!alias) return open + newLinktext + close;

  const pipe = original.includes('\\|') ? '\\|' : '|';
  let outAlias = alias;

  // Obsidian rewrites the visible text too, but ONLY when the OLD link had a path
  // component AND the alias equalled the old basename.
  if (linkPart.includes('/') && basename(linkPart) === alias.trim()) {
    outAlias = basename(parseLinktext(newLinktext).path);
  }

  return open + newLinktext + pipe + outAlias + close;
}
```

`basename` here means the segment after the last `/`. Note the alias rule keys on the **old** link text, which is why the snapshot from section 2.1 is required.

### 2.7 Public API you will use

| Symbol | Purpose |
|---|---|
| `vault.on('rename', (file, oldPath) => ...)` | already wired at `src/main.ts:1360` |
| `metadataCache.resolvedLinks` | `{ sourcePath: { targetPath: count } }` - finds the files that link to the renamed note |
| `metadataCache.getFileCache(file).links` / `.embeds` | each entry has `original`, `link`, `displayText?`, and `position.start.offset` / `position.end.offset` |
| `metadataCache.fileToLinktext(file, sourcePath, omitMdExtension)` | Obsidian's own link-text generator |
| `parseLinktext(linktext)` | splits into `{ path, subpath }` |

---

## 3. The algorithm

Everything below runs only when the setting is on. When it is off, none of this code executes.

### Phase A - arm, inside the existing `vault.on('rename')` handler

Bail out entirely (arm nothing) if any check fails:

1. The setting is on.
2. `file` is a `TFile` with extension `md`.
3. `app.fileManager.inProgressUpdates` is an array (section 2.4), read through an `unknown` cast inside `try/catch`.
4. No other rename is currently armed. **If one is, disarm it and arm nothing** - this is how folder moves (section 2.5) are excluded: the second event cancels the batch.
5. Read `app.fileManager.updateQueue.promise` **now** and keep the reference (section 2.3).

Then find candidate source files: scan `metadataCache.resolvedLinks` for entries where `resolvedLinks[sourcePath][oldPath] > 0`. If the count exceeds a cap (start with 50), arm nothing.

For each candidate, skip that individual file unless **all** hold:

- it has a hash-cache entry, and its current hash equals it. Compute it exactly the way the pipeline does: read the file, `.trim()`, `getContentForHashing()`, `hashString()`. (This proves your baseline is not stale.)
- it is not in `processingFiles`;
- `getWriteBlock(file)` returns `null`;
- `getFileCache(file)` is available.

Snapshot per surviving file:

- the **untrimmed** raw content (cache offsets are offsets into the untrimmed file);
- a deep copy of the `links` and `embeds` reference entries (the metadata cache will change after the rewrite, so you cannot read them later).

Store `{ oldPath, newPath, renamedFile, sources: [...], generation }` where `generation` is a counter you bump on unload and on the setting being switched off.

### Phase B - wait

```ts
try { await armedPromise } catch { /* disarm, suppress nothing */ return; }
```

Then re-check that the generation still matches and nothing new was armed. If it changed, suppress nothing.

### Phase C - verify, per snapshotted source file

1. Re-check that the file still exists, is not in `processingFiles`, and `getWriteBlock(file)` is still `null`.
2. Build the **predicted content** from the snapshot:
   - Sort the combined `links` + `embeds` entries by `position.start.offset`. Their concatenation is **not** in document order.
   - Reject the whole file (suppress nothing) if any span overlaps another, or if
     `snapshotContent.slice(start, end) !== ref.original`.
   - For every reference, decide whether it is **predictable** (section 4). If any reference pointing at the renamed file is not predictable, reject the whole file.
   - For predictable references that point at the renamed file, compute `newLinktext` and the replacement span per section 2.6, skipping any where `ref.link === newLinktext`.
   - Splice replacements into the snapshot content in **descending** offset order.
3. `const actual = await vault.read(file)` (untrimmed).
4. **Suppress only if `actual === predicted`, byte for byte.** Otherwise do nothing at all.
5. On a match:
   - `await plugin.populateCacheForFile(file, actual.trim())`. **You must pass the content**; the parameter exists for exactly this. Without it the method re-reads the file and would hash a version you never validated.
   - **Do not clear any timer.** `modifyTimers` (`src/main.ts:133`) is a single map serving four unrelated purposes (the modify debounce, the dirty-editor deferral, the rate-limit retry, the lock-collision retry) with no record of which is which. Cancelling one blindly can drop a real pending update. You do not need to: the already-scheduled debounced pass will run, `shouldFileBeIgnored` will find the hash you just refreshed, return `unchanged`, and no stamp happens. If a human edit lands after your refresh, the hash will not match and it will stamp - which is correct.

Every internal-API read in phases A to C goes through an `unknown` cast in a `try/catch`, and every failure path means "suppress nothing".

---

## 4. What v1 predicts, and what it deliberately skips

A reference is **predictable** only if all of these hold:

- `ref.original` matches `/^(!?\[\[)(.*?)(\|(.*))?(]])$/` - wikilinks and wiki-embeds only;
- `ref.original` contains no escaped pipe (`\|`);
- `snapshotContent.slice(start, end) === ref.original`.

Everything else causes the file to be skipped, which means it gets stamped as it does today:

- **Markdown links** `[text](path.md)`. Obsidian percent-encodes the destination and rewrites the label; that encoder is a separate piece of work. A vault configured for Markdown links simply never triggers this feature in v1.
- **Embeds with dimensions** (`![[image|300]]`) - the pipe segment is not an alias there.
- **Links inside frontmatter.** `frontmatterLinks` has no position data and Obsidian rewrites those through a full YAML round-trip.
- Canvas and other non-markdown files.
- Folder moves (see Phase A step 4).

Widening this list later is safe: a wider subset can only convert "stamped" into "not stamped" for cases you predict exactly, and any mistake reverts to stamping.

---

## 5. Files to change

| File | Change |
|---|---|
| `src/renamePrediction.ts` | **new.** Pure functions, no Obsidian runtime import (types only). See section 6. |
| `src/main.ts` | the arm / wait / verify machinery; generation counter reset in `onunload`; extend the existing `rename` handler |
| `src/Settings.ts` | `experimentalSkipRenameLinkUpdates: boolean` in the settings interface and `DEFAULT_SETTINGS`; coercion in `sanitizeSettings`; a toggle row in the **Advanced** sub-page of `getSettingDefinitions()`; bump the generation counter when it is switched off |
| `src/i18n/locales/en.ts` | the setting name and description (source of truth) |
| `src/i18n/locales/*.ts` | the same keys in the other 20 locales |
| `README.md` | a row in the settings table plus a short "not covered" note |
| `CLAUDE.md` | a Key Pattern entry - this adds a second writer to the hash cache |
| `e2e/specs/rename-link-suppression.e2e.ts` | **new.** See section 7. |
| `e2e/README.md` | add the new scenario |

### Setting text

Name: **"Experimental: skip date update after renaming a note"**

Description must say, in plain language: that it is experimental; that when you rename a note, the notes linking to it will keep their existing date; that it only works for `[[wikilink]]` style links and single-file renames; and that in rare cases a link-only edit you made yourself may not update the date. Sentence case, no jargon, and it must never claim to "ignore renames".

---

## 6. `src/renamePrediction.ts` - the pure module

Keep everything here free of Obsidian runtime calls so it is unit-testable without the mock. Suggested surface:

```ts
export interface RefSnapshot {
  original: string;
  link: string;
  start: number;
  end: number;
}

export function parseWikilink(original: string):
  { open: string; linkPart: string; alias: string | null; close: string } | null;

export function isPredictable(ref: RefSnapshot, content: string): boolean;

export function rewriteWikilink(original: string, newLinktext: string): string;

/** Throws or returns null on overlap / mismatch - caller then suppresses nothing. */
export function predictContent(
  content: string,
  replacements: Array<{ start: number; end: number; text: string }>,
): string | null;
```

`fileToLinktext` and `parseLinktext` are Obsidian calls, so compute `newLinktext` in `main.ts` and pass it in.

---

## 7. Tests

### Unit (`src/__tests__/renamePrediction.test.ts`)

- `[[Old]]` -> `[[New]]`
- `[[Folder/Old]]` -> `[[Folder/New]]`
- `[[Folder/Old|Old]]` -> `[[Folder/New|New]]` (the alias IS rewritten - old link had a path and the alias equalled the old basename)
- `[[Old|Old]]` -> `[[New|Old]]` (alias NOT rewritten - old link had no path component)
- `[[Old|my label]]` -> `[[New|my label]]` (custom alias preserved)
- `[[Old#Heading]]` and `[[Old#^blockid]]` - subpath preserved
- `![[Old]]` -> `![[New]]` - embed marker preserved
- escaped pipe `[[Old\|x]]` - rejected as unpredictable
- markdown link `[x](Old.md)` - rejected as unpredictable
- `original` not matching the content slice - rejected
- overlapping spans - rejected
- multi-reference splice, verifying descending-offset application
- a reference where `ref.link === newLinktext` - no replacement emitted

### Unit (`src/__tests__/` alongside the existing `handleFileChange` suites)

Arming preconditions and every disarm path: setting off, `inProgressUpdates` not an array, a second rename arriving, generation changed, file in `processingFiles`, write block non-null, stale baseline hash, candidate count over cap.

### E2E (real Obsidian) - this is where the feature is actually proven

1. Rename, accept "Just once": the linking note keeps its old `updated`.
2. Leave the modal open for a while, then accept: still correct.
3. Choose "Do not update": nothing is suppressed anywhere.
4. **Type into a linking note while the modal is open, then accept the rename: that note MUST be stamped.** This is the single most important test in the suite.
5. Alias forms: `[[Folder/Old|Old]]` and `[[Old|custom label]]`.
6. Subpath and block-reference links.
7. A vault configured for Markdown links: the feature does not fire, the note is stamped as today.
8. A folder move: the feature does not fire.
9. A note that links to something else entirely: unaffected.
10. A linking note with unsaved changes in an open editor: not suppressed.

---

## 8. Acceptance criteria

- With the setting **off**, behaviour is byte-identical to the current release. Prove it: the existing suites must pass untouched.
- With the setting **on**, E2E cases 1, 2, 5, 6 suppress the stamp, and cases 3, 4, 7, 8, 9, 10 stamp normally.
- No `any`; internal API access via `unknown` casts only.
- No `console.*`; use `plugin.log()` / `plugin.logError()`.
- `make pre-commit` green.
- Re-run `make screenshots` only if the settings screenshot changed.
- Release as MINOR with a Highlights bullet naming the feature experimental.

---

## 9. Verify this first

Before writing anything else, confirm on a running Obsidian that **`app.fileManager.inProgressUpdates` is an array at the moment a plugin's `rename` listener fires**. The entire gate rests on this and it has not been tested against a live app - only read from the bundle.

A throwaway plugin or the developer console is enough:

```js
app.vault.on('rename', (f, old) => console.log(old, Array.isArray(app.fileManager.inProgressUpdates)));
```

Expect `true` when renaming from the file explorer with link updating enabled, and `false` for `app.vault.rename(...)` called directly.

---

## 10. Stop and report back if any of these turn out true

- The check in section 9 fails.
- E2E case 4 (human edit during the modal wait) does not stamp. This is non-negotiable; do not work around it.
- The predictable subset in section 4 turns out to cover so little of a realistic vault that the feature almost never fires.

---

## 11. Related

- Background and rationale, not required reading: `docs/decisions/rename-induced-link-updates.md`.
- `CLAUDE.md` - "File modification pipeline", "Hash cache lifecycle", "Dirty-editor-buffer write guard". Read these three before touching `main.ts`.

---

## 12. Build notes (2026-09-04)

**Section 9 pre-check: PASSED.** Probed on a real Obsidian 1.13.4 via a throwaway e2e spec: `fileManager.inProgressUpdates` is `null` at rest, an **array** inside the `rename` listener during `fileManager.renameFile`, and `null` during `vault.rename`; `updateQueue.promise` is a real Promise and `updateQueue.queue` a function. None of the section 10 stop conditions fired.

**What was added beyond the spec:**

- **The disarm moved into a `finally`.** Every early return in the wait/verify path (no usable source, a rejected queue, a thrown internal) has to clear `renameSuppression`, or the NEXT rename reads the stale batch as a folder move and cancels itself - silently costing every other rename. This was a real bug, and it was caught only by e2e R11 running after R10; there is now a unit test pinning it.
- **`linkpathTargetsPath`** (pure, in `renamePrediction.ts`). The spec did not say how to decide which references point at the renamed file. Obsidian's own resolver cannot answer it - the file has already moved when the listener fires - so this is a deliberately conservative reimplementation covering the absolute path, the shortest form, and folder-aligned suffixes, case-insensitively. Relative `../` forms are not covered. Being wrong in either direction only breaks the byte comparison, so it trades coverage, never safety.
- **`rewriteWikilink` keeps the spec's two-argument signature** by splitting the subpath off `newLinktext` with a pure stand-in for `parseLinktext`'s rule (`indexOf('#') > 0`), rather than threading the path through from `main.ts`.
- **Arming order is race-aware.** The internals read, candidate scan, reference snapshots and `vault.read` calls all happen before the first `await`. Measured: with "Automatically update internal links" ON the arm-time read still returns the pre-rewrite text and the whole suppression completes ~14 ms after the rename.
- **E2E scenario R11** (not in the spec's list of ten): the no-prompt configuration, which is the tightest race the snapshot has to win. It is what exposed the disarm bug.

**Deliberately unchanged from the spec:** no timer is cleared; `populateCacheForFile` is always passed the validated content; every internal read goes through an `unknown` cast in `try/catch`; the predictable subset stays wikilinks-and-wiki-embeds only.

**Not done:** the settings screenshot was not regenerated - the toggle lives on the Advanced sub-page, which none of the five store screenshots captures.

---

## 13. Review outcome (2026-09-05)

Four adversarial passes: Codex (`gpt-5.6-sol`/high, two passes), plus one Claude Fable and one Claude Opus reviewer, each working blind from the diff.

**The governing invariant survived.** All four attacked "fail toward stamping" as their primary task; none constructed a case where a genuine user edit is silently swallowed. Three gave a structural reason rather than an impression: `predicted` is derived only from the snapshot plus spans, so a byte match means the file differs from the snapshot in exactly those spans; and `populateCacheForFile` is handed the validated bytes rather than re-reading.

Codex additionally isolated a third window the others did not name separately: an edit landing between Phase C's read and the hash refresh. The byte comparison genuinely does NOT catch it. What catches it is the pair of decisions this spec already mandated - hash the validated content, and clear no timer - so the edit's own `modify` re-arms the debounce and the next pass stamps.

**Defects found and fixed in review** (none of them data-safety; all cost coverage or contradicted the docs):

1. The toggle was a silent no-op whenever `enableContentHashCheck` was off - all four reads and the whole verify pass ran and changed nothing. Named as the single blocking item by every reviewer who looked broadly. Now gated at both ends: `armRenameSuppression` bails, and the settings row carries the same `visible` predicate two neighbouring rows already used.
2. The folder-move exclusion was a toggle, not a latch, so it was **false as documented in five places**. The cancel cleared the slot, so a third child re-armed; and a child with no backlinks returned before taking the slot at all, so a folder move whose source links only to a later child was suppressed entirely. Fixed with an explicit `blocked` latch released by the batch's own queue promise.
3. e2e R8 was passing for the wrong reason - its two-child fixture happened to form an arm/cancel pair, so it never pinned the invariant its own comment claimed. Rewritten to three children with only the last one linked, which is the shape that actually fails without the latch.
4. Cancellation stopped working once Phase C began (the slot was nulled before the loop, making `isRenameStillArmed` permanently false). Worst consequence: a suppression landing after `onunload` called `markHashCacheDirty()` and re-armed a flush timer unload had just cleared, writing `hash-cache.json` from a dead instance. Now re-checked at every await and immediately before the cache write.
5. The 50-source cap bounded file count but not bytes, and the snapshots stay pinned for as long as the "Update links" prompt is open. Added `RENAME_SUPPRESSION_MAX_BYTES` (4 MB total), checked against `file.stat.size` before reading.
6. `renameCandidateSources` was the one Phase A step without `try/catch`, and it runs before the handler's own hash-cache migration - a throw there would have skipped that migration. Now guarded.

Documentation corrected in the same pass: section 4 above wrongly lists embeds with dimensions (`![[Note|300]]`) as skipped. They are predicted, correctly - the pipe segment is not an alias, and the alias rule leaves it alone.

Every fix carries a unit test that was verified to FAIL against the pre-fix code.

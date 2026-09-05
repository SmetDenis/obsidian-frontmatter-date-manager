# Decision record: rename-induced link rewrites and `updated`

- **Status:** **SUPERSEDED as of 2026-09-04 - R2 was reviewed, specified and BUILT.** It shipped as the opt-in, default-off setting `experimentalSkipRenameLinkUpdates` ("Experimental: skip date update after renaming a note"). See [Outcome](#8-outcome---r2-was-built-2026-09-04) at the bottom, then `CLAUDE.md` -> "Experimental rename-link suppression" for the maintained record. The rejections of A, B, C, D and R1 below still stand.
- **Date:** 2026-08-31 / 2026-09-01, substantially revised 2026-09-04
- **Driver:** [issue #18](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/issues/18) - "Updated links from renaming notes counts as modification" (reporter `nauxi4`, label `enhancement`; second voice `SolMi-Sera` from 2026-09-03)
- **Plugin version at time of analysis:** 1.4.0. **Obsidian analysed:** 1.13.7 (locally installed `.asar`); e2e pins 1.13.4.
- **Scope:** why the plugin stamps `updated` on notes the user never touched after a rename, six candidate designs (A, B, C, D, R1 rejected; R2 built), and exactly what would have to change to revisit.

This document is deliberately self-contained. It must be possible to reconstruct the entire decision from it without the originating conversation.

> **If you are here to re-open this question, read section 4's "The reframing" first.** The 2026-09-02 conclusion was that the feature is impossible. That was an artefact of asking "who wrote this change?" four times in a row. The answerable question is "does this change preserve every link's resolved target?" - and it is not yet settled.

---

## 1. The problem

The plugin stamps `updated` from the vault `modify` event, gated by a SHA-256 content hash so that no-op writes (sync clients, external tools) do not falsely bump it.

When the user renames note `A`, Obsidian rewrites the links pointing at `A` inside notes `B`, `C`, `D`. Those note bodies genuinely change on disk, so the hash gate correctly sees a content change and stamps a fresh `updated` on `B`, `C`, `D`. The user never opened or edited them.

The request in #18: an opt-in way to not treat rename-induced link rewrites as an edit. The reporter ticked the "can be opt-in and safe-by-default" box.

### The demand is genuinely two-sided

This is a matter of taste, not a universal bug, and that shaped every decision below.

- Wants suppression: the #18 reporter; [Obsidian core FR "Preserve file modification time when updating internal links"](https://forum.obsidian.md/t/preserve-file-modification-time-when-updating-internal-links/25629) (open since Oct 2021, no team response); [a 2025 thread asking for the same](https://forum.obsidian.md/t/on-renaming-files-headings-and-blocks-update-source-and-linked-files-date-modified-timestamp/97578).
- Wants the opposite: a user in [this thread](https://forum.obsidian.md/t/automatically-update-last-modified-date-in-note/51776/51) needs the link rewrite to bump the date so his Dataview publish query notices it.

Consequence: any behaviour change here must be an opt-in setting, and the default must preserve today's behaviour.

---

## 2. Verified facts about Obsidian internals

All of the following were deobfuscated from the real `obsidian-1.13.7.asar` and independently re-checked by at least one external reviewer. They are the load-bearing evidence for every rejection below.

### F-A: the `rename` event fires strictly BEFORE any link is rewritten

`FileManager.renameFile(file, newPath)` delegates to `runAsyncLinkUpdate`:

```js
runAsyncLinkUpdate(op) {
  if (this.inProgressUpdates) { this.inProgressUpdates.push(op); return; }  // nested renames queue
  return this.updateQueue.queue(async () => {
    await new Promise(r => this.app.metadataCache.onCleanCache(r));   // 1. wait for a clean cache
    const refs = [];
    metadataCache.iterateAllRefs((srcPath, ref) => {                  // 2. snapshot of all refs, PRE-rename
      const linkpath = parseLinktext(ref.link);
      const src = vault.getAbstractFileByPath(srcPath);
      if (src instanceof TFile) {
        const dests = metadataCache.getLinkpathDest(linkpath, srcPath);
        if (dests.length) refs.push({ sourceFile: src, reference: ref, resolvedFile: dests[0], resolvedPaths: dests.map(f => f.path) });
      }
    });
    try { this.inProgressUpdates = []; await op();                    // 3. vault.rename -> fires 'rename'
          while (this.inProgressUpdates.length) { /* drain nested */ } }
    finally { this.inProgressUpdates = null; }
    await this.updateAllLinks(refs);                                  // 4. ONLY NOW rewrite the links
  });
}
```

### F-B: links are rewritten with a plain `vault.process` - no flag, no dedicated event

```js
updateInternalLinks(map) {
  for (const path of map.keys()) {
    const f = vault.getAbstractFileByPath(path);
    const updater = this.linkUpdaters[f.extension];        // canvas etc. have custom updaters
    if (updater) await updater.applyUpdates(f, map.get(path));
    else await vault.process(f, data => applyChanges(data, map.get(path)));
  }
}
```

A plugin receives exactly the same `modify` event it would get from a human edit. **There is no transaction id, no operation id, and no completion event.** This is the root cause of everything below.

### F-C (corrected): the delay is UNBOUNDED but its completion is OBSERVABLE

`updateAllLinks` consults `vault.getConfig("alwaysUpdateLinks")`, whose default is `false` (found in the config defaults object as `{ alwaysUpdateLinks: !1, ... }`). When false, Obsidian shows a modal - `[Always update] [Just once] [Do not update]` - and blocks on a human click. The user can leave it open indefinitely.

**This invalidates every design based on a guessed suppression time window.** It does NOT, as this record originally claimed, make the end of the rewrite unknowable. `renameFile` awaits `runAsyncLinkUpdate`, which returns `updateQueue.queue(...)`, and the queue is:

```js
Iw = function () {
  function e() { this.promise = Promise.resolve() }
  e.prototype.queue = function (fn) { var t = this.promise.then(fn, fn); this.promise = t; return t }
}
```

The queued function ends with `await updateAllLinks(refs)`, modal wait included, so **`app.fileManager.updateQueue.promise` resolves after the rewrites are applied**. `.then(fn, fn)` passes the same handler for both outcomes, so the chain never rejects and awaiting it cannot throw.

Undocumented internal: reach it through an `unknown` cast and fail open if the shape drifts.

### F-D (corrected): heading rename goes through `updateInternalLinks`; property rename does NOT

An earlier version of this analysis claimed both did. That was wrong; two independent reviewers caught it, and it was then verified directly:

```js
// FileManager.renameProperty(oldKey, newKey)
for (const path of metadataCache.getCachedFiles()) {
  if (metadataCache.isUserIgnored(path)) continue;
  const fm = metadataCache.getCache(path)?.frontmatter;
  if (fm && Object.hasOwn(fm, oldKey)) {
    await this.app.vault.process(file, data => { /* parse YAML, move key, re-serialize */ });
  }
}
```

So: heading rename yes, property rename no. Property rename is a frontmatter change, invisible under the default `hashTrackingMode: 'body'` anyway.

### F-E: the rewriter also rewrites the DISPLAY TEXT, not just the target

This falsified the central assumption of Design B. `kR(ref, cache)` computes `h = fileToLinktext(resolvedFile, sourcePath, isWikilink) + subpath` and hands it to `JF`:

```js
const sD = /^(!?\[\[)(.*?)(\|(.*))?(]])$/;
const lD = /^(!?\[)(.*?)(]\(\s*)((<[^>]*?>|[^ "]+?)(\s+([^ ]+|"[^"]+"|'[^']+'|\([^']+\)))?)?(\s*\))$/;

function JF(ref, newLinktext) {
  const m = ref.original.match(sD);                 // wikilink branch
  if (m) {
    const [, open, linkPart, , alias = '', close] = m;
    if (alias) {
      const pipe = /\\\|/.test(ref.original) ? '\\|' : '|';
      let a = alias;
      if (linkPart.contains('/')) {                 // the OLD link carried a path
        if (basename(linkPart) === alias.trim())    // and the alias equalled the OLD basename
          a = basename(parseLinktext(newLinktext)); // <-- THE ALIAS IS REWRITTEN
      }
      return open + newLinktext + pipe + a + close;
    }
    return open + newLinktext + close;
  }
  const f = ref.original.match(lD);                 // markdown-link branch
  const dest = (!f || !f[5].startsWith('<')) ? encodeTarget(newLinktext) : '<' + newLinktext + '>';
  if (f) {
    let label = f[2];
    const g = strip(label).trim();
    const oldParsed = parseLinktext(ref.link);
    if (g === basenameNoExt(oldParsed))            label = basenameNoExt(parseLinktext(newLinktext));
    else if (g.contains('/') && g === pathNoExt(oldParsed)) label = pathNoExt(parseLinktext(newLinktext));
    return f[1] + label + f[3] + dest + (f[6] ?? '') + f[8];
  }
  return (ref.original.startsWith('!') ? '!' : '') + '[](' + dest + ')';
}
```

So `[[Folder/Old|Old]]` becomes `[[Folder/New|New]]` and `[Old](Folder/Old.md)` becomes `[New](Folder/New.md)`.

**Any approach assuming "only the link target changes" is wrong.**

Note also that the alias condition (`linkPart.contains('/')`) is a predicate on the OLD link, which no longer exists in the new content. That makes the transformation lossy, which kills Design C.

### F-F: a folder rename fires one `rename` per moved child (plus one for the folder)

From the desktop adapter:

```js
this.trigger("renamed", newPath, oldPath);
if (record.type === "folder")
  for (const s in this.files)
    if (s.startsWith(oldPath + "/")) { /* re-key */ this.trigger("renamed", newChildPath, s); }
```

Moving a 1000-file folder produces ~1001 events. (One reviewer rated this only "medium confidence" because the public API does not contractually specify descendant events - correct as a contract point, but the current implementation is unambiguous.)

### F-G (corrected): `Vault.rename()` does NOT update links, and the two ARE distinguishable

Public `Vault.rename()` performs no link rewriting; the official docs direct plugins to `FileManager.renameFile()` when link updates are wanted.

This record originally claimed the two emit an indistinguishable `rename` event, so any design arming state on `rename` would arm state that may never be discharged. **That was wrong.** The `FileManager` constructor is:

```js
this.inProgressUpdates = null; this.updateQueue = new Iw;
```

and `runAsyncLinkUpdate` sets `inProgressUpdates = []` immediately before running the op, restoring `null` in `finally`. So **during** the `rename` event it is an array for a link-updating rename and `null` for a bare `Vault.rename()`.

Same caveat as F-C: undocumented internal, `unknown` cast, fail open on drift. Note also that a plugin calling `FileManager.renameFile` for a FOLDER may route straight to `vault.rename` (reported by a reviewer against Obsidian 1.14, not verified against 1.13.x) - so descendant rename events must not be assumed to carry the same signal.

### F-H: the alias rules have already changed across Obsidian versions

Reported behaviour change in Obsidian 1.11.6, with the rule now differing between shortest-path and complete-path links ([forum](https://forum.obsidian.md/t/add-option-to-always-preserve-original-link-text-as-display-text-alias-when-the-target-note-is-renamed-dont-change-original-text-when-updating-links/6521/36)). Grammar drift is a documented fact, not a hypothetical risk.

### Public API surface (obsidian `~1.13.1` types, as pinned)

| Symbol | Public? | Notes |
|---|---|---|
| `vault.on('rename', (file, oldPath))` | yes | already used at `src/main.ts:1360` |
| `metadataCache.resolvedLinks` | yes | `obsidian.d.ts:4438` |
| `metadataCache.fileToLinktext` | yes | picks shortest unambiguous form; depends on the whole vault |
| `metadataCache.getBacklinksForFile` | **no** | exists at runtime, absent from public types; only in `obsidian-typings` |
| `metadataCache.getFirstLinkpathDest` | yes | `obsidian.d.ts` - resolves a linkpath to a `TFile` from a source path |
| `CachedMetadata.links` / `.embeds` (+ `position.start/end.offset`, `original`, `link`, `displayText`) | yes | span positions; `frontmatterLinks` carries **no** positions |
| `metadataCache.on('changed'\|'resolve'\|'resolved')` | yes | types explicitly say these do NOT fire for renames |
| `fileManager.inProgressUpdates` / `.updateQueue.promise` | **no** | undocumented; see F-C / F-G. Distinguish a link-updating rename and await its completion |
| anything identifying an individual `modify` as link-update-caused | **does not exist** | the per-event attribution really is unavailable |

---

## 3. Prior art

- [`beaussan/update-time-on-edit-obsidian`](https://github.com/beaussan/update-time-on-edit-obsidian) - the upstream this plugin forked from. Does not address this at all; its `rename` handler only migrates the hash-cache entry, exactly like ours.
- [`dsebastien/obsidian-update-time`](https://github.com/dsebastien/obsidian-update-time) - listens to `vault.on('modify')`, has no rename handler at all.
- [`alangrainger/obsidian-frontmatter-modified-date`](https://github.com/alangrainger/obsidian-frontmatter-modified-date) - **structurally immune**, by listening to `workspace.on('editor-change')` (a human-typing signal) instead of `vault.on('modify')`. Its author states the intent plainly: *"modifying a file means you are inside the note intentionally working on it."* The trade-off is the mirror image of ours: it misses external tools, sync, and bulk edits - the exact cases this plugin's hash pipeline exists to handle.
- [`mnaoumov/obsidian-dev-utils`](https://github.com/mnaoumov/obsidian-dev-utils) `src/obsidian/link.ts` - the only serious third-party reproduction of Obsidian's link rewriting. **1943 lines for the forward direction alone**, and its `shouldResetAlias` already diverges from core's current `JF` rule. Its rename support monkey-patches `runAsyncLinkUpdate`. This is the realistic cost benchmark for "reimplement the grammar".
- A forum power-user thread calls intercepting link updates "no mean task" and recommends simply living with `mtime`-based queries.

---

## 4. Candidate designs and why each was rejected

Four designs were considered. Each was reviewed adversarially; reviewers are named per design in [section 5](#5-how-this-was-reviewed).

### Design A - rename cohort plus suppression window

**Sketch.** On `rename`, snapshot the files that linked to `oldPath` (scan `resolvedLinks`). Put them in a short-lived suppression cohort. While a file is in an unexpired cohort, its `modify` does not stamp `updated`; instead refresh its hash-cache entry so the change is absorbed. Opt-in.

**Verdict: dead.** No finite window is sound (F-C), and the failure direction is the dangerous one - it silently loses real user edits.

Failure modes found:

1. **Decisive: the 2s per-file debounce coalesces a human edit with the link rewrite into one final disk state** (`src/main.ts:1348-1355`, `MODIFY_DEBOUNCE_MS` in `src/constants.ts`). Caching that state asserts "nothing pending remains", which is false. The user's edit is lost permanently.
2. Refreshing the hash violates a deliberate existing invariant: the dirty-buffer deferral (`src/main.ts:998`) and the rate-limit retry (`src/main.ts:1035`) both intentionally do NOT refresh the hash, precisely so a pending bump is not lost.
3. Modal left open past the deadline -> rewrites stamped anyway (feature silently does not work; and it works fine for any developer who once clicked "Always update", which is the worst kind of bug).
4. "Do not update" leaves a cohort that never discharges; a finite expiry re-opens the hole, an infinite one suppresses forever.
5. Folder renames produce ~1001 cohort entries (F-F); scanning `resolvedLinks` per event is O(moved x graph) during an interactive rename.
6. Nested/queued renames overlap cohorts with no transaction id to separate them.
7. `resolvedLinks` freshness at listener time is not guaranteed by any contract.
8. Bulk race: `src/bulk/write.ts:56` writes and refreshes the cache directly; `bulkRunning` only gates newly arriving events and bulk does not take `processingFiles`.
9. A forum user who actually attempted this reported *"other files that were not linked also got updated exponentially"*.

### Design B - link-masked content hashing

**Sketch.** Do not chase events. Inside the pure normalizer `getContentForHashing()` (`src/main.ts:416`), replace the link TARGET with a placeholder while preserving display text, so a pure retarget hashes identically. Opt-in, cache stores both raw and masked hashes so toggling invalidates nothing.

**Verdict: viable only if reframed, and not worth it now.** It is timing-independent and cannot corrupt data, but it does not mean what the issue asks for.

Findings:

1. **F-E falsifies the core mechanic.** "Mask the target, keep the display text" fails for `[[Folder/Old|Old]]` and for markdown links, because Obsidian rewrites the label too. Fixable (also mask an alias equal to the target basename) but it stops being "one small pure function".
2. **It promises the wrong thing.** It cannot distinguish Obsidian's `[[A]]->[[B]]` from a human typing the same. So it also silences: manual retargets, vault-wide link surgery, folder-move path changes, and other plugins' link rewrites. Honest framing is *"ignore internal-link destination changes"*, not *"ignore renames"*.
3. A whole-document regex is unacceptable: fenced code, inline code, math, escaped brackets, Excalidraw payloads (tracked by default since 1.3.0), YAML strings, reference-style links, footnotes `[^1]`, angle destinations, optional titles, URL encoding, three path formats, wikilink-vs-markdown setting. The placeholder itself needs collision-proof encoding.
4. Using `CachedMetadata` positions instead is safer but not free: `frontmatterLinks` carries **no positions**, and the cache is async, so the implementation must prove `content.slice(start,end) === original` and fall back to raw text otherwise. That also makes `getContentForHashing` impure (needs file + cache), losing its unit-testability claim.
5. **Cache migration is a delayed false-positive window, not just "invalidation".** A cache miss or mismatch returns `{ignored:false}` (`src/main.ts:557`), i.e. the file passes as a real edit and can stamp `updated`, bump `updated_count`, and fire the post-update command. Auto-populate only fills *absent* entries; it does not recompute incompatible ones. The dual-hash idea removes future toggle churn only after a full rebuild, since `maskedHash` cannot be derived from a stored SHA-256.
6. Blast radius on data is genuinely bounded to "stamped or not" - masking never influences what is written. But the behavioural radius includes `updated_count` and the user's post-update command.

### Design C - verify by inverse transformation

**Sketch.** Do not classify; prove. On `rename`, record `{oldPath, newPath}`. On a later `modify` of B, apply the INVERSE link transformation to the new content and compare against B's cached pre-rename hash. Exact match means the change was exactly and only the link rewrite.

**Verdict: dead.** Of its seven claimed properties, P1, P2, P4 and P6 are false; only P3 survives intact.

1. **The inverse is not a function.** `kR` replaces the whole link path with `fileToLinktext(...) + subpath` regardless of the old surface form, so `[[Old]]`, `[[Folder/Old]]`, `[[Folder/Old.md]]`, any casing and any percent-encoding all map to one output. And `JF`'s alias rule is conditioned on the OLD link part (F-E), which is erased. `[[Folder/New|New]]` has at least two preimages. Best case it becomes a capped enumeration verified by hash - correct, but a permanent reverse-grammar engine.
2. **Frontmatter link rewrites are not invertible at all**: they go through a full YAML round-trip that drops comments and normalizes unrelated keys.
3. **P6 (fail-open) is FALSE.** Counterexample: the cache holds `hash("old text ... [[A]]")`; the plugin is paused (`pause-auto-update`, `src/main.ts:359`) while the user edits to `"new text ... [[A]]"`, so the cache stays stale; a rename `A -> B` is pending; the user then deliberately reverts the text to `"old text ..."` and the link becomes `[[B]]`. The inverse reproduces the stale cached state exactly, and C suppresses a genuine human edit - with no SHA collision. One reviewer explicitly failed to find such a case and confirmed P6; the other constructed this. **The counterexample is valid; P6 does not hold.**
4. **P1 is an information-theoretic collision.** History 1: user clicks "Just once", Obsidian writes `[[B]]`. History 2: user clicks "Do not update", then manually types `[[B]]`. Identical pending rename, identical cache, identical final bytes. Anything suppressing the first suppresses the second.
5. **Poison entries**: "Do not update" (F-C) and third-party `Vault.rename()` (F-G) both arm a pending entry that no rewrite will ever discharge, which can later swallow a manual retarget.
6. **Multiple pending renames** need subset/order search: `A->B` then `B->A` composes back to the original and mismatches the already-refreshed cache; `A->B->C` needs reverse-chronological composition.
7. **Unresolved-link collision**: if a note contains both `[[A]]` and a previously broken `[[B]]`, after `A -> B` both read `[[B]]` and the inverse cannot tell which to revert.
8. **Wrong same-named target**: a textual inverse may rewrite `[[two/B]]` because `one/A.md` became `one/B.md`.
9. **The hash cache is not a proof baseline.** `HashCacheEntry = { hash, lastAccessed }` (`src/main.ts:37`) - no mode identifier, no settings fingerprint, no generation. Changing `hashTrackingMode` only shows a rebuild notice (`src/Settings.ts:241`); it does not version entries. A `Rebuild cache` (`src/UpdateAllCacheData.ts:60`) or bulk write landing between the rewrite and the debounced pass blesses the rewrite as unchanged, so C never gets a baseline.
10. **The manual command shares the pipeline**, so without an explicit origin flag C could reject an explicit user-requested update during a pending rename.
11. Heading rename fires no `rename` event, so C does not cover it either.

### Design D - forward prediction from a rename-time snapshot

**Sketch.** On `rename`: find backlink sources via `resolvedLinks`, read each source NOW (the rewrite is queued behind `onCleanCache` and usually a modal, so the read normally wins; if it loses, the snapshot equals the rewritten state and the prediction degenerates to the identity, still a correct skip), verify each source's current normalized hash equals the cache (proving baseline freshness), and retain its refs. On a later `modify` of B, compute `C_pred` by applying the FORWARD `JF` with public `fileToLinktext`, and compare byte-exact against `C_new`.

**Verdict: the only technically honest automatic design - but not built.**

Advantages over C: no preimage enumeration, no alias ambiguity (the old original is in hand), no dependence on the hash cache as an oracle, and grammar drift degrades a ~30-line forward function with a testable fixture rather than a combinatorial inverse.

Remaining costs and limits, unchanged from C:

- Still cannot distinguish a byte-identical human retarget during a pending window (the observation histories are identical - this is irreducible for any automatic design).
- Reads every backlink source at rename time; folder moves need a hard cap and fail-open beyond it.
- Covers file renames only: **not heading renames** (no `rename` event), not property renames.
- Body hash mode only in practice.
- On a second device the rewrites arrive as sync writes; whether a usable `rename` arrives first is **unverified** - assume it often fails open, and the resulting stamp syncs back.
- Still reimplements an undocumented, drifting grammar (F-H).

---

### The reframing (2026-09-04) - read this before proposing anything new

Designs A to D all ask the same question: **"who wrote this change?"** That question is genuinely unanswerable, and four rejections in a row hardened it into "this feature is impossible".

A steelman review of the issue thread found that the question is the problem, not the answer. There is a second, *checkable* question:

> **"Does this change preserve an invariant?"**

The invariant exists because of how the rewriter works. `kR` computes the new link text as `fileToLinktext(resolvedFile, sourcePath, isWikilink) + subpath`, where `resolvedFile` comes from the PRE-rename snapshot of what that link resolved to, and emits a change only when the link no longer resolves to its pre-rename target. So a rename-induced rewrite is by construction a **link-resolution-preserving** edit: the prose outside link spans is byte-identical, and every link still points at the same note.

Why this matters: it splits the two histories the impossibility argument treats as identical, in exactly the way a note-taker would want.

| Action | Design B (mask the target) | Resolution-preserving check |
|---|---|---|
| Obsidian rewrote links after a rename | not stamped | not stamped |
| **Human re-points a link to a DIFFERENT note** | **not stamped - the objection that killed B** | **stamped, correctly** |
| Human respells a link, same target (`[[Folder/A]]` -> `[[A]]`) | not stamped | not stamped (the residual cost) |

**Verifying an invariant is possible where inferring a cause is not.** The impossibility argument in section 6 is sound against per-event attribution and against target-blind masking; it is NOT a proof that the feature cannot exist. Keep this distinction - it is the single most important correction in this document.

Designs R1 and R2 below are the two attempts to cash the reframing in.

### Design R1 - link-resolution-invariant hashing

**Sketch.** Add an optional `linkAwareHash` to `HashCacheEntry` (`src/main.ts:37`), computed as `sha256(maskedBody + '\n' + resolvedTargets)`: mask every `links`/`embeds` span (verifying `content.slice(start,end) === ref.original` first), and append the document-ordered list of `getFirstLinkpathDest(...)?.path` per link, including a custom alias but excluding an auto-derived one. Keep the raw `hash` as the first check so nothing is invalidated. Bridge the rename with a session `newPath -> oldPath` map. Opt-in, default off.

**Verdict: rejected.** Adversarially reviewed (Codex `gpt-5.6-terra`/xhigh); the defects below were then checked by hand.

1. **It is blind to `hashTrackingMode`, and that alone loses data.** The raw hash honours `body` / `frontmatter` / `both`, but `linkAwareHash` was specified over the body. In `both` mode a frontmatter-only edit (say `title`) makes the raw hash differ while the link-aware hash matches - **a real edit is suppressed**. In `frontmatter` mode it would suppress nearly every property edit. Fixable by masking the output of `getContentForHashing` instead of the raw body, but the sketch as written would have shipped a data-losing default.
2. **Link KIND is erased.** `[[A]]` -> `![[A]]` turns a link into an embed, which renders the whole target inline. Both are spans, both mask to the same placeholder, the resolved target is unchanged - suppressed. Not a corner case.
3. **The alias discriminator does not match `JF`.** Core rewrites the alias only when the OLD link part contained `/` (F-E) - a predicate on text that no longer exists. "Alias equals the target basename" is not that rule: `[[A]]` -> `[[A|A]]` (a human adding an explicit alias) is suppressed, while `[[Old|Old]]` -> `[[New|Old]]` fails open. Fixing it means reimplementing the erased predicate - the grammar R1 claimed to avoid.
4. **The session map aliases paths, and paths are not identities.** Delete `B` and create an unrelated `B` after `A -> B`, and the map still canonicalises the new `B` to `A`. `A -> B -> A` and name swaps make it cyclic.
5. **It would silently not activate for existing users.** Cache auto-population fills only *absent* entries, not incompatible ones, so a warm cache never gains `linkAwareHash` until each file is edited once.
6. **Its cost argument was a false equivalence.** R1 claimed its residual was smaller than the freshness guard's accepted loss. The freshness guard loses edits inside a bounded 5-second window; R1 loses whole classes of deliberate edits for an unbounded session lifetime. Different shapes; not comparable.

Note what fixing (2) and (3) does: it drags link grammar back in, eroding the one advantage R1 had over Design D.

### Design R2 - rename-scoped exact diff, bounded by `updateQueue.promise`

**Status: BUILT (2026-09-04).** Specified in `docs/plans/experimental-rename-link-suppression.md`, then implemented behind an opt-in, default-off setting. Its open questions were answered empirically against a real Obsidian - see [Outcome](#8-outcome---r2-was-built-2026-09-04).

**Sketch.** No second hash, no persisted schema change. On `rename`, and only when `fileManager.inProgressUpdates` is an array (F-G - so a bare `Vault.rename()` arms nothing): find backlink sources via `resolvedLinks`, verify each source's current raw hash still equals its cache entry (baseline freshness), snapshot its content, then `await fileManager.updateQueue.promise` (F-C - an observed completion, not a guessed window). When it resolves, re-read each source and suppress only if the diff against the snapshot is confined to link spans AND every link still resolves to the same note; then refresh that file's hash and clear its pending timer.

**Why it inherits the reframing without R1's defects:**

| R1 defect | Under R2 |
|---|---|
| 1. `hashTrackingMode` blindness | not applicable - an exact diff, not a second hash |
| 2. link kind erased | the OLD text is in hand, so `[[A]]` vs `![[A]]` is directly visible |
| 3. alias discriminator wrong | no classification needed - compare old and new span text directly |
| 4. session map poisoning | window bounded by `updateQueue.promise`, scoped to that rename's sources |
| 5. silent non-activation | no cache schema change |

**Known costs and non-coverage:** two undocumented internals with fail-open; an O(vault) `resolvedLinks` scan per rename (hard cap for folder moves, F-F); a read of every backlink source at rename time; and it does NOT cover heading renames (no `rename` event), property renames (F-D), or a second device receiving the rewrites over sync.

**Open questions for whoever reviews it:** does the read at rename time reliably win the race against the rewrite (if it loses, the snapshot equals the rewritten state and the diff degenerates to "no change" - correct, but coverage is lost silently)? Does a folder rename route through `vault.rename` and therefore leave `inProgressUpdates` null (see F-G's caveat)? What happens when a human edits a source between the snapshot and the rewrite?

## 5. How this was reviewed

Cross-provider and cross-family, deliberately decorrelated. Each design was reviewed against a self-contained brief that carried the verified facts but withheld any verdict.

| Design | Reviewer | Model / effort | Verdict |
|---|---|---|---|
| A | Codex (OpenAI) | `gpt-5.6-terra` / xhigh, adversarial, web | no-go as specified |
| B | Codex (OpenAI) | `gpt-5.6-terra` / xhigh, adversarial, web | reject as framed; viable if reframed |
| C | Fable (Anthropic) | adversarial, repo + asar + web | do not build; build D instead |
| C | Codex (OpenAI) | `gpt-5.6-sol` / high, adversarial, web | do not build; document instead |
| the whole thread | Fable (Anthropic) | **steelman**, repo + asar + web | found the reframing; proposed R1 and R2 |
| R1 | Codex (OpenAI) | `gpt-5.6-terra` / xhigh, adversarial, web leg FAILED | no-go, unsafe |
| **R2** | **none yet** | - | **unreviewed** |

Notes on review quality, for future readers weighing these conclusions:

- The F-D correction was found independently by two reviewers and then verified directly in the `.asar`. Treat it as established.
- **The two C reviews disagreed on P6 (fail-open).** Fable confirmed it after actively searching for a counterexample; Codex produced the stale-cache-human-revert case above. The counterexample was checked by hand and holds. This disagreement is the single most valuable output of the review process and is the reason C is dead rather than merely expensive.
- Both C reviews ran with a degraded web leg (the LiteLLM search proxy was down; both fell back to official Obsidian docs, direct GitHub sources and context7). Code-derived facts are unaffected. The R1 review lost its web leg entirely (LiteLLM TLS failure plus context7 unavailable) and inspected a locally installed Obsidian **1.14** rather than 1.13.7 - which is why its folder-rename claim is flagged as unverified in F-G.
- **Four adversarial passes in a row produced a framing error.** Every brief asked "break this design"; none asked "is this the right question?". The result was a conclusion ("impossible") that was true of the question being asked and false of the user's actual need. The steelman pass that found the reframing also produced the two corrections to F-C and F-G that four adversarial passes had all accepted on trust. **When a line of investigation has been rejected three or more times, change the lens before adding another rejection.**
- Reviewers converged from opposite directions on the same wall - events carry no causality, content carries no authorship - and that convergence was mistaken for proof. It is proof about attribution only. See "The reframing" in section 4.

---

## 6. Decision

**Do not build any of A, B, C, D or R1 at this time. Document the limitation and ship a manual workflow. R2 stays open but unreviewed.** *(Superseded 2026-09-04: R2 was reviewed and built. Everything said about A-D and R1 still holds.)*

Note the reason changed on 2026-09-04. The original reasoning was "this is impossible". That is no longer the honest summary: it is **possible but not yet justified, and no vetted design exists**. Recording the difference matters, because "impossible" would wrongly close the question forever.

Reasoning:

1. **Per-event attribution is impossible; the feature is not.** A `modify` carries no causality and content carries no authorship, so "was this a rename rewrite?" cannot be answered - that part stands. But "does this change preserve every link's resolved target?" is checkable, and Obsidian's rewriter guarantees exactly that property. See "The reframing" in section 4. Do not cite this record as proof of impossibility.
2. **Every design that has actually been reviewed failed, and mostly in the dangerous direction.** A loses real edits to debounce coalescing; C's "obviously fail-open" property was broken by a counterexample; R1 suppresses frontmatter edits and link-to-embed conversions. The pattern is that each design's safety argument looked sound until someone attacked it specifically. R2 has not been through that yet, so it does not get to count as safe.
3. **Demand is thin, but no longer a single voice.** Two reports as of 2026-09-03 (see section 9). The core FR has been open since 2021 with no movement.
4. **The maintenance liability is real for the grammar-reproducing designs** (D, and R1 once its alias defect is fixed): 1943 lines of prior art for the forward direction alone, a documented alias-rule change in 1.11.6, and silent degradation when the grammar drifts. It is materially lower for R2, which compares old and new text directly instead of generating either.
5. **The behavioural blast radius is wider than a timestamp.** Any suppression path also silences `updated_count`, the post-update command, the `created` backfill and the inversion repair, all of which sit behind the same pass.

### The manual workflow (works today, zero code)

Every piece already exists in the plugin:

1. Turn auto-update off - command "Toggle auto-update on/off" (`toggle-auto-update`), or click the status bar item. Use the toggle, **not** `pause-auto-update`: the pause is hard-coded to 5 minutes (`src/main.ts:362`) and a rename plus the link-update modal plus a cache rebuild can easily exceed that.
2. Rename the note; complete Obsidian's link-update prompt.
3. Run "Rebuild cache" (Settings -> Bulk operations -> Rebuild hash cache).
4. Turn auto-update back on.

The rebuild rebaselines hashes onto the current disk state, so the rewritten links are not seen as a change. The trade-off is explicit rather than guessed: any other edit made during the pause is rebaselined too - but the user chose that, the plugin did not infer it.

### What to say in the issue

Give the four-step workflow, link the core FR, and ask whether it covers the reporter's case. Do not promise a setting.

**Do not say "Obsidian gives plugins no way to detect this" any more** - that was said in the 2026-09-02 comment and, as stated, it overclaims. The accurate line is: attributing an individual `modify` to a rename is impossible, so the only honest feature is "ignore changes that leave every link pointing at the same note", and no reviewed design has achieved that safely yet.

---

## 7. Reopening criteria

Revisit only if one of these becomes true:

- **Obsidian ships a transaction id, an operation id, or a link-update event.** This is the clean solution and makes everything above obsolete. Watch `runAsyncLinkUpdate` / `updateInternalLinks` across releases.
- **Demand materialises**: several independent reports, or reactions on #18. Then review and build **R2** - not B, not R1, and never C. D remains the fallback if R2 fails review.
- A user reports the reverse problem (wanting link rewrites to bump the date) - confirms the setting must stay opt-in whatever happens.

Whatever gets built, these are non-negotiable (they were derived for D but apply to R2 unchanged):

- Prove baseline freshness at snapshot time (compare the source's current normalized hash to the cache) - Codex's addition, and the reason D beats C.
- Hard caps on backlink count and file size, fail-open beyond them.
- The suppression must return before `computeFrontmatterUpdates`, so `updated_count` and the post-update command cannot fire, and it must refresh the cache using the exact `shouldFileBeIgnored` normalization (including the `.trim()` on read, `src/main.ts:540`).
- An explicit origin flag so the manual "Update timestamps for current file" command is never rejected by the guard.
- Real-Obsidian e2e coverage for: delayed "Just once", "Do not update", shortest / relative / absolute path formats, markdown-link mode, alias label rewriting (F-E), headings, block ids, embeds, code fences, folder moves, third-party `Vault.rename()`, and cache migration.
- Documented non-coverage: heading renames, property renames, second devices, non-body hash modes.

## 8. Issue thread history

Kept because the reframing came out of the thread, not out of the code.

- **2026-08-31** - `nauxi4` files #18, ticking the "can be opt-in and safe-by-default" box.
- **2026-09-02** - maintainer posts the "I can't make this reliable" answer with the four-step workflow, moves it to the backlog. That comment's framing ("no way to distinguish") is now known to overclaim; see section 6.
- **2026-09-03** - `SolMi-Sera` proposes checking the diff on `modify` and skipping the stamp if the change is confined to brackets, plus `git diff` as the mechanism. Maintainer replies that the escape hatch (delete and retype the link) is undetectable because the plugin sees states rather than keystrokes; that renames also rewrite the display text (F-E) and markdown targets live in parentheses; and that git is unavailable on mobile (`isDesktopOnly: false`) and compares against the wrong baseline anyway. All three points hold.
- **2026-09-03** - `SolMi-Sera` restates it with a worked example. His model has backlinks stored inside the linked note, so he expects the linked notes to fire `modify`; they do not, because Obsidian derives backlinks from the links in every other note. Core Obsidian also has no note UID - a note's identity is its path.
- **2026-09-04** - a steelman pass over the whole thread found that he was **not** rediscovering Design B. He was pointing at a content invariant, and the missing word was "resolution", not "brackets": the condition is "still points at the same note", not "the change is inside the brackets". That produced the reframing, R1 and R2, and the F-C / F-G corrections.

**Second voice on the record.** `SolMi-Sera` explicitly accepts the residual cost ("the user would need to delete the entire backlink & add the new one"), so the demand count is two, both willing to trade away the manual-retarget case. Under the reframing that trade is much smaller than they were told - a manual retarget to a *different* note still stamps.

## 9. Related

- `CLAUDE.md` -> "File modification pipeline", "Freshness / no-op-write guard", "Hash cache lifecycle" - the machinery every design above had to interact with.
- `docs/architecture.md` - the hash-gated write pipeline.
- Issue #18; Obsidian core FR forum.obsidian.md/t/25629.

---

## 8. Outcome - R2 was built (2026-09-04)

R2's three open questions were answered by probing a real Obsidian 1.13.4 rather than by argument, and every answer came back favourable:

- **Is `fileManager.inProgressUpdates` an array when a plugin's `rename` listener fires?** Yes. Measured live: `array` during `fileManager.renameFile`, `null` during `vault.rename`, `null` at rest. This is the gate the whole design rests on and it had only ever been read from the bundle.
- **Does the read at rename time win the race against the rewrite?** Yes, even with "Automatically update internal links" ON (the tightest case, no modal at all): the arm-time read returns the pre-rewrite text, and the suppression completes ~14 ms after the rename, well inside the 2 s modify debounce. Losing that race was always safe (it degenerates to "no change" and the note is stamped) - it turns out not to happen.
- **What if a human edits a source between the snapshot and the rewrite?** The prediction no longer matches the file byte for byte, so nothing is suppressed and the edit is stamped. Proven by e2e R4, the non-negotiable scenario.
- **Does a folder rename leave `inProgressUpdates` null?** It does not need to: Obsidian fires one `rename` event per moved child, and the second event cancels the armed batch outright. Proven by e2e R8.

**Deviations from the non-negotiables listed in section 7,** each deliberate:

- **The pending timer is NOT cleared.** `modifyTimers` is a single map serving four unrelated purposes with no record of which is which, so cancelling one blindly could drop a real pending update. It is unnecessary: refreshing the hash makes the already-scheduled pass find `unchanged` and return before `computeFrontmatterUpdates`, which satisfies the "`updated_count` and the post-update command must not fire" requirement by the same route.
- **No origin flag for the manual command.** Nothing is ever rejected - the only effect of a match is a hash refresh - so the manual "Update timestamps for current file" command needs no exemption.
- **Heading renames, property renames and sync-received rewrites remain uncovered,** exactly as R2 predicted.

**One real bug surfaced only in e2e**, and it is the reason the suite is worth its runtime: an arming batch whose candidates were all skipped stayed armed, so the NEXT rename read it as a folder move and cancelled itself - silently costing every other rename. The disarm now lives in a `finally` and is pinned by a unit test.

The maintained record of the shipped design lives in `CLAUDE.md` -> "Experimental rename-link suppression - the SECOND writer to the hash cache". This decision record is kept for the rejections and the reasoning that produced them.

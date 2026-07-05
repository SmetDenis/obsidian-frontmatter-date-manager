// Shared numeric constants with no Obsidian dependency.
//
// Kept in their own module (rather than inlined in main.ts) so tests can assert
// against the exact production value instead of a drifting literal, without
// widening the plugin entry module's public surface.

// Debounce window for the vault `modify` event, in milliseconds. Rapid edits to
// the same file collapse into a single processFileWithLock call after this delay
// (see setupOnEditHandler in main.ts). Also reused by the concurrent-write retry.
export const MODIFY_DEBOUNCE_MS = 2000;

// Freshness margin (seconds) for the automatic `updated`/`viewed` write guard.
// When the on-disk value is within this many seconds of the file's mtime (or ahead
// of it), the value already reflects the modification, so re-stamping would be a
// near-no-op write. Kept small so `minSecondsBetweenSaves` still governs edit-time
// throttling. See computeFrontmatterUpdates / handleFileOpen in main.ts.
export const FRESHNESS_SEC = 5;

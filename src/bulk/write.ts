import { App, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from '../main';
import { strings } from '../i18n';

/**
 * Sentinel thrown by applyFrontmatterWrite when the target note's editor buffer
 * holds unsaved changes. A skip, not a failure: runExecutePhase collects it
 * separately (ExecutePhaseResult.skipped) so the modal can show the user which
 * notes were left untouched and why. The skipped file is NOT requeued or
 * retried in the background - the preview is a historical snapshot, and a
 * later silent write would break the mandatory dry-run contract. The user
 * saves/closes the note and runs a new preview.
 */
export class BulkSkipped extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BulkSkipped';
  }
}

/**
 * The one safe way to mutate a note's frontmatter from a bulk operation.
 *
 * - Refuses (throws BulkSkipped) when any editor buffer of the note has unsaved
 *   changes - writing would make Obsidian 3-way-merge the write into the live
 *   buffer and show the "modified externally" notice - or when an open
 *   Excalidraw view of the note is dirty/busy (an external write into a
 *   drawing idle > 5 min triggers Excalidraw's reload + clearDirty, discarding
 *   unsaved strokes; see getWriteBlock in main.ts). The two cases carry
 *   distinct skip reasons so the modal's skipped table tells the user what to
 *   do (save/close the note vs. save the drawing).
 * - Calls processFrontMatter WITHOUT a { ctime, mtime } argument so Obsidian
 *   detects the change and an open editor re-renders.
 * - Records lastPluginWriteMtime so the resulting self-triggered modify event
 *   is suppressed in handleFileChange.
 * - Refreshes the hash cache (when enabled) so a stale cache cannot make
 *   handleFileChange spuriously re-stamp `updated`.
 *
 * Centralizes the dance previously duplicated across every bulk modal.
 */
export async function applyFrontmatterWrite(
  app: App,
  plugin: FrontmatterDateManagerPlugin,
  file: TFile,
  mutator: (frontmatter: Record<string, unknown>) => void,
): Promise<void> {
  const block = await plugin.getWriteBlock(file);
  if (block === 'markdown') {
    throw new BulkSkipped(strings.bulkChrome.skippedUnsavedChanges);
  }
  // Both Excalidraw states skip: a bulk run cannot wait, and writing into a
  // drawing that is mid-save would race its serialization.
  if (block === 'excalidraw' || block === 'excalidraw-busy') {
    throw new BulkSkipped(strings.bulkChrome.skippedExcalidrawUnsaved);
  }
  await app.fileManager.processFrontMatter(file, mutator);
  plugin.lastPluginWriteMtime.set(file.path, file.stat.mtime);
  if (plugin.settings.enableContentHashCheck ?? true) {
    await plugin.populateCacheForFile(file);
  }
}

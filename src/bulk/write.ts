import { App, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from '../main';

/**
 * The one safe way to mutate a note's frontmatter from a bulk operation.
 *
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
  await app.fileManager.processFrontMatter(file, mutator);
  plugin.lastPluginWriteMtime.set(file.path, file.stat.mtime);
  if (plugin.settings.enableContentHashCheck ?? true) {
    await plugin.populateCacheForFile(file);
  }
}

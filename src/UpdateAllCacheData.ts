import { TFile } from 'obsidian';
import { BaseBulkModal } from './BaseBulkModal';

export class UpdateAllCacheData extends BaseBulkModal {
  protected getTitle(fileCount: number): string {
    return `Populate hash cache for ${fileCount} files`;
  }

  protected getDescription(): string {
    return 'This will update all cache data on files affected by this plugin.';
  }

  protected getWarning(): string | null {
    return null;
  }

  protected getRunningMessage(): string {
    return 'Updating cache...';
  }

  // Rebuilding the cache is intentional bulk processing: it must re-hash every
  // eligible file, not skip the ones whose cached hash already matches.
  protected skipHashCheck(): boolean {
    return true;
  }

  protected async processFile(file: TFile): Promise<void> {
    await this.plugin.populateCacheForFileDirect(file);
  }

  protected async onComplete(): Promise<void> {
    this.plugin.evictOldestCacheEntries();
    // populateCacheForFileDirect() mutates the cache without marking it dirty
    // (batched for performance), so we must mark dirty here — otherwise
    // flushHashCache() short-circuits and the rebuild is lost on reload.
    this.plugin.markHashCacheDirty();
    await this.plugin.flushHashCache();
  }
}

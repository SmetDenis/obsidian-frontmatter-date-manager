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

  protected async processFile(file: TFile): Promise<void> {
    await this.plugin.populateCacheForFileDirect(file);
  }

  protected async onComplete(): Promise<void> {
    this.plugin.evictOldestCacheEntries();
    await this.plugin.flushHashCache();
  }
}

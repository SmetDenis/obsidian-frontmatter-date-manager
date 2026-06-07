import { App, Notice, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { PhaseModal } from './bulk/PhaseModal';
import { runExecutePhase, ExecutePhaseResult } from './bulk/executePhase';
import {
  renderHeader,
  renderButtonBar,
  renderProgress,
  renderFailureTable,
} from './bulk/chrome';

export class UpdateAllCacheData extends PhaseModal {
  private plugin: FrontmatterDateManagerPlugin;
  private files: TFile[] = [];

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    super.onOpen();
    this.contentEl.addClass('frontmatter-date-manager-bulk-modal');
    void this.goTo(() => this.renderConfirmPhase());
  }

  onClose() {
    super.onClose();
    this.files = [];
  }

  private async renderConfirmPhase() {
    const { contentEl } = this;
    renderHeader(contentEl, 'Loading files…');
    this.files = await this.plugin.getAllFilesPossiblyAffected({
      skipHashCheck: true,
    });
    if (!this.isOpenState()) return;

    contentEl.empty();
    renderHeader(
      contentEl,
      `Rebuild change-detection data for ${this.files.length} files`,
      'This recomputes the content fingerprints (content hashes) used to detect real edits. It does not change your notes.',
    );
    renderButtonBar(contentEl, {
      primary: {
        label: 'Run',
        destructive: false,
        disabled: this.files.length === 0,
        onClick: () => void this.renderExecutePhase(),
      },
      footer: { kind: 'cancel', onClick: () => void this.close() },
    });
  }

  // Rebuild core — extracted so it is testable without the DOM. Rebuilding the
  // cache is intentional bulk processing; populateCacheForFileDirect mutates the
  // cache without marking it dirty (batched for performance), so onComplete must
  // evict + mark dirty + flush, otherwise the rebuild is lost on reload.
  protected async rebuildAll(
    onProgress: (done: number, total: number) => void,
  ): Promise<ExecutePhaseResult> {
    return runExecutePhase({
      plugin: this.plugin,
      items: this.files,
      isOpen: () => this.isOpenState(),
      processItem: (file) =>
        this.plugin.populateCacheForFileDirect(file).then(() => {}),
      onProgress,
      labelFor: (file) => file.path,
      onComplete: async () => {
        this.plugin.evictOldestCacheEntries();
        this.plugin.markHashCacheDirty();
        await this.plugin.flushHashCache();
      },
    });
  }

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();
    renderHeader(contentEl, 'Rebuilding…');

    const progress = renderProgress(contentEl, this.files.length);

    const { processed, errors, failures } = await this.rebuildAll(
      (done) => void progress.update(done),
    );
    if (!this.isOpenState()) {
      new Notice('Bulk operation stopped.', 2000);
      return;
    }

    contentEl.empty();
    if (errors > 0) {
      renderHeader(
        contentEl,
        `Done with ${errors} error(s).`,
        `${processed} file(s) processed.`,
      );
      renderFailureTable(contentEl, this.plugin, failures);
    } else {
      renderHeader(contentEl, 'Done! You can safely close this modal.');
    }
    renderButtonBar(contentEl, {
      footer: { kind: 'close', onClick: () => void this.close() },
    });
  }
}

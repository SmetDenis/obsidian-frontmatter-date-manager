import { App, Notice, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { PhaseModal } from './bulk/PhaseModal';
import { applyFrontmatterWrite } from './bulk/write';
import { runBatchedScan } from './bulk/scan';
import { runExecutePhase } from './bulk/executePhase';
import { copyPreviewToClipboard } from './bulk/export';
import {
  renderHeader,
  renderButtonBar,
  renderSummary,
  renderPaginatedDiffTable,
  renderCopyPreviewButton,
  renderProgress,
  renderFailureTable,
  ButtonBarHandle,
} from './bulk/chrome';
import {
  InversionFixStrategy,
  applyInversionFix,
  isInversion,
} from './inversionDetection';

export interface InvertedFileEntry {
  file: TFile;
  created: Date;
  updated: Date;
}

function formatDelta(created: Date, updated: Date): string {
  const ms = created.getTime() - updated.getTime();
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds <= 0) return '0s';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

export class FindInversionsModal extends PhaseModal {
  private plugin: FrontmatterDateManagerPlugin;
  private invertedEntries: InvertedFileEntry[] = [];
  private selectedStrategy: InversionFixStrategy = 'disabled';
  private warningEl: HTMLElement | null = null;
  private bar: ButtonBarHandle | null = null;

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    super.onOpen();
    this.contentEl.addClass('frontmatter-date-manager-bulk-modal');
    this.selectedStrategy =
      this.plugin.settings.inversionFixStrategy ?? 'disabled';
    void this.goTo(() => this.renderPreviewPhase());
  }

  onClose() {
    super.onClose();
    this.invertedEntries = [];
    this.warningEl = null;
    this.bar = null;
  }

  // Per-file detection — runs inside the batched scan so large vaults don't
  // freeze. Detection is independent of the chosen fix strategy.
  private computeInvertedForFile(file: TFile): InvertedFileEntry | null {
    const tolerance = this.plugin.settings.inversionToleranceSec ?? 0;
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    if (!createdKey || !updatedKey) return null;
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!fm) return null;
    const rawCreated = fm[createdKey] as string | number | undefined;
    const rawUpdated = fm[updatedKey] as string | number | undefined;
    if (rawCreated == null || rawUpdated == null) return null;
    const created = this.plugin.parseDate(rawCreated);
    const updated = this.plugin.parseDate(rawUpdated);
    if (!created || !updated) return null;
    if (isInversion(created, updated, tolerance)) {
      return { file, created, updated };
    }
    return null;
  }

  // Preserved batch API (covered by findInversionsModal.test.ts).
  computeInvertedFiles(files: TFile[]): InvertedFileEntry[] {
    const result: InvertedFileEntry[] = [];
    for (const file of files) {
      const entry = this.computeInvertedForFile(file);
      if (entry) result.push(entry);
    }
    return result;
  }

  async processFile(file: TFile): Promise<void> {
    if (this.selectedStrategy === 'disabled') return;
    const entry = this.invertedEntries.find((e) => e.file.path === file.path);
    if (!entry) return;
    const fixed = applyInversionFix(this.selectedStrategy, {
      created: entry.created,
      updated: entry.updated,
      mtime: new Date(file.stat.mtime),
      ctime: new Date(file.stat.ctime),
    });
    const newCreated = this.plugin.formatDate(fixed.created);
    const newUpdated = this.plugin.formatDate(fixed.updated);
    if (newCreated === undefined || newUpdated === undefined) return;

    await applyFrontmatterWrite(
      this.app,
      this.plugin,
      file,
      (frontmatter: Record<string, unknown>) => {
        frontmatter[this.plugin.settings.headerCreated] = newCreated;
        frontmatter[this.plugin.settings.headerUpdated] = newUpdated;
      },
    );
  }

  private refreshWarning(): void {
    if (!this.warningEl) return;
    this.warningEl.empty();
    if (this.selectedStrategy === 'disabled') return;
    if (this.invertedEntries.length === 0) return;
    this.warningEl.createSpan({
      text: `This will modify ${this.invertedEntries.length} files. Irreversible without a backup.`,
      cls: 'frontmatter-date-manager-bulk-warning',
    });
  }

  private async renderPreviewPhase() {
    const { contentEl } = this;
    renderHeader(contentEl, 'Finding inverted files…');

    const allFiles = await this.plugin.getAllFilesPossiblyAffected({
      skipHashCheck: true,
    });
    const progress = renderProgress(contentEl, allFiles.length);

    const scanned = await runBatchedScan({
      files: allFiles,
      isOpen: () => this.isOpenState(),
      onProgress: (done) => void progress.update(done),
      compute: (file) => this.computeInvertedForFile(file),
    });
    if (!this.isOpenState()) return;
    this.invertedEntries = scanned.filter(
      (e): e is InvertedFileEntry => e !== null,
    );

    contentEl.empty();
    renderHeader(
      contentEl,
      `Found ${this.invertedEntries.length} inverted files`,
      'These files have updated date earlier than created date. Choose a fix strategy below or close to review manually.',
    );

    if (this.invertedEntries.length === 0) {
      contentEl.createDiv({
        cls: 'frontmatter-date-manager-bulk-summary',
        text: 'No inverted files found in the eligible set.',
      });
      renderButtonBar(contentEl, {
        footer: { kind: 'close', onClick: () => void this.close() },
      });
      return;
    }

    renderSummary(contentEl, {
      changed: this.invertedEntries.length,
      skipped: 0,
    });

    new Setting(contentEl)
      .setName('Fix strategy')
      .setDesc('How to resolve the inversion.')
      .addDropdown((dd) => {
        dd.addOption('disabled', "Don't fix (review only)");
        dd.addOption('created-to-updated', 'Set created = updated');
        dd.addOption('updated-to-created', 'Set updated = created');
        dd.addOption('max-all', 'Set both = max of all known dates');
        dd.setValue(this.selectedStrategy);
        dd.onChange((value: string) => {
          this.selectedStrategy = value as InversionFixStrategy;
          this.bar?.setPrimaryDisabled(this.selectedStrategy === 'disabled');
          this.refreshWarning();
        });
      });

    const tolerance = this.plugin.settings.inversionToleranceSec ?? 0;
    contentEl.createDiv({
      cls: 'frontmatter-date-manager-bulk-summary',
      text: `Tolerance: ${tolerance} seconds (configurable in plugin settings).`,
    });

    const columns = ['Path', 'Created', 'Updated', 'Δ'];
    const rows = this.invertedEntries.map((entry) => [
      entry.file.path,
      entry.created.toISOString(),
      entry.updated.toISOString(),
      formatDelta(entry.created, entry.updated),
    ]);
    renderPaginatedDiffTable(contentEl, {
      columns,
      rows,
      columnClasses: [
        undefined,
        undefined,
        undefined,
        'frontmatter-date-manager-inversion-delta',
      ],
    });

    this.warningEl = contentEl.createDiv();
    this.refreshWarning();

    renderCopyPreviewButton(contentEl, () => {
      void copyPreviewToClipboard(this.plugin, columns, rows);
    });

    this.bar = renderButtonBar(contentEl, {
      primary: {
        label: 'Run',
        destructive: true,
        disabled: this.selectedStrategy === 'disabled',
        onClick: () => void this.renderExecutePhase(),
      },
      footer: { kind: 'cancel', onClick: () => void this.close() },
    });
  }

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();
    renderHeader(contentEl, 'Fixing inversions…');

    const items = this.invertedEntries.map((e) => e.file);
    const progress = renderProgress(contentEl, items.length);

    const { processed, errors, failures } = await runExecutePhase({
      plugin: this.plugin,
      items,
      isOpen: () => this.isOpenState(),
      processItem: (file) => this.processFile(file),
      onProgress: (done) => void progress.update(done),
      labelFor: (file) => file.path,
    });
    if (!this.isOpenState()) {
      new Notice('Bulk operation stopped.', 2000);
      return;
    }

    new Notice(`Fixed ${processed} inversion(s).`, 4000);

    contentEl.empty();
    if (errors > 0) {
      renderHeader(
        contentEl,
        `Done with ${errors} error(s).`,
        `${processed} inversion(s) fixed.`,
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

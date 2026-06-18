import { App, Notice, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { PhaseModal } from './bulk/PhaseModal';
import { applyFrontmatterWrite } from './bulk/write';
import { runBatchedScan } from './bulk/scan';
import { runExecutePhase } from './bulk/executePhase';
import { downloadPreviewAsFile } from './bulk/export';
import {
  renderHeader,
  renderButtonBar,
  renderSummary,
  renderPaginatedDiffTable,
  renderDownloadPreviewButton,
  renderProgress,
  renderFailureTable,
  ButtonBarHandle,
} from './bulk/chrome';
import {
  InversionFixStrategy,
  applyInversionFix,
  isInversion,
} from './inversionDetection';
import { strings, format } from './i18n';

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

  // Per-file detection - runs inside the batched scan so large vaults don't
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
      text: format(strings.modals.inversions.fixWarning, {
        count: this.invertedEntries.length,
      }),
      cls: 'frontmatter-date-manager-bulk-warning',
    });
  }

  private async renderPreviewPhase() {
    const { contentEl } = this;
    renderHeader(contentEl, strings.modals.inversions.scanningTitle);

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
      format(strings.modals.inversions.foundTitle, {
        count: this.invertedEntries.length,
      }),
      strings.modals.inversions.foundSubtitle,
    );

    if (this.invertedEntries.length === 0) {
      contentEl.createDiv({
        cls: 'frontmatter-date-manager-bulk-summary',
        text: strings.modals.inversions.noneFound,
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
      .setName(strings.modals.inversions.strategyName)
      .setDesc(strings.modals.inversions.strategyDesc)
      .addDropdown((dd) => {
        dd.selectEl.addClass('frontmatter-date-manager-inversions-strategy');
        dd.addOption(
          'disabled',
          strings.modals.inversions.strategyOptionDisabled,
        );
        dd.addOption(
          'created-to-updated',
          strings.modals.inversions.strategyOptionCreatedToUpdated,
        );
        dd.addOption(
          'updated-to-created',
          strings.modals.inversions.strategyOptionUpdatedToCreated,
        );
        dd.addOption('max-all', strings.modals.inversions.strategyOptionMaxAll);
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
      text: format(strings.modals.inversions.toleranceNote, { tolerance }),
    });

    const columns = [
      strings.common.file,
      strings.common.created,
      strings.common.updated,
      strings.modals.inversions.columnDelta,
    ];
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

    renderDownloadPreviewButton(contentEl, () => {
      downloadPreviewAsFile(this.plugin, columns, rows);
    });

    this.bar = renderButtonBar(contentEl, {
      primary: {
        label: strings.common.run,
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
    renderHeader(contentEl, strings.modals.inversions.fixingDates);

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
      new Notice(strings.modals.inversions.stopped, 2000);
      return;
    }

    new Notice(
      format(strings.modals.inversions.fixedNotice, { processed }),
      4000,
    );

    contentEl.empty();
    if (errors > 0) {
      renderHeader(
        contentEl,
        format(strings.common.doneWithErrors, { errors }),
        format(strings.modals.inversions.doneWithErrorsSubtitle, { processed }),
      );
      renderFailureTable(contentEl, this.plugin, failures);
    } else {
      renderHeader(contentEl, strings.modals.inversions.doneTitle);
    }
    renderButtonBar(contentEl, {
      footer: { kind: 'close', onClick: () => void this.close() },
    });
  }
}

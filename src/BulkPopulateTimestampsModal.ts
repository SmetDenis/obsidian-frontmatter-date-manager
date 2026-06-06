import { App, Notice, Platform, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { PhaseModal } from './bulk/PhaseModal';
import { applyFrontmatterWrite } from './bulk/write';
import { runBatchedScan } from './bulk/scan';
import { runExecutePhase } from './bulk/executePhase';
import { copyPreviewToClipboard } from './bulk/export';
import {
  renderHeader,
  renderButtonBar,
  renderWarning,
  renderSummary,
  renderPaginatedDiffTable,
  renderCopyPreviewButton,
  renderProgress,
  renderFailureTable,
} from './bulk/chrome';

export type PopulateMode = 'created' | 'updated' | 'both';
export type OverrideMode = 'fill-missing' | 'overwrite-all';

export interface FilePreviewEntry {
  file: TFile;
  proposedCreated: string | number | null;
  proposedUpdated: string | number | null;
  existingCreated: string | number | null;
  existingUpdated: string | number | null;
  willChange: boolean;
}

export class BulkPopulateTimestampsModal extends PhaseModal {
  private plugin: FrontmatterDateManagerPlugin;
  private populateMode: PopulateMode = 'both';
  private overrideMode: OverrideMode = 'fill-missing';
  private previewEntries: FilePreviewEntry[] = [];

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    super.onOpen();
    this.contentEl.addClass('frontmatter-date-manager-bulk-modal');
    void this.goTo(() => {
      this.renderConfigurePhase();
    });
  }

  onClose() {
    super.onClose();
    this.previewEntries = [];
  }

  // --- Phase 1: Configure ---

  private renderConfigurePhase() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', {
      text: 'Populate timestamps from filesystem',
    });

    const subtitle = contentEl.createEl('p');
    subtitle.appendText('Set created and/or updated dates in frontmatter');
    subtitle.createEl('br');
    subtitle.appendText('using filesystem timestamps (ctime/mtime).');

    // Mode dropdown
    new Setting(contentEl)
      .setName('What to populate')
      .setDesc('Choose which timestamp fields to set.')
      .addDropdown((dd) =>
        dd
          .addOption('both', 'Both created and updated')
          .addOption('created', 'Created dates only (from ctime)')
          .addOption('updated', 'Updated dates only (from mtime)')
          .setValue(this.populateMode)
          .onChange((val) => {
            this.populateMode = val as PopulateMode;
            this.updateWarnings(warningContainer, overwriteWarning);
          }),
      );

    // Override mode dropdown
    new Setting(contentEl)
      .setName('Override behavior')
      .setDesc('How to handle files that already have dates.')
      .addDropdown((dd) =>
        dd
          .addOption('fill-missing', 'Fill missing only (safe)')
          .addOption('overwrite-all', 'Overwrite all (replaces existing)')
          .setValue(this.overrideMode)
          .onChange((val) => {
            this.overrideMode = val as OverrideMode;
            this.updateWarnings(warningContainer, overwriteWarning);
          }),
      );

    // Platform warning
    const warningContainer = contentEl.createDiv({
      cls: 'frontmatter-date-manager-populate-platform-warning',
    });

    // Overwrite warning
    const overwriteWarning = contentEl.createDiv({
      cls: 'frontmatter-date-manager-populate-overwrite-warning',
    });

    this.updateWarnings(warningContainer, overwriteWarning);

    // Auto-update note
    const autoUpdateNote = contentEl.createDiv({
      cls: 'frontmatter-date-manager-populate-auto-update-note',
    });
    autoUpdateNote.createEl('strong', {
      text: 'Note about auto-update:',
    });
    autoUpdateNote.createEl('br');
    autoUpdateNote.appendText(
      'If auto-update has been active, filesystem dates (ctime/mtime) ' +
        'may already reflect the plugin’s modifications, not the original file dates. ' +
        'For best results, use this feature before enabling auto-update ' +
        'or right after installing the plugin.',
    );

    renderButtonBar(contentEl, {
      primary: {
        label: 'Scan & preview',
        destructive: false,
        onClick: () => {
          void this.goTo(() => this.renderPreviewPhase());
        },
      },
      footer: {
        kind: 'cancel',
        onClick: () => {
          this.close();
        },
      },
    });
  }

  private updateWarnings(
    warningContainer: HTMLElement,
    overwriteWarning: HTMLElement,
  ) {
    const includesCreated =
      this.populateMode === 'created' || this.populateMode === 'both';

    // Platform warning
    warningContainer.empty();

    const warningTitle = warningContainer.createEl('strong');
    warningTitle.setText(
      includesCreated
        ? 'Warning: File creation time (ctime) is unreliable on some platforms'
        : 'Platform note',
    );
    warningContainer.createEl('br');

    const platforms = [
      {
        name: 'macOS / Windows',
        reliable: true,
        note: 'ctime is actual file creation time',
        isCurrent: Platform.isMacOS || Platform.isWin,
      },
      {
        name: 'Linux',
        reliable: false,
        note: 'ctime is inode change time, NOT creation time',
        isCurrent:
          Platform.isLinux && !Platform.isAndroidApp && !Platform.isMobileApp,
      },
      {
        name: 'Android',
        reliable: false,
        note: 'depends on filesystem, often unreliable',
        isCurrent: Platform.isAndroidApp,
      },
      {
        name: 'iOS',
        reliable: true,
        note: 'generally reliable (APFS)',
        isCurrent: Platform.isIosApp,
      },
    ];

    const list = warningContainer.createEl('ul');
    for (const p of platforms) {
      const li = list.createEl('li');
      if (p.isCurrent) {
        li.addClass('frontmatter-date-manager-current-platform');
      }
      const prefix = p.reliable ? 'Reliable' : 'UNRELIABLE';
      li.appendText(`${p.name}: ${prefix}`);
      li.createEl('br');
      li.appendText(`${p.note}${p.isCurrent ? ' (your platform)' : ''}`);
    }

    const syncNote = warningContainer.createEl('p');
    syncNote.appendText(
      'Synced vaults: timestamps may be reset by sync services',
    );
    syncNote.createEl('br');
    syncNote.appendText('(Obsidian Sync, iCloud, Dropbox, Git).');
    syncNote.createEl('br');
    syncNote.appendText('mtime is generally more reliable than ctime.');

    if (includesCreated) {
      const recommendation = warningContainer.createEl('p');
      recommendation.createEl('strong', {
        text: 'Recommendation: review results after running. Make a backup first.',
      });
    }

    // Overwrite warning
    overwriteWarning.empty();
    if (this.overrideMode === 'overwrite-all') {
      overwriteWarning.setText(
        'This will replace existing frontmatter dates. This operation cannot be undone. Make a backup first.',
      );
    }
  }

  // --- Computation ---

  computePreviewEntry(file: TFile): FilePreviewEntry {
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    const cached: Record<string, unknown> | undefined =
      this.app.metadataCache.getFileCache(file)?.frontmatter;

    const existingCreated: string | number | null =
      createdKey && cached?.[createdKey] != null
        ? (cached[createdKey] as string | number)
        : null;
    const existingUpdated: string | number | null =
      updatedKey && cached?.[updatedKey] != null
        ? (cached[updatedKey] as string | number)
        : null;

    let proposedCreated: string | number | null = null;
    let proposedUpdated: string | number | null = null;

    const includeCreated =
      this.populateMode === 'created' || this.populateMode === 'both';
    const includeUpdated =
      this.populateMode === 'updated' || this.populateMode === 'both';

    if (includeCreated && createdKey) {
      const shouldSet =
        this.overrideMode === 'overwrite-all' || existingCreated == null;
      if (shouldSet) {
        const cTime = this.plugin.parseDate(file.stat.ctime);
        if (cTime) {
          proposedCreated = this.plugin.formatDate(cTime) ?? null;
        }
      }
    }

    if (includeUpdated && updatedKey) {
      const shouldSet =
        this.overrideMode === 'overwrite-all' || existingUpdated == null;
      if (shouldSet) {
        const mTime = this.plugin.parseDate(file.stat.mtime);
        if (mTime) {
          proposedUpdated = this.plugin.formatDate(mTime) ?? null;
        }
      }
    }

    // Null out proposed values that match existing — no real change
    if (
      proposedCreated !== null &&
      existingCreated !== null &&
      String(proposedCreated) === String(existingCreated)
    ) {
      proposedCreated = null;
    }

    if (
      proposedUpdated !== null &&
      existingUpdated !== null &&
      String(proposedUpdated) === String(existingUpdated)
    ) {
      proposedUpdated = null;
    }

    return {
      file,
      proposedCreated,
      proposedUpdated,
      existingCreated,
      existingUpdated,
      willChange: proposedCreated !== null || proposedUpdated !== null,
    };
  }

  // --- Phase 2: Preview ---

  private async renderPreviewPhase() {
    const { contentEl } = this;
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    const includeCreated =
      this.populateMode === 'created' || this.populateMode === 'both';
    const includeUpdated =
      this.populateMode === 'updated' || this.populateMode === 'both';

    if ((includeCreated && !createdKey) || (includeUpdated && !updatedKey)) {
      const missing = [];
      if (includeCreated && !createdKey) missing.push('created');
      if (includeUpdated && !updatedKey) missing.push('updated');
      new Notice(
        `No frontmatter key configured for: ${missing.join(', ')}. Check plugin settings.`,
      );
      return;
    }

    renderHeader(contentEl, 'Scanning files…');
    const allFiles = await this.plugin.getAllFilesPossiblyAffected({
      skipHashCheck: true,
    });
    const progress = renderProgress(contentEl, allFiles.length);

    this.previewEntries = await runBatchedScan({
      files: allFiles,
      isOpen: () => this.isOpenState(),
      onProgress: (done) => {
        progress.update(done);
      },
      compute: (file) => this.computePreviewEntry(file),
    });
    if (!this.isOpenState()) return;

    contentEl.empty();

    const willChange = this.previewEntries.filter((e) => e.willChange);
    const skipped = this.previewEntries.filter((e) => !e.willChange);

    renderHeader(contentEl, 'Preview: populate timestamps');

    if (willChange.length === 0) {
      contentEl.createEl('p', {
        text: 'No files need updating. All eligible files already have the requested timestamps.',
        cls: 'frontmatter-date-manager-bulk-summary',
      });
      renderButtonBar(contentEl, {
        footer: {
          kind: 'close',
          onClick: () => {
            this.close();
          },
        },
      });
      return;
    }

    renderSummary(contentEl, {
      changed: willChange.length,
      skipped: skipped.length,
    });

    const columns = ['File'];
    if (includeCreated && createdKey) columns.push(`Created (${createdKey})`);
    if (includeUpdated && updatedKey) columns.push(`Updated (${updatedKey})`);

    const rows = willChange.map((entry) => {
      const row = [entry.file.path];
      if (includeCreated && createdKey) {
        row.push(
          this.formatPreviewValue(entry.proposedCreated, entry.existingCreated),
        );
      }
      if (includeUpdated && updatedKey) {
        row.push(
          this.formatPreviewValue(entry.proposedUpdated, entry.existingUpdated),
        );
      }
      return row;
    });

    renderPaginatedDiffTable(contentEl, { columns, rows });

    const isOverwrite = this.overrideMode === 'overwrite-all';
    if (isOverwrite) {
      renderWarning(
        contentEl,
        'Overwrite mode: existing dates will be replaced. This cannot be undone. Make a backup first.',
      );
    }

    renderCopyPreviewButton(contentEl, () => {
      void copyPreviewToClipboard(this.plugin, columns, rows);
    });

    renderButtonBar(contentEl, {
      primary: {
        label: 'Run',
        destructive: isOverwrite,
        onClick: () => {
          void this.renderExecutePhase();
        },
      },
      back: () => {
        this.back();
      },
      footer: {
        kind: 'cancel',
        onClick: () => {
          this.close();
        },
      },
    });
  }

  private formatPreviewValue(
    proposed: string | number | null,
    existing: string | number | null,
  ): string {
    if (proposed === null) return '—';
    if (existing != null) {
      return `${String(existing)} → ${String(proposed)}`;
    }
    return String(proposed);
  }

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();
    renderHeader(contentEl, 'Populating timestamps…');

    const items = this.previewEntries.filter((e) => e.willChange);
    const progress = renderProgress(contentEl, items.length);

    const { processed, errors, failures } = await runExecutePhase({
      plugin: this.plugin,
      items,
      isOpen: () => this.isOpenState(),
      processItem: (entry) => this.applyTimestamps(entry),
      onProgress: (done) => {
        progress.update(done);
      },
      labelFor: (entry) => entry.file.path,
    });
    if (!this.isOpenState()) {
      new Notice('Bulk populate stopped.', 2000);
      return;
    }

    contentEl.empty();
    if (errors > 0) {
      renderHeader(
        contentEl,
        `Done with ${errors} error(s).`,
        `${processed} file(s) updated.`,
      );
      renderFailureTable(contentEl, this.plugin, failures);
    } else {
      renderHeader(contentEl, `Done! ${processed} file(s) updated.`);
    }
    renderButtonBar(contentEl, {
      footer: {
        kind: 'close',
        onClick: () => {
          this.close();
        },
      },
    });
  }

  protected async applyTimestamps(entry: FilePreviewEntry): Promise<void> {
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();

    const currentFile = this.app.vault.getAbstractFileByPath(entry.file.path);
    if (!currentFile || !(currentFile instanceof TFile)) return;

    await applyFrontmatterWrite(
      this.app,
      this.plugin,
      currentFile,
      (frontmatter: Record<string, unknown>) => {
        if (entry.proposedCreated !== null && createdKey) {
          frontmatter[createdKey] = entry.proposedCreated;
        }
        if (entry.proposedUpdated !== null && updatedKey) {
          frontmatter[updatedKey] = entry.proposedUpdated;
        }
      },
    );
  }
}

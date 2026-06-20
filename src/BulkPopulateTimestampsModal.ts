import { App, Notice, Platform, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { strings, format } from './i18n';
import { PhaseModal } from './bulk/PhaseModal';
import { applyFrontmatterWrite } from './bulk/write';
import { runBatchedScan } from './bulk/scan';
import { runExecutePhase } from './bulk/executePhase';
import { downloadPreviewAsFile } from './bulk/export';
import {
  renderHeader,
  renderButtonBar,
  renderWarning,
  renderSummary,
  renderPaginatedDiffTable,
  renderDownloadPreviewButton,
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
      text: strings.modals.populate.configureTitle,
    });

    const subtitle = contentEl.createEl('p');
    subtitle.appendText(strings.modals.populate.configureSubtitleLine1);
    subtitle.createEl('br');
    subtitle.appendText(strings.modals.populate.configureSubtitleLine2);

    // Mode dropdown
    new Setting(contentEl)
      .setName(strings.modals.populate.modeName)
      .setDesc(strings.modals.populate.modeDesc)
      .addDropdown((dd) => {
        dd.selectEl.addClass('frontmatter-date-manager-populate-mode');
        dd.addOption('both', strings.modals.populate.modeOptionBoth)
          .addOption('created', strings.modals.populate.modeOptionCreated)
          .addOption('updated', strings.modals.populate.modeOptionUpdated)
          .setValue(this.populateMode)
          .onChange((val) => {
            this.populateMode = val as PopulateMode;
            this.updateWarnings(warningContainer, overwriteWarning);
          });
      });

    // Override mode dropdown
    new Setting(contentEl)
      .setName(strings.modals.populate.overrideName)
      .setDesc(strings.modals.populate.overrideDesc)
      .addDropdown((dd) => {
        dd.selectEl.addClass('frontmatter-date-manager-populate-override');
        dd.addOption(
          'fill-missing',
          strings.modals.populate.overrideOptionFillMissing,
        )
          .addOption(
            'overwrite-all',
            strings.modals.populate.overrideOptionOverwriteAll,
          )
          .setValue(this.overrideMode)
          .onChange((val) => {
            this.overrideMode = val as OverrideMode;
            this.updateWarnings(warningContainer, overwriteWarning);
          });
      });

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
      text: strings.modals.populate.autoUpdateNoteTitle,
    });
    autoUpdateNote.createEl('br');
    autoUpdateNote.appendText(strings.modals.populate.autoUpdateNoteBody);

    renderButtonBar(contentEl, {
      primary: {
        label: strings.common.scanAndPreview,
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
        ? strings.modals.populate.warningTitleCreatedUnreliable
        : strings.modals.populate.warningTitlePlatformNote,
    );
    warningContainer.createEl('br');

    const platforms = [
      {
        name: strings.modals.populate.platformMacWin,
        reliable: true,
        note: strings.modals.populate.platformMacWinNote,
        isCurrent: Platform.isMacOS || Platform.isWin,
      },
      {
        name: strings.modals.populate.platformLinux,
        reliable: false,
        note: strings.modals.populate.platformLinuxNote,
        isCurrent:
          Platform.isLinux && !Platform.isAndroidApp && !Platform.isMobileApp,
      },
      {
        name: strings.modals.populate.platformAndroid,
        reliable: false,
        note: strings.modals.populate.platformAndroidNote,
        isCurrent: Platform.isAndroidApp,
      },
      {
        name: strings.modals.populate.platformIos,
        reliable: true,
        note: strings.modals.populate.platformIosNote,
        isCurrent: Platform.isIosApp,
      },
    ];

    const list = warningContainer.createEl('ul');
    for (const p of platforms) {
      const li = list.createEl('li');
      if (p.isCurrent) {
        li.addClass('frontmatter-date-manager-current-platform');
      }
      const prefix = p.reliable
        ? strings.modals.populate.platformReliable
        : strings.modals.populate.platformUnreliable;
      li.appendText(
        format(strings.modals.populate.platformLineName, {
          name: p.name,
          prefix,
        }),
      );
      li.createEl('br');
      li.appendText(
        `${p.note}${p.isCurrent ? strings.modals.populate.platformYourPlatformSuffix : ''}`,
      );
    }

    const syncNote = warningContainer.createEl('p');
    syncNote.appendText(strings.modals.populate.syncNoteLine1);
    syncNote.createEl('br');
    syncNote.appendText(strings.modals.populate.syncNoteLine2);
    syncNote.createEl('br');
    syncNote.appendText(strings.modals.populate.syncNoteLine3);

    if (includesCreated) {
      const recommendation = warningContainer.createEl('p');
      recommendation.createEl('strong', {
        text: strings.modals.populate.recommendation,
      });
    }

    // Overwrite warning
    overwriteWarning.empty();
    if (this.overrideMode === 'overwrite-all') {
      overwriteWarning.setText(strings.modals.populate.overwriteWarning);
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

    // Null out proposed values that match existing - no real change
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
        format(strings.modals.populate.noPropertyConfigured, {
          missing: missing.join(', '),
        }),
      );
      return;
    }

    renderHeader(contentEl, strings.common.scanningFiles);
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

    renderHeader(contentEl, strings.modals.populate.previewTitle);

    if (willChange.length === 0) {
      contentEl.createEl('p', {
        text: strings.modals.populate.noFilesNeedUpdating,
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

    const columns = [strings.common.file];
    if (includeCreated && createdKey)
      columns.push(format(strings.common.createdKeyed, { key: createdKey }));
    if (includeUpdated && updatedKey)
      columns.push(format(strings.common.updatedKeyed, { key: updatedKey }));

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
      renderWarning(contentEl, strings.modals.populate.previewOverwriteWarning);
    }

    renderDownloadPreviewButton(contentEl, () => {
      downloadPreviewAsFile(this.plugin, columns, rows);
    });

    renderButtonBar(contentEl, {
      primary: {
        label: strings.common.run,
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
    if (proposed === null) return '-';
    if (existing != null) {
      return `${String(existing)} → ${String(proposed)}`;
    }
    return String(proposed);
  }

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();
    renderHeader(contentEl, strings.modals.populate.settingDates);

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
      new Notice(strings.modals.populate.stopped, 2000);
      return;
    }

    contentEl.empty();
    if (errors > 0) {
      renderHeader(
        contentEl,
        format(strings.common.doneWithErrors, { errors }),
        format(strings.modals.populate.doneWithErrorsSubtitle, { processed }),
      );
      renderFailureTable(contentEl, this.plugin, failures);
    } else {
      renderHeader(
        contentEl,
        format(strings.modals.populate.doneTitle, { processed }),
      );
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

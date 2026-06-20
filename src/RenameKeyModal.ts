import { App, Notice, Setting, TFile } from 'obsidian';
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

export interface RenameKeyPreviewEntry {
  file: TFile;
  oldKeyName: string;
  existingValue: string | number;
  newKeyAlreadyExists: boolean;
  existingNewKeyValue: string | number | null;
}

export class RenameKeyModal extends PhaseModal {
  private plugin: FrontmatterDateManagerPlugin;
  private oldKeyName = '';
  private newKeyName = '';
  private deleteOldKey = true;
  private previewEntries: RenameKeyPreviewEntry[] = [];

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

    renderHeader(
      contentEl,
      strings.modals.rename.configureTitle,
      strings.modals.rename.configureSubtitle,
    );

    const validationEl = contentEl.createDiv({
      cls: 'frontmatter-date-manager-rename-key-validation',
    });

    // barRef allows updateValidation (defined before bar) to call bar methods
    // once bar is assigned below.  The outer binding stays const.
    const barRef: { current: ReturnType<typeof renderButtonBar> | null } = {
      current: null,
    };

    const updateValidation = () => {
      const oldTrimmed = this.oldKeyName.trim();
      const newTrimmed = this.newKeyName.trim();

      if (!oldTrimmed) {
        validationEl.setText(strings.modals.rename.validationEnterOld);
        barRef.current?.setPrimaryDisabled(true);
        return;
      }
      if (!newTrimmed) {
        validationEl.setText(strings.modals.rename.validationEnterNew);
        barRef.current?.setPrimaryDisabled(true);
        return;
      }
      if (oldTrimmed === newTrimmed) {
        validationEl.setText(strings.modals.rename.validationMustDiffer);
        barRef.current?.setPrimaryDisabled(true);
        return;
      }

      validationEl.setText('');
      barRef.current?.setPrimaryDisabled(false);
    };

    new Setting(contentEl)
      .setName(strings.modals.rename.oldKeyName)
      .setDesc(strings.modals.rename.oldKeyDesc)
      .addText((text) => {
        text.inputEl.addClass('frontmatter-date-manager-rename-old');
        text
          .setPlaceholder(strings.modals.rename.oldKeyPlaceholder)
          .setValue(this.oldKeyName)
          .onChange((val) => {
            this.oldKeyName = val;
            updateValidation();
          });
      });

    new Setting(contentEl)
      .setName(strings.modals.rename.newKeyName)
      .setDesc(strings.modals.rename.newKeyDesc)
      .addText((text) => {
        text.inputEl.addClass('frontmatter-date-manager-rename-new');
        text
          .setPlaceholder(strings.modals.rename.newKeyPlaceholder)
          .setValue(this.newKeyName)
          .onChange((val) => {
            this.newKeyName = val;
            updateValidation();
          });
      });

    new Setting(contentEl)
      .setName(strings.modals.rename.deleteOldName)
      .setDesc(strings.modals.rename.deleteOldDesc)
      .addToggle((toggle) => {
        toggle.toggleEl.addClass('frontmatter-date-manager-rename-delete');
        toggle.setValue(this.deleteOldKey).onChange((val) => {
          this.deleteOldKey = val;
        });
      });

    barRef.current = renderButtonBar(contentEl, {
      primary: {
        label: strings.common.scanAndPreview,
        destructive: false,
        disabled: true,
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

    updateValidation();
  }

  // --- Computation ---

  computePreviewEntry(file: TFile): RenameKeyPreviewEntry | null {
    const oldKey = this.oldKeyName.trim();
    const newKey = this.newKeyName.trim();
    const cached: Record<string, unknown> | undefined =
      this.app.metadataCache.getFileCache(file)?.frontmatter;

    if (cached?.[oldKey] == null) {
      return null;
    }

    const existingValue = cached[oldKey] as string | number;
    const newKeyAlreadyExists = cached[newKey] != null;
    const existingNewKeyValue = newKeyAlreadyExists
      ? (cached[newKey] as string | number)
      : null;

    return {
      file,
      oldKeyName: oldKey,
      existingValue,
      newKeyAlreadyExists,
      existingNewKeyValue,
    };
  }

  // --- Phase 2: Preview ---

  private async renderPreviewPhase() {
    const { contentEl } = this;
    const oldKey = this.oldKeyName.trim();
    const newKey = this.newKeyName.trim();
    if (!oldKey || !newKey) {
      new Notice(strings.modals.rename.namesCannotBeEmpty);
      return;
    }

    renderHeader(contentEl, strings.common.scanningFiles);
    const allFiles = this.app.vault.getMarkdownFiles();
    const progress = renderProgress(contentEl, allFiles.length);

    const computed = await runBatchedScan({
      files: allFiles,
      isOpen: () => this.isOpenState(),
      onProgress: (done) => {
        progress.update(done);
      },
      compute: (file) => this.computePreviewEntry(file),
    });
    if (!this.isOpenState()) return;

    this.previewEntries = computed.filter(
      (e): e is RenameKeyPreviewEntry => e !== null,
    );
    const skippedCount = computed.length - this.previewEntries.length;

    contentEl.empty();
    renderHeader(contentEl, strings.modals.rename.previewTitle);

    if (this.previewEntries.length === 0) {
      contentEl.createEl('p', {
        text: format(strings.modals.rename.noNotesUseProperty, { oldKey }),
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
      changed: this.previewEntries.length,
      skipped: skippedCount,
    });

    const conflicts = this.previewEntries.filter((e) => e.newKeyAlreadyExists);
    if (conflicts.length > 0) {
      renderWarning(
        contentEl,
        format(strings.modals.rename.conflictWarning, {
          conflicts: conflicts.length,
          newKey,
        }),
      );
    }

    const columns = [
      strings.common.file,
      oldKey,
      format(strings.modals.rename.columnArrowNew, { newKey }),
    ];
    const rows = this.previewEntries.map((e) => [
      e.file.path,
      String(e.existingValue),
      String(e.existingValue),
    ]);

    renderPaginatedDiffTable(contentEl, {
      columns,
      rows,
      rowClass: (i) =>
        this.previewEntries[i]?.newKeyAlreadyExists
          ? 'frontmatter-date-manager-bulk-conflict-row'
          : undefined,
    });

    const isDestructive = this.deleteOldKey || conflicts.length > 0;
    if (this.deleteOldKey) {
      renderWarning(contentEl, strings.modals.rename.deleteWarning);
    }

    renderDownloadPreviewButton(contentEl, () => {
      downloadPreviewAsFile(this.plugin, columns, rows);
    });

    renderButtonBar(contentEl, {
      primary: {
        label: strings.common.run,
        destructive: isDestructive,
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

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();
    renderHeader(contentEl, strings.modals.rename.renamingProperty);

    const progress = renderProgress(contentEl, this.previewEntries.length);

    const { processed, errors, failures } = await runExecutePhase({
      plugin: this.plugin,
      items: this.previewEntries,
      isOpen: () => this.isOpenState(),
      processItem: async (entry) => {
        const currentFile = this.app.vault.getAbstractFileByPath(
          entry.file.path,
        );
        if (!currentFile || !(currentFile instanceof TFile)) return;
        await this.applyRename(currentFile);
      },
      onProgress: (done) => {
        progress.update(done);
      },
      labelFor: (entry) => entry.file.path,
    });
    if (!this.isOpenState()) {
      new Notice(strings.modals.rename.renameStopped, 2000);
      return;
    }

    contentEl.empty();
    if (errors > 0) {
      renderHeader(
        contentEl,
        format(strings.common.doneWithErrors, { errors }),
        format(strings.modals.rename.doneWithErrorsSubtitle, { processed }),
      );
      renderFailureTable(contentEl, this.plugin, failures);
    } else {
      renderHeader(
        contentEl,
        format(strings.modals.rename.doneTitle, { processed }),
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

  protected async applyRename(currentFile: TFile): Promise<void> {
    const oldKey = this.oldKeyName.trim();
    const newKey = this.newKeyName.trim();
    await applyFrontmatterWrite(
      this.app,
      this.plugin,
      currentFile,
      (frontmatter: Record<string, unknown>) => {
        if (frontmatter[oldKey] != null) {
          frontmatter[newKey] = frontmatter[oldKey];
          if (this.deleteOldKey) delete frontmatter[oldKey];
        }
      },
    );
  }
}

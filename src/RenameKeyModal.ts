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
  renderWarning,
  renderSummary,
  renderPaginatedDiffTable,
  renderCopyPreviewButton,
  renderProgress,
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
      'Rename frontmatter key',
      'Move values from one frontmatter key to another across all markdown files.',
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
        validationEl.setText('Enter the old key name to proceed.');
        barRef.current?.setPrimaryDisabled(true);
        return;
      }
      if (!newTrimmed) {
        validationEl.setText('Enter the new key name to proceed.');
        barRef.current?.setPrimaryDisabled(true);
        return;
      }
      if (oldTrimmed === newTrimmed) {
        validationEl.setText('Old and new key names must be different.');
        barRef.current?.setPrimaryDisabled(true);
        return;
      }

      validationEl.setText('');
      barRef.current?.setPrimaryDisabled(false);
    };

    new Setting(contentEl)
      .setName('Old key name')
      .setDesc('The frontmatter key currently present in your files.')
      .addText((text) =>
        text
          .setPlaceholder('Date_created')
          .setValue(this.oldKeyName)
          .onChange((val) => {
            this.oldKeyName = val;
            updateValidation();
          }),
      );

    new Setting(contentEl)
      .setName('New key name')
      .setDesc('The new frontmatter key to rename to.')
      .addText((text) =>
        text
          .setPlaceholder('Created')
          .setValue(this.newKeyName)
          .onChange((val) => {
            this.newKeyName = val;
            updateValidation();
          }),
      );

    new Setting(contentEl)
      .setName('Delete old key after renaming')
      .setDesc(
        'Remove the old key from frontmatter after copying its value to the new key.',
      )
      .addToggle((toggle) =>
        toggle.setValue(this.deleteOldKey).onChange((val) => {
          this.deleteOldKey = val;
        }),
      );

    barRef.current = renderButtonBar(contentEl, {
      primary: {
        label: 'Scan & preview',
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
      new Notice('Key names cannot be empty.');
      return;
    }

    renderHeader(contentEl, 'Scanning files…');
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
    renderHeader(contentEl, 'Preview: rename key');

    if (this.previewEntries.length === 0) {
      contentEl.createEl('p', {
        text: `No files found with the key "${oldKey}".`,
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
        `${conflicts.length} file(s) already have the key "${newKey}". The existing value will be overwritten.`,
      );
    }

    const columns = ['File', oldKey, `→ ${newKey}`];
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
      renderWarning(
        contentEl,
        'The old key will be deleted after copying. This cannot be undone. Make a backup first.',
      );
    }

    renderCopyPreviewButton(contentEl, () => {
      void copyPreviewToClipboard(this.plugin, columns, rows);
    });

    renderButtonBar(contentEl, {
      primary: {
        label: 'Run',
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
    renderHeader(contentEl, 'Renaming keys…');

    const progress = renderProgress(contentEl, this.previewEntries.length);

    const { processed, errors } = await runExecutePhase({
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
      new Notice('Rename stopped.', 2000);
      return;
    }

    contentEl.empty();
    renderHeader(
      contentEl,
      errors > 0
        ? `Done with ${errors} error(s). Check the console for details.`
        : `Done! ${processed} file(s) updated.`,
    );
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

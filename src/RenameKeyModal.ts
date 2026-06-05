import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';

export interface RenameKeyPreviewEntry {
  file: TFile;
  oldKeyName: string;
  existingValue: string | number;
  newKeyAlreadyExists: boolean;
  existingNewKeyValue: string | number | null;
}

const PREVIEW_MAX_ROWS = 100;
const SCAN_BATCH_SIZE = 50;

export class RenameKeyModal extends Modal {
  private plugin: FrontmatterDateManagerPlugin;
  private oldKeyName = '';
  private newKeyName = '';
  private deleteOldKey = true;
  private previewEntries: RenameKeyPreviewEntry[] = [];
  private isOpen = false;

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    this.isOpen = true;
    this.contentEl.addClass('frontmatter-date-manager-rename-key-modal');
    this.renderConfigurePhase();
  }

  onClose() {
    this.contentEl.empty();
    this.isOpen = false;
    this.previewEntries = [];
  }

  // --- Phase 1: Configure ---

  private renderConfigurePhase() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Rename frontmatter key' });

    const subtitle = contentEl.createEl('p');
    subtitle.appendText(
      'Move values from one frontmatter key to another across all markdown files.',
    );

    const validationEl = contentEl.createDiv({
      cls: 'frontmatter-date-manager-rename-key-validation',
    });

    let scanBtnEl: HTMLButtonElement | null = null;

    const updateValidation = () => {
      const oldTrimmed = this.oldKeyName.trim();
      const newTrimmed = this.newKeyName.trim();

      if (!oldTrimmed) {
        validationEl.setText('Enter the old key name to proceed.');
        if (scanBtnEl) scanBtnEl.disabled = true;
        return;
      }
      if (!newTrimmed) {
        validationEl.setText('Enter the new key name to proceed.');
        if (scanBtnEl) scanBtnEl.disabled = true;
        return;
      }
      if (oldTrimmed === newTrimmed) {
        validationEl.setText('Old and new key names must be different.');
        if (scanBtnEl) scanBtnEl.disabled = true;
        return;
      }

      validationEl.setText('');
      if (scanBtnEl) scanBtnEl.disabled = false;
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

    new Setting(contentEl)
      .addButton((btn) => {
        scanBtnEl = btn.buttonEl;
        btn
          .setButtonText('Scan & preview')
          .setCta()
          .setDisabled(true)
          .onClick(() => {
            void this.renderPreviewPhase();
          });
      })
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
        }),
      );

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

    contentEl.empty();

    const header = contentEl.createEl('h2', { text: 'Scanning files...' });

    const progressWrapper = contentEl.createDiv({
      cls: 'frontmatter-date-manager-progress-section',
    });
    const progressBar = progressWrapper.createEl('progress');
    const progressCounter = progressWrapper.createEl('span');

    const allFiles = this.app.vault.getMarkdownFiles();
    progressBar.setAttr('max', allFiles.length);

    this.previewEntries = [];
    const skippedFiles: TFile[] = [];

    for (let i = 0; i < allFiles.length; i++) {
      if (!this.isOpen) return;

      const entry = this.computePreviewEntry(allFiles[i]!);
      if (entry) {
        this.previewEntries.push(entry);
      } else {
        skippedFiles.push(allFiles[i]!);
      }

      if ((i + 1) % SCAN_BATCH_SIZE === 0 || i === allFiles.length - 1) {
        progressBar.setAttr('value', i + 1);
        progressCounter.setText(`${i + 1}/${allFiles.length}`);
        // Yield to event loop between batches (see BulkPopulateTimestampsModal).
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
    }

    contentEl.empty();

    header.setText('Preview: rename key');
    contentEl.append(header);

    if (this.previewEntries.length === 0) {
      contentEl.createEl('p', {
        text: `No files found with the key "${oldKey}".`,
        cls: 'frontmatter-date-manager-populate-summary',
      });

      new Setting(contentEl).addButton((btn) =>
        btn.setButtonText('Close').onClick(() => {
          this.close();
        }),
      );
      return;
    }

    // Summary
    contentEl.createEl('p', {
      text: `${this.previewEntries.length} file(s) will be modified, ${skippedFiles.length} skipped (key not found).`,
      cls: 'frontmatter-date-manager-populate-summary',
    });

    // Conflict warning
    const conflictEntries = this.previewEntries.filter(
      (e) => e.newKeyAlreadyExists,
    );
    if (conflictEntries.length > 0) {
      contentEl.createDiv({
        cls: 'frontmatter-date-manager-rename-key-conflict-warning',
        text: `${conflictEntries.length} file(s) already have the key "${newKey}". The existing value will be overwritten.`,
      });
    }

    // Preview table
    const previewList = contentEl.createDiv({
      cls: 'frontmatter-date-manager-populate-preview-list',
    });
    const table = previewList.createEl('table');

    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'File' });
    headerRow.createEl('th', { text: `${oldKey}` });
    headerRow.createEl('th', { text: `\u2192 ${newKey}` });

    const tbody = table.createEl('tbody');
    const displayCount = Math.min(this.previewEntries.length, PREVIEW_MAX_ROWS);

    for (let i = 0; i < displayCount; i++) {
      const entry = this.previewEntries[i]!;
      const row = tbody.createEl('tr');
      row.createEl('td', { text: entry.file.path });
      row.createEl('td', { text: String(entry.existingValue) });

      const newCell = row.createEl('td', {
        text: String(entry.existingValue),
      });
      if (entry.newKeyAlreadyExists) {
        newCell.addClass('frontmatter-date-manager-rename-key-conflict-row');
      }
    }

    if (this.previewEntries.length > PREVIEW_MAX_ROWS) {
      const moreRow = tbody.createEl('tr');
      const moreCell = moreRow.createEl('td');
      moreCell.setAttr('colspan', '3');
      moreCell.setText(
        `\u2026 and ${this.previewEntries.length - PREVIEW_MAX_ROWS} more file(s)`,
      );
      moreCell.addClass('frontmatter-date-manager-populate-summary');
    }

    // Skipped files
    if (skippedFiles.length > 0) {
      const details = contentEl.createEl('details');
      details.createEl('summary', {
        text: `${skippedFiles.length} file(s) skipped (key "${oldKey}" not found)`,
      });
      const skippedList = details.createEl('ul');
      const skippedDisplay = Math.min(skippedFiles.length, PREVIEW_MAX_ROWS);
      for (let i = 0; i < skippedDisplay; i++) {
        skippedList.createEl('li', { text: skippedFiles[i]!.path });
      }
      if (skippedFiles.length > PREVIEW_MAX_ROWS) {
        skippedList.createEl('li', {
          text: `\u2026 and ${skippedFiles.length - PREVIEW_MAX_ROWS} more`,
          cls: 'frontmatter-date-manager-populate-summary',
        });
      }
    }

    // Deleting the old key (default) or overwriting an existing new-key value
    // destroys data; a pure copy (delete off, no conflicts) is reversible.
    const isDestructive = this.deleteOldKey || conflictEntries.length > 0;
    if (this.deleteOldKey) {
      contentEl.createDiv({
        cls: 'frontmatter-date-manager-rename-key-conflict-warning',
        text: 'The old key will be deleted after copying. This cannot be undone. Make a backup first.',
      });
    }

    // Buttons
    new Setting(contentEl)
      .addButton((btn) => {
        btn.setButtonText('Run');
        if (isDestructive) {
          btn.setWarning();
        } else {
          btn.setCta();
        }
        btn.onClick(() => {
          void this.renderExecutePhase();
        });
      })
      .addButton((btn) =>
        btn.setButtonText('Back').onClick(() => {
          this.renderConfigurePhase();
        }),
      )
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
        }),
      );
  }

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;

    contentEl.empty();

    const header = contentEl.createEl('h2', { text: 'Renaming keys...' });

    const wrapperBar = contentEl.createDiv({
      cls: 'frontmatter-date-manager-progress-section',
    });
    const progress = wrapperBar.createEl('progress');
    progress.setAttr('max', this.previewEntries.length);
    const fileCounter = wrapperBar.createEl('span');

    const updateCount = (count: number) => {
      progress.setAttr('value', count);
      fileCounter.setText(`${count}/${this.previewEntries.length}`);
    };
    updateCount(0);

    let errorCount = 0;
    let processedCount = 0;
    this.plugin.bulkRunning = true;

    try {
      for (let i = 0; i < this.previewEntries.length; i++) {
        if (!this.isOpen) {
          new Notice('Rename stopped.', 2000);
          return;
        }
        updateCount(i + 1);

        const entry = this.previewEntries[i]!;
        try {
          const currentFile = this.app.vault.getAbstractFileByPath(
            entry.file.path,
          );
          if (!currentFile || !(currentFile instanceof TFile)) {
            continue;
          }

          await this.applyRename(currentFile);
          processedCount++;
        } catch (e: unknown) {
          errorCount++;
          this.plugin.logError('Error renaming key for', entry.file.path, e);
        }
      }
    } finally {
      this.plugin.bulkRunning = false;
    }

    let doneText = `Done! ${processedCount} file(s) updated.`;
    if (errorCount > 0) {
      doneText = `Done with ${errorCount} error(s). Check the console for details.`;
    }

    header.setText(doneText);
    wrapperBar.remove();

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText('Close').onClick(() => {
        this.close();
      }),
    );
  }

  protected async applyRename(currentFile: TFile): Promise<void> {
    const oldKey = this.oldKeyName.trim();
    const newKey = this.newKeyName.trim();

    await this.app.fileManager.processFrontMatter(
      currentFile,
      (frontmatter: Record<string, unknown>) => {
        if (frontmatter[oldKey] != null) {
          frontmatter[newKey] = frontmatter[oldKey];
          if (this.deleteOldKey) {
            delete frontmatter[oldKey];
          }
        }
      },
    );
    // Do not preserve mtime: Obsidian must detect the change so an open editor
    // re-renders. Suppress the resulting self-triggered modify event via
    // lastPluginWriteMtime and refresh the hash cache so the stale cache cannot
    // make handleFileChange spuriously re-stamp `updated`.
    this.plugin.lastPluginWriteMtime.set(
      currentFile.path,
      currentFile.stat.mtime,
    );
    if (this.plugin.settings.enableContentHashCheck ?? true) {
      await this.plugin.populateCacheForFile(currentFile);
    }
  }
}

import { App, Modal, Notice, Platform, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';

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

const PREVIEW_MAX_ROWS = 100;
const SCAN_BATCH_SIZE = 50;

export class BulkPopulateTimestampsModal extends Modal {
  private plugin: FrontmatterDateManagerPlugin;
  private populateMode: PopulateMode = 'both';
  private overrideMode: OverrideMode = 'fill-missing';
  private previewEntries: FilePreviewEntry[] = [];
  private isOpen = false;

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    this.isOpen = true;
    this.contentEl.addClass('frontmatter-date-manager-bulk-populate-modal');
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

    contentEl.createEl('h2', {
      text: 'Populate timestamps from filesystem',
    });

    const subtitle = contentEl.createEl('p');
    subtitle.appendText('Set created and/or updated dates in frontmatter');
    subtitle.createEl('br');
    subtitle.appendText('using file system timestamps (ctime/mtime).');

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
        'may already reflect the plugin\u2019s modifications, not the original file dates. ' +
        'For best results, use this feature before enabling auto-update ' +
        'or right after installing the plugin.',
    );

    // Buttons
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Scan & preview')
          .setCta()
          .onClick(() => {
            void this.renderPreviewPhase();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => this.close()),
      );
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
    const createdKey = this.plugin.settings.headerCreated?.trim();
    const updatedKey = this.plugin.settings.headerUpdated?.trim();
    const cached: Record<string, unknown> | undefined =
      this.app.metadataCache?.getFileCache(file)?.frontmatter;

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
    const createdKey = this.plugin.settings.headerCreated?.trim();
    const updatedKey = this.plugin.settings.headerUpdated?.trim();

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

    contentEl.empty();

    const header = contentEl.createEl('h2', {
      text: 'Scanning files...',
    });

    const progressWrapper = contentEl.createDiv({
      cls: 'frontmatter-date-manager-progress-section',
    });
    const progressBar = progressWrapper.createEl('progress');
    const progressCounter = progressWrapper.createEl('span');

    // Get eligible files
    const allFiles = await this.plugin.getAllFilesPossiblyAffected({
      skipHashCheck: true,
    });
    progressBar.setAttr('max', allFiles.length);

    // Compute preview entries in batches
    this.previewEntries = [];
    for (let i = 0; i < allFiles.length; i++) {
      if (!this.isOpen) return;

      this.previewEntries.push(this.computePreviewEntry(allFiles[i]));

      if ((i + 1) % SCAN_BATCH_SIZE === 0 || i === allFiles.length - 1) {
        progressBar.setAttr('value', i + 1);
        progressCounter.setText(`${i + 1}/${allFiles.length}`);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Render results
    contentEl.empty();

    const willChangeEntries = this.previewEntries.filter((e) => e.willChange);
    const skippedEntries = this.previewEntries.filter((e) => !e.willChange);

    header.setText('Preview: populate timestamps');
    contentEl.append(header);

    if (willChangeEntries.length === 0) {
      contentEl.createEl('p', {
        text: 'No files need updating. All eligible files already have the requested timestamps.',
        cls: 'frontmatter-date-manager-populate-summary',
      });

      new Setting(contentEl).addButton((btn) =>
        btn.setButtonText('Close').onClick(() => this.close()),
      );
      return;
    }

    // Summary
    contentEl.createEl('p', {
      text: `${willChangeEntries.length} file(s) will be modified, ${skippedEntries.length} skipped (already have dates).`,
      cls: 'frontmatter-date-manager-populate-summary',
    });

    // Scrollable preview table
    const previewList = contentEl.createDiv({
      cls: 'frontmatter-date-manager-populate-preview-list',
    });
    const table = previewList.createEl('table');

    // Header
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'File' });
    if (includeCreated && createdKey) {
      headerRow.createEl('th', { text: `Created (${createdKey})` });
    }
    if (includeUpdated && updatedKey) {
      headerRow.createEl('th', { text: `Updated (${updatedKey})` });
    }

    // Body — files to change
    const tbody = table.createEl('tbody');
    const displayCount = Math.min(willChangeEntries.length, PREVIEW_MAX_ROWS);

    for (let i = 0; i < displayCount; i++) {
      const entry = willChangeEntries[i];
      const row = tbody.createEl('tr');
      row.createEl('td', { text: entry.file.path });
      if (includeCreated && createdKey) {
        row.createEl('td', {
          text: this.formatPreviewValue(
            entry.proposedCreated,
            entry.existingCreated,
          ),
        });
      }
      if (includeUpdated && updatedKey) {
        row.createEl('td', {
          text: this.formatPreviewValue(
            entry.proposedUpdated,
            entry.existingUpdated,
          ),
        });
      }
    }

    if (willChangeEntries.length > PREVIEW_MAX_ROWS) {
      const moreRow = tbody.createEl('tr');
      const moreCell = moreRow.createEl('td');
      moreCell.setAttr(
        'colspan',
        String(
          1 +
            (includeCreated && createdKey ? 1 : 0) +
            (includeUpdated && updatedKey ? 1 : 0),
        ),
      );
      moreCell.setText(
        `\u2026 and ${willChangeEntries.length - PREVIEW_MAX_ROWS} more file(s)`,
      );
      moreCell.addClass('frontmatter-date-manager-populate-summary');
    }

    // Skipped files in collapsible details
    if (skippedEntries.length > 0) {
      const details = contentEl.createEl('details');
      details.createEl('summary', {
        text: `${skippedEntries.length} file(s) skipped (already have dates)`,
      });
      const skippedList = details.createEl('ul');
      const skippedDisplay = Math.min(skippedEntries.length, PREVIEW_MAX_ROWS);
      for (let i = 0; i < skippedDisplay; i++) {
        skippedList.createEl('li', { text: skippedEntries[i].file.path });
      }
      if (skippedEntries.length > PREVIEW_MAX_ROWS) {
        skippedList.createEl('li', {
          text: `\u2026 and ${skippedEntries.length - PREVIEW_MAX_ROWS} more`,
          cls: 'frontmatter-date-manager-populate-summary',
        });
      }
    }

    // Buttons
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Run')
          .setCta()
          .onClick(() => {
            void this.renderExecutePhase();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText('Back').onClick(() => this.renderConfigurePhase()),
      )
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => this.close()),
      );
  }

  private formatPreviewValue(
    proposed: string | number | null,
    existing: string | number | null,
  ): string {
    if (proposed === null) return '\u2014';
    if (existing != null) {
      return `${String(existing)} \u2192 ${String(proposed)}`;
    }
    return String(proposed);
  }

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();

    const header = contentEl.createEl('h2', {
      text: 'Populating timestamps...',
    });

    const entriesToProcess = this.previewEntries.filter((e) => e.willChange);

    const wrapperBar = contentEl.createDiv({
      cls: 'frontmatter-date-manager-progress-section',
    });
    const progress = wrapperBar.createEl('progress');
    progress.setAttr('max', entriesToProcess.length);

    const fileCounter = wrapperBar.createEl('span');

    const updateCount = (count: number) => {
      progress.setAttr('value', count);
      fileCounter.setText(`${count}/${entriesToProcess.length}`);
    };
    updateCount(0);

    let errorCount = 0;
    this.plugin._bulkRunning = true;
    try {
      for (let i = 0; i < entriesToProcess.length; i++) {
        if (!this.isOpen) {
          new Notice('Bulk populate stopped.', 2000);
          return;
        }
        updateCount(i + 1);

        try {
          await this.applyTimestamps(entriesToProcess[i]);
        } catch (e: unknown) {
          errorCount++;
          this.plugin.logError(
            'Error populating timestamps for',
            entriesToProcess[i].file.path,
            e,
          );
        }
      }
    } finally {
      this.plugin._bulkRunning = false;
    }

    // Done
    let doneText = `Done! ${entriesToProcess.length} file(s) updated.`;
    if (errorCount > 0) {
      doneText = `Done with ${errorCount} error(s). Check the console for details.`;
    }

    header.setText(doneText);
    wrapperBar.remove();

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText('Close').onClick(() => this.close()),
    );
  }

  private async applyTimestamps(entry: FilePreviewEntry): Promise<void> {
    const createdKey = this.plugin.settings.headerCreated?.trim();
    const updatedKey = this.plugin.settings.headerUpdated?.trim();

    // Verify file still exists
    const currentFile = this.app.vault.getAbstractFileByPath(entry.file.path);
    if (!currentFile || !(currentFile instanceof TFile)) {
      return;
    }

    await this.app.fileManager.processFrontMatter(
      currentFile,
      (frontmatter: Record<string, unknown>) => {
        if (entry.proposedCreated !== null && createdKey) {
          frontmatter[createdKey] = entry.proposedCreated;
        }
        if (entry.proposedUpdated !== null && updatedKey) {
          frontmatter[updatedKey] = entry.proposedUpdated;
        }
      },
      { ctime: currentFile.stat.ctime, mtime: currentFile.stat.mtime },
    );
  }
}

import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import { format, parse, parseISO } from 'date-fns';
import { tz } from '@date-fns/tz';
import FrontmatterDateManagerPlugin from './main';

export type ReformatScope = 'created' | 'updated' | 'viewed' | 'both' | 'all';

export interface ReformatPreviewEntry {
  file: TFile;
  createdOldValue: string | number | null;
  createdNewValue: string | number | null;
  createdError: boolean;
  updatedOldValue: string | number | null;
  updatedNewValue: string | number | null;
  updatedError: boolean;
  viewedOldValue: string | number | null;
  viewedNewValue: string | number | null;
  viewedError: boolean;
  willChange: boolean;
}

const PREVIEW_MAX_ROWS = 100;
const SCAN_BATCH_SIZE = 50;

/**
 * Common date formats to try when auto-detecting.
 * Order matters — more specific formats first to avoid ambiguous matches.
 * ISO 8601 is handled separately via parseISO before these are tried.
 */
const COMMON_DATE_FORMATS = [
  "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  "yyyy-MM-dd'T'HH:mm:ssxxx",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd'T'HH:mm",
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd HH:mm',
  'yyyy-MM-dd',
  'yyyy/MM/dd HH:mm:ss',
  'yyyy/MM/dd HH:mm',
  'yyyy/MM/dd',
  'dd.MM.yyyy HH:mm:ss',
  'dd.MM.yyyy HH:mm',
  'dd.MM.yyyy',
  'dd/MM/yyyy HH:mm:ss',
  'dd/MM/yyyy HH:mm',
  'dd/MM/yyyy',
  'MM/dd/yyyy HH:mm:ss',
  'MM/dd/yyyy HH:mm',
  'MM/dd/yyyy',
  'yyyyMMdd',
];

export class ReformatDateModal extends Modal {
  private plugin: FrontmatterDateManagerPlugin;
  private reformatScope: ReformatScope = 'all';
  private previewEntries: ReformatPreviewEntry[] = [];
  private isOpen = false;

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    this.isOpen = true;
    this.contentEl.addClass('frontmatter-date-manager-reformat-date-modal');
    this.renderConfigurePhase();
  }

  onClose() {
    this.contentEl.empty();
    this.isOpen = false;
    this.previewEntries = [];
  }

  // --- Helpers ---

  /**
   * Auto-detect and parse a date value. Tries multiple strategies:
   * 1. Numeric values → epoch timestamp
   * 2. parseISO for ISO 8601 strings
   * 3. Common date-fns format strings
   * 4. Native Date() as last resort
   */
  tryParseDate(value: string | number): Date | undefined {
    if (typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }

    const str = String(value).trim();
    if (!str) return undefined;

    // Numeric string → epoch timestamp (but not 8-digit yyyyMMdd-style strings)
    if (/^\d+$/.test(str) && str.length !== 8) {
      const date = new Date(parseInt(str));
      return isNaN(date.getTime()) ? undefined : date;
    }

    // Try parseISO (handles ISO 8601 variants with timezone offsets)
    try {
      const iso = parseISO(str);
      if (!isNaN(iso.getTime())) return iso;
    } catch {
      // continue to next strategy
    }

    // Try common date-fns formats
    const tzOptions = this.plugin.settings.timezone
      ? { in: tz(this.plugin.settings.timezone) }
      : {};

    for (const fmt of COMMON_DATE_FORMATS) {
      try {
        const parsed = parse(str, fmt, new Date(), tzOptions);
        if (!isNaN(parsed.getTime())) return parsed;
      } catch {
        // continue to next format
      }
    }

    // Last resort: native Date parser
    try {
      const native = new Date(str);
      if (!isNaN(native.getTime())) return native;
    } catch {
      // give up
    }

    return undefined;
  }

  private formatWithNewFormat(date: Date): string | number | undefined {
    return this.plugin.formatDate(date);
  }

  private tryFormatPreview(dateFormat: string): string {
    try {
      const options = this.plugin.settings.timezone
        ? { in: tz(this.plugin.settings.timezone) }
        : {};
      return format(new Date(), dateFormat, options);
    } catch {
      return 'Invalid format';
    }
  }

  // --- Phase 1: Configure ---

  private renderConfigurePhase() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Standardize date format' });

    const subtitle = contentEl.createEl('p');
    subtitle.appendText(
      'Parse existing date values and rewrite them using the current format from settings.',
    );

    // Current format display
    const currentFormat = this.plugin.settings.dateFormat;
    const formatPreview = this.tryFormatPreview(currentFormat);

    new Setting(contentEl)
      .setName('Target format')
      .setDesc(`${currentFormat}`)
      .addText((text) =>
        text
          .setPlaceholder(currentFormat)
          .setValue(formatPreview)
          .setDisabled(true),
      );

    new Setting(contentEl)
      .setName('Which fields to reformat')
      .setDesc('Choose which timestamp fields to standardize.')
      .addDropdown((dd) => {
        dd.addOption('all', 'All timestamp fields');
        dd.addOption('created', 'Created only');
        dd.addOption('updated', 'Updated only');
        if (this.plugin.settings.enableLastViewed ?? false) {
          dd.addOption('viewed', 'Viewed only');
        }
        dd.setValue(this.reformatScope);
        dd.onChange((val) => {
          this.reformatScope = val as ReformatScope;
        });
      });

    contentEl.createDiv({
      cls: 'frontmatter-date-manager-reformat-note',
      text: 'Dates are auto-detected from common formats (ISO 8601, European, US, numeric timestamps) and rewritten in your current format.',
    });

    // Buttons
    new Setting(contentEl)
      .addButton((btn) => {
        btn
          .setButtonText('Scan & preview')
          .setCta()
          .onClick(() => {
            void this.renderPreviewPhase();
          });
      })
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
        }),
      );
  }

  // --- Computation ---

  computePreviewEntry(file: TFile): ReformatPreviewEntry {
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    const viewedKey = (
      this.plugin.settings.headerLastViewed ?? 'viewed'
    ).trim();
    const cached: Record<string, unknown> | undefined =
      this.app.metadataCache.getFileCache(file)?.frontmatter;

    const scopeAll =
      this.reformatScope === 'all' || this.reformatScope === 'both';
    const includeCreated = this.reformatScope === 'created' || scopeAll;
    const includeUpdated = this.reformatScope === 'updated' || scopeAll;
    const includeViewed = this.reformatScope === 'viewed' || scopeAll;

    let createdOldValue: string | number | null = null;
    let createdNewValue: string | number | null = null;
    let createdError = false;

    let updatedOldValue: string | number | null = null;
    let updatedNewValue: string | number | null = null;
    let updatedError = false;

    let viewedOldValue: string | number | null = null;
    let viewedNewValue: string | number | null = null;
    let viewedError = false;

    if (includeCreated && createdKey && cached?.[createdKey] != null) {
      createdOldValue = cached[createdKey] as string | number;
      const parsed = this.tryParseDate(createdOldValue);
      if (parsed) {
        const formatted = this.formatWithNewFormat(parsed);
        if (formatted !== undefined) {
          if (String(createdOldValue) !== String(formatted)) {
            createdNewValue = formatted;
          }
        }
      } else {
        createdError = true;
      }
    }

    if (includeUpdated && updatedKey && cached?.[updatedKey] != null) {
      updatedOldValue = cached[updatedKey] as string | number;
      const parsed = this.tryParseDate(updatedOldValue);
      if (parsed) {
        const formatted = this.formatWithNewFormat(parsed);
        if (formatted !== undefined) {
          if (String(updatedOldValue) !== String(formatted)) {
            updatedNewValue = formatted;
          }
        }
      } else {
        updatedError = true;
      }
    }

    if (
      includeViewed &&
      viewedKey &&
      (this.plugin.settings.enableLastViewed ?? false) &&
      cached?.[viewedKey] != null
    ) {
      viewedOldValue = cached[viewedKey] as string | number;
      const parsed = this.tryParseDate(viewedOldValue);
      if (parsed) {
        const formatted = this.formatWithNewFormat(parsed);
        if (formatted !== undefined) {
          if (String(viewedOldValue) !== String(formatted)) {
            viewedNewValue = formatted;
          }
        }
      } else {
        viewedError = true;
      }
    }

    return {
      file,
      createdOldValue,
      createdNewValue,
      createdError,
      updatedOldValue,
      updatedNewValue,
      updatedError,
      viewedOldValue,
      viewedNewValue,
      viewedError,
      willChange:
        createdNewValue !== null ||
        updatedNewValue !== null ||
        viewedNewValue !== null,
    };
  }

  // --- Phase 2: Preview ---

  private async renderPreviewPhase() {
    const { contentEl } = this;
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    const viewedKey = (
      this.plugin.settings.headerLastViewed ?? 'viewed'
    ).trim();

    const scopeAll =
      this.reformatScope === 'all' || this.reformatScope === 'both';
    const includeCreated = this.reformatScope === 'created' || scopeAll;
    const includeUpdated = this.reformatScope === 'updated' || scopeAll;
    const includeViewed = this.reformatScope === 'viewed' || scopeAll;

    const missing = [];
    if (includeCreated && !createdKey) missing.push('created');
    if (includeUpdated && !updatedKey) missing.push('updated');
    if (includeViewed && !viewedKey) missing.push('viewed');
    if (missing.length > 0) {
      new Notice(
        `No frontmatter key configured for: ${missing.join(', ')}. Check plugin settings.`,
      );
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

    for (let i = 0; i < allFiles.length; i++) {
      if (!this.isOpen) return;

      this.previewEntries.push(this.computePreviewEntry(allFiles[i]!));

      if ((i + 1) % SCAN_BATCH_SIZE === 0 || i === allFiles.length - 1) {
        progressBar.setAttr('value', i + 1);
        progressCounter.setText(`${i + 1}/${allFiles.length}`);
        // Yield to event loop between batches (see BulkPopulateTimestampsModal).
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    contentEl.empty();

    const willChangeEntries = this.previewEntries.filter((e) => e.willChange);
    const errorEntries = this.previewEntries.filter(
      (e) => e.createdError || e.updatedError || e.viewedError,
    );
    const skippedEntries = this.previewEntries.filter(
      (e) =>
        !e.willChange && !e.createdError && !e.updatedError && !e.viewedError,
    );

    header.setText('Preview: standardize dates');
    contentEl.append(header);

    if (willChangeEntries.length === 0) {
      contentEl.createEl('p', {
        text: 'No files need reformatting. All dates are already in the target format or could not be parsed.',
        cls: 'frontmatter-date-manager-populate-summary',
      });

      if (errorEntries.length > 0) {
        contentEl.createDiv({
          cls: 'frontmatter-date-manager-reformat-error',
          text: `${errorEntries.length} file(s) have dates that could not be parsed.`,
        });
      }

      new Setting(contentEl).addButton((btn) =>
        btn.setButtonText('Close').onClick(() => {
          this.close();
        }),
      );
      return;
    }

    // Summary
    contentEl.createEl('p', {
      text: `${willChangeEntries.length} file(s) will be modified, ${skippedEntries.length} skipped.`,
      cls: 'frontmatter-date-manager-populate-summary',
    });

    // Error warning
    if (errorEntries.length > 0) {
      contentEl.createDiv({
        cls: 'frontmatter-date-manager-reformat-error',
        text: `${errorEntries.length} file(s) have dates that could not be parsed. These will be skipped.`,
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
    if (includeCreated && createdKey) {
      headerRow.createEl('th', { text: `Created (${createdKey})` });
    }
    if (includeUpdated && updatedKey) {
      headerRow.createEl('th', { text: `Updated (${updatedKey})` });
    }
    if (includeViewed && viewedKey) {
      headerRow.createEl('th', { text: `Viewed (${viewedKey})` });
    }

    const tbody = table.createEl('tbody');
    const displayCount = Math.min(willChangeEntries.length, PREVIEW_MAX_ROWS);

    for (let i = 0; i < displayCount; i++) {
      const entry = willChangeEntries[i]!;
      const row = tbody.createEl('tr');
      row.createEl('td', { text: entry.file.path });

      if (includeCreated && createdKey) {
        row.createEl('td', {
          text: this.formatPreviewCell(
            entry.createdOldValue,
            entry.createdNewValue,
            entry.createdError,
          ),
        });
      }
      if (includeUpdated && updatedKey) {
        row.createEl('td', {
          text: this.formatPreviewCell(
            entry.updatedOldValue,
            entry.updatedNewValue,
            entry.updatedError,
          ),
        });
      }
      if (includeViewed && viewedKey) {
        row.createEl('td', {
          text: this.formatPreviewCell(
            entry.viewedOldValue,
            entry.viewedNewValue,
            entry.viewedError,
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
            (includeUpdated && updatedKey ? 1 : 0) +
            (includeViewed && viewedKey ? 1 : 0),
        ),
      );
      moreCell.setText(
        `\u2026 and ${willChangeEntries.length - PREVIEW_MAX_ROWS} more file(s)`,
      );
      moreCell.addClass('frontmatter-date-manager-populate-summary');
    }

    // Skipped files
    if (skippedEntries.length > 0) {
      const details = contentEl.createEl('details');
      details.createEl('summary', {
        text: `${skippedEntries.length} file(s) skipped (already in target format or no date value)`,
      });
      const skippedList = details.createEl('ul');
      const skippedDisplay = Math.min(skippedEntries.length, PREVIEW_MAX_ROWS);
      for (let i = 0; i < skippedDisplay; i++) {
        skippedList.createEl('li', { text: skippedEntries[i]!.file.path });
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

  private formatPreviewCell(
    oldValue: string | number | null,
    newValue: string | number | null,
    isError: boolean,
  ): string {
    if (isError && oldValue !== null) {
      return `${String(oldValue)} (parse error)`;
    }
    if (newValue === null) return '\u2014';
    if (oldValue !== null) {
      return `${String(oldValue)} \u2192 ${String(newValue)}`;
    }
    return String(newValue);
  }

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    const viewedKey = (
      this.plugin.settings.headerLastViewed ?? 'viewed'
    ).trim();

    contentEl.empty();

    const header = contentEl.createEl('h2', {
      text: 'Reformatting dates...',
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
    let processedCount = 0;
    this.plugin.bulkRunning = true;

    try {
      for (let i = 0; i < entriesToProcess.length; i++) {
        if (!this.isOpen) {
          new Notice('Reformat stopped.', 2000);
          return;
        }
        updateCount(i + 1);

        const entry = entriesToProcess[i]!;
        try {
          const currentFile = this.app.vault.getAbstractFileByPath(
            entry.file.path,
          );
          if (!currentFile || !(currentFile instanceof TFile)) {
            continue;
          }

          await this.app.fileManager.processFrontMatter(
            currentFile,
            (frontmatter: Record<string, unknown>) => {
              if (entry.createdNewValue !== null && createdKey) {
                frontmatter[createdKey] = entry.createdNewValue;
              }
              if (entry.updatedNewValue !== null && updatedKey) {
                frontmatter[updatedKey] = entry.updatedNewValue;
              }
              if (entry.viewedNewValue !== null && viewedKey) {
                frontmatter[viewedKey] = entry.viewedNewValue;
              }
            },
            {
              ctime: currentFile.stat.ctime,
              mtime: currentFile.stat.mtime,
            },
          );
          processedCount++;
        } catch (e: unknown) {
          errorCount++;
          this.plugin.logError(
            'Error reformatting dates for',
            entry.file.path,
            e,
          );
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
}

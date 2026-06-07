import { App, Notice, Setting, TFile } from 'obsidian';
import { format, parse, parseISO } from 'date-fns';
import { tz } from '@date-fns/tz';
import FrontmatterDateManagerPlugin from './main';
import { epochNumberToDate } from './utils';
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

export class ReformatDateModal extends PhaseModal {
  private plugin: FrontmatterDateManagerPlugin;
  private reformatScope: ReformatScope = 'all';
  private previewEntries: ReformatPreviewEntry[] = [];

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
      const date = epochNumberToDate(value);
      return isNaN(date.getTime()) ? undefined : date;
    }

    const str = String(value).trim();
    if (!str) return undefined;

    // Numeric string → epoch timestamp (but not 8-digit yyyyMMdd-style strings)
    if (/^\d+$/.test(str) && str.length !== 8) {
      const date = epochNumberToDate(parseInt(str));
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

    renderHeader(
      contentEl,
      'Standardize date format',
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
        dd.selectEl.addClass('frontmatter-date-manager-reformat-scope');
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

    renderButtonBar(contentEl, {
      primary: {
        label: 'Scan & preview',
        destructive: false,
        onClick: () => {
          void this.goTo(() => {
            void this.renderPreviewPhase();
          });
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

    renderHeader(contentEl, 'Scanning files…');
    const allFiles = this.app.vault.getMarkdownFiles();
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
    const errorEntries = this.previewEntries.filter(
      (e) => e.createdError || e.updatedError || e.viewedError,
    );
    const skipped = this.previewEntries.filter(
      (e) =>
        !e.willChange && !e.createdError && !e.updatedError && !e.viewedError,
    );

    renderHeader(contentEl, 'Preview: standardize dates');

    if (willChange.length === 0) {
      contentEl.createEl('p', {
        text: 'No files need reformatting. All dates are already in the target format or could not be parsed.',
        cls: 'frontmatter-date-manager-bulk-summary',
      });
      if (errorEntries.length > 0) {
        renderWarning(
          contentEl,
          `${errorEntries.length} file(s) have dates that could not be parsed.`,
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
      return;
    }

    renderSummary(contentEl, {
      changed: willChange.length,
      skipped: skipped.length,
      errors: errorEntries.length,
    });
    if (errorEntries.length > 0) {
      renderWarning(
        contentEl,
        `${errorEntries.length} file(s) have dates that could not be parsed. These will be skipped.`,
      );
    }

    const columns = ['File'];
    if (includeCreated && createdKey) columns.push(`Created (${createdKey})`);
    if (includeUpdated && updatedKey) columns.push(`Updated (${updatedKey})`);
    if (includeViewed && viewedKey) columns.push(`Viewed (${viewedKey})`);

    const rows = willChange.map((entry) => {
      const row = [entry.file.path];
      if (includeCreated && createdKey) {
        row.push(
          this.formatPreviewCell(
            entry.createdOldValue,
            entry.createdNewValue,
            entry.createdError,
          ),
        );
      }
      if (includeUpdated && updatedKey) {
        row.push(
          this.formatPreviewCell(
            entry.updatedOldValue,
            entry.updatedNewValue,
            entry.updatedError,
          ),
        );
      }
      if (includeViewed && viewedKey) {
        row.push(
          this.formatPreviewCell(
            entry.viewedOldValue,
            entry.viewedNewValue,
            entry.viewedError,
          ),
        );
      }
      return row;
    });

    renderPaginatedDiffTable(contentEl, { columns, rows });

    renderWarning(
      contentEl,
      'This rewrites existing date values in place. It cannot be undone. Make a backup first.',
    );

    renderCopyPreviewButton(contentEl, () => {
      void copyPreviewToClipboard(this.plugin, columns, rows);
    });

    renderButtonBar(contentEl, {
      primary: {
        label: 'Run',
        destructive: true,
        onClick: () => void this.renderExecutePhase(),
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

  private formatPreviewCell(
    oldValue: string | number | null,
    newValue: string | number | null,
    isError: boolean,
  ): string {
    if (isError && oldValue !== null) {
      return `${String(oldValue)} (parse error)`;
    }
    if (newValue === null) return '—';
    if (oldValue !== null) {
      return `${String(oldValue)} → ${String(newValue)}`;
    }
    return String(newValue);
  }

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();
    renderHeader(contentEl, 'Reformatting dates…');

    const items = this.previewEntries.filter((e) => e.willChange);
    const progress = renderProgress(contentEl, items.length);

    const { processed, errors, failures } = await runExecutePhase({
      plugin: this.plugin,
      items,
      isOpen: () => this.isOpenState(),
      processItem: async (entry) => {
        const currentFile = this.app.vault.getAbstractFileByPath(
          entry.file.path,
        );
        if (!currentFile || !(currentFile instanceof TFile)) return;
        await this.applyReformat(currentFile, entry);
      },
      onProgress: (done) => {
        progress.update(done);
      },
      labelFor: (entry) => entry.file.path,
    });
    if (!this.isOpenState()) {
      new Notice('Reformat stopped.', 2000);
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

  protected async applyReformat(
    currentFile: TFile,
    entry: ReformatPreviewEntry,
  ): Promise<void> {
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    const viewedKey = (
      this.plugin.settings.headerLastViewed ?? 'viewed'
    ).trim();
    await applyFrontmatterWrite(
      this.app,
      this.plugin,
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
    );
  }
}

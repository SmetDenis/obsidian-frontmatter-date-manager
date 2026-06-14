import { App, Notice, Setting, TFile } from 'obsidian';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import FrontmatterDateManagerPlugin from './main';
import {
  parseDateValueWithZone,
  detectSlashDateReadings,
  detectSlashOrderFromLocale,
} from './utils';
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

export type ReformatScope = 'created' | 'updated' | 'viewed' | 'both' | 'all';

/**
 * How to read a date that could be day-first or month-first (e.g. `01/05/2024`).
 * `skip` leaves such values untouched (the safe default); `dmy`/`mdy` resolve
 * them explicitly. Only the genuinely ambiguous values are affected - a value
 * with one valid reading (e.g. `25/12`) always converts regardless.
 */
export type SlashDateOrder = 'skip' | 'dmy' | 'mdy';

export interface ReformatPreviewEntry {
  file: TFile;
  createdOldValue: string | number | null;
  createdNewValue: string | number | null;
  createdError: boolean;
  createdAmbiguous: boolean;
  updatedOldValue: string | number | null;
  updatedNewValue: string | number | null;
  updatedError: boolean;
  updatedAmbiguous: boolean;
  viewedOldValue: string | number | null;
  viewedNewValue: string | number | null;
  viewedError: boolean;
  viewedAmbiguous: boolean;
  willChange: boolean;
}

export class ReformatDateModal extends PhaseModal {
  private plugin: FrontmatterDateManagerPlugin;
  private reformatScope: ReformatScope = 'all';
  private previewEntries: ReformatPreviewEntry[] = [];
  /** Files scanned this run, retained so an order change re-renders without a re-scan. */
  private scannedFiles: TFile[] = [];
  /** How ambiguous day/month dates are read this run. Default: leave unchanged. */
  private slashOrder: SlashDateOrder = 'skip';
  /** Order detected from the OS locale, used only to pre-offer a one-click option. */
  private detectedOrder: 'dmy' | 'mdy' | undefined = detectSlashOrderFromLocale(
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().locale
      : undefined,
  );

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
   * Auto-detect and parse a stored date value, anchored to the configured
   * timezone. Delegates to the pure `parseDateValueWithZone` helper so every
   * parse strategy shares ONE timezone reference frame - the inverse of
   * `formatDate`, which always formats in that zone. Centralizing the logic is
   * what stops a parse branch from drifting to the host zone and shifting naive
   * wall-clock values on reformat (see the helper's doc comment for the full
   * rationale).
   */
  tryParseDate(value: string | number): Date | undefined {
    return parseDateValueWithZone(value, this.plugin.settings.timezone);
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
      .setDesc('Choose which dates to standardize.')
      .addDropdown((dd) => {
        dd.selectEl.addClass('frontmatter-date-manager-reformat-scope');
        dd.addOption('all', 'All dates');
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
      text: 'Dates are auto-detected from common formats (ISO 8601, European, US, numeric dates) and rewritten in your current format.',
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
    let createdAmbiguous = false;

    let updatedOldValue: string | number | null = null;
    let updatedNewValue: string | number | null = null;
    let updatedError = false;
    let updatedAmbiguous = false;

    let viewedOldValue: string | number | null = null;
    let viewedNewValue: string | number | null = null;
    let viewedError = false;
    let viewedAmbiguous = false;

    if (includeCreated && createdKey && cached?.[createdKey] != null) {
      createdOldValue = cached[createdKey] as string | number;
      const r = this.resolveField(createdOldValue);
      createdNewValue = r.newValue;
      createdError = r.error;
      createdAmbiguous = r.ambiguous;
    }

    if (includeUpdated && updatedKey && cached?.[updatedKey] != null) {
      updatedOldValue = cached[updatedKey] as string | number;
      const r = this.resolveField(updatedOldValue);
      updatedNewValue = r.newValue;
      updatedError = r.error;
      updatedAmbiguous = r.ambiguous;
    }

    if (
      includeViewed &&
      viewedKey &&
      (this.plugin.settings.enableLastViewed ?? false) &&
      cached?.[viewedKey] != null
    ) {
      viewedOldValue = cached[viewedKey] as string | number;
      const r = this.resolveField(viewedOldValue);
      viewedNewValue = r.newValue;
      viewedError = r.error;
      viewedAmbiguous = r.ambiguous;
    }

    return {
      file,
      createdOldValue,
      createdNewValue,
      createdError,
      createdAmbiguous,
      updatedOldValue,
      updatedNewValue,
      updatedError,
      updatedAmbiguous,
      viewedOldValue,
      viewedNewValue,
      viewedError,
      viewedAmbiguous,
      willChange:
        createdNewValue !== null ||
        updatedNewValue !== null ||
        viewedNewValue !== null,
    };
  }

  /**
   * Convert one stored date value under the current `slashOrder`. Genuinely
   * ambiguous slash/dot dates are resolved per the chosen order, or left
   * unchanged (and flagged) under `skip` - never silently guessed. A value with
   * only one valid reading (or any non-ambiguous value) goes through the normal
   * `parseDateValueWithZone` path. An ambiguous value left unchanged is NOT an
   * error: it is a deliberate skip the preview surfaces separately.
   */
  private resolveField(oldValue: string | number): {
    newValue: string | number | null;
    error: boolean;
    ambiguous: boolean;
  } {
    const readings = detectSlashDateReadings(
      oldValue,
      this.plugin.settings.timezone,
    );

    let parsed: Date | undefined;
    if (readings.ambiguous) {
      if (this.slashOrder === 'dmy') parsed = readings.dmyDate;
      else if (this.slashOrder === 'mdy') parsed = readings.mdyDate;
      // 'skip': leave unchanged (parsed stays undefined, not an error).
    } else {
      parsed = this.tryParseDate(oldValue);
    }

    if (parsed) {
      const formatted = this.formatWithNewFormat(parsed);
      if (formatted !== undefined && String(oldValue) !== String(formatted)) {
        return {
          newValue: formatted,
          error: false,
          ambiguous: readings.ambiguous,
        };
      }
      return { newValue: null, error: false, ambiguous: readings.ambiguous };
    }

    // Not parsed: an error only when it was not a deliberate ambiguous skip.
    return {
      newValue: null,
      error: !readings.ambiguous,
      ambiguous: readings.ambiguous,
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
        `No property name configured for: ${missing.join(', ')}. Check plugin settings.`,
      );
      return;
    }

    renderHeader(contentEl, 'Scanning files…');
    const allFiles = this.app.vault.getMarkdownFiles();
    const progress = renderProgress(contentEl, allFiles.length);

    this.scannedFiles = allFiles;
    this.previewEntries = await runBatchedScan({
      files: allFiles,
      isOpen: () => this.isOpenState(),
      onProgress: (done) => {
        progress.update(done);
      },
      compute: (file) => this.computePreviewEntry(file),
    });
    if (!this.isOpenState()) return;

    this.renderPreviewResult();
  }

  /**
   * Render the preview from the current `previewEntries`. Split out from the scan
   * so changing the day/month order re-renders instantly (recompute is in-memory,
   * no re-scan). Re-derives the changed/error/ambiguous sets every call.
   */
  private renderPreviewResult() {
    const { contentEl } = this;
    contentEl.empty();

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

    const willChange = this.previewEntries.filter((e) => e.willChange);
    const errorEntries = this.previewEntries.filter(
      (e) => e.createdError || e.updatedError || e.viewedError,
    );
    const skipped = this.previewEntries.filter(
      (e) =>
        !e.willChange && !e.createdError && !e.updatedError && !e.viewedError,
    );
    const ambiguousCount = this.previewEntries.filter(
      (e) => e.createdAmbiguous || e.updatedAmbiguous || e.viewedAmbiguous,
    ).length;

    renderHeader(contentEl, 'Preview: standardize dates');

    if (ambiguousCount > 0)
      this.renderAmbiguityControl(contentEl, ambiguousCount);

    if (willChange.length === 0) {
      const noChangeText =
        ambiguousCount > 0 && this.slashOrder === 'skip'
          ? `Nothing to convert yet. ${ambiguousCount} date(s) could be read two ways and are left unchanged - choose a day/month order above to convert them.`
          : 'No files need reformatting. All dates are already in the target format or could not be parsed.';
      contentEl.createEl('p', {
        text: noChangeText,
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
            entry.createdAmbiguous,
          ),
        );
      }
      if (includeUpdated && updatedKey) {
        row.push(
          this.formatPreviewCell(
            entry.updatedOldValue,
            entry.updatedNewValue,
            entry.updatedError,
            entry.updatedAmbiguous,
          ),
        );
      }
      if (includeViewed && viewedKey) {
        row.push(
          this.formatPreviewCell(
            entry.viewedOldValue,
            entry.viewedNewValue,
            entry.viewedError,
            entry.viewedAmbiguous,
          ),
        );
      }
      return row;
    });

    renderPaginatedDiffTable(contentEl, { columns, rows });

    if (this.slashOrder !== 'skip' && ambiguousCount > 0) {
      contentEl.createDiv({
        cls: 'frontmatter-date-manager-reformat-note',
        text: 'Rows marked [check] could be read two ways - confirm the new date looks right.',
      });
    }

    renderWarning(
      contentEl,
      'This rewrites existing date values in place. It cannot be undone. Make a backup first.',
    );

    renderDownloadPreviewButton(contentEl, () => {
      downloadPreviewAsFile(this.plugin, columns, rows);
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

  /**
   * Inline control for ambiguous day/month dates. Defaults to leaving them
   * unchanged; the OS-detected order is offered as a one-click choice but never
   * applied silently. Changing it recomputes in-memory and re-renders.
   */
  private renderAmbiguityControl(
    contentEl: HTMLElement,
    ambiguousCount: number,
  ) {
    const detectedHint =
      this.detectedOrder === 'mdy'
        ? ' Your system suggests month first.'
        : this.detectedOrder === 'dmy'
          ? ' Your system suggests day first.'
          : '';
    new Setting(contentEl)
      .setName('Dates that could be read two ways')
      .setDesc(
        `${ambiguousCount} date(s) could mean day-first or month-first (e.g. 01/05/2024).${detectedHint}`,
      )
      .addDropdown((dd) => {
        dd.selectEl.addClass('frontmatter-date-manager-slash-order');
        dd.addOption('skip', 'Leave unclear dates unchanged');
        dd.addOption('dmy', 'Day first (01/05 = day 1, month 5)');
        dd.addOption('mdy', 'Month first (01/05 = month 1, day 5)');
        dd.setValue(this.slashOrder);
        dd.onChange((val) => {
          this.slashOrder = val as SlashDateOrder;
          this.recomputeAndRerender();
        });
      });
  }

  /**
   * Recompute entries under the current order (in-memory) and re-render.
   * Synchronous and only fired from a live dropdown change, so the modal is
   * guaranteed open - no `isOpenState()` guard needed (add one if this ever
   * becomes async).
   */
  private recomputeAndRerender() {
    this.previewEntries = this.scannedFiles.map((file) =>
      this.computePreviewEntry(file),
    );
    this.renderPreviewResult();
  }

  private formatPreviewCell(
    oldValue: string | number | null,
    newValue: string | number | null,
    isError: boolean,
    isAmbiguous = false,
  ): string {
    if (isError && oldValue !== null) {
      return `${String(oldValue)} (could not read date)`;
    }
    if (newValue === null) return '-';
    // Mark a converted ambiguous value so the user double-checks the reading.
    const check = isAmbiguous ? ' [check]' : '';
    if (oldValue !== null) {
      return `${String(oldValue)} → ${String(newValue)}${check}`;
    }
    return `${String(newValue)}${check}`;
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

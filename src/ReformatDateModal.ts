import { App, Notice, Setting, TFile } from 'obsidian';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import FrontmatterDateManagerPlugin from './main';
import {
  parseDateValueWithZone,
  detectSlashDateReadings,
  detectSlashOrderFromLocale,
} from './utils';
import { strings, format as t } from './i18n';
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
      return strings.modals.reformat.invalidFormat;
    }
  }

  // --- Phase 1: Configure ---

  private renderConfigurePhase() {
    const { contentEl } = this;

    renderHeader(
      contentEl,
      strings.modals.reformat.configureTitle,
      strings.modals.reformat.configureSubtitle,
    );

    // Current format display
    const currentFormat = this.plugin.settings.dateFormat;
    const formatPreview = this.tryFormatPreview(currentFormat);

    new Setting(contentEl)
      .setName(strings.modals.reformat.targetFormatName)
      .setDesc(t(strings.modals.reformat.targetFormatDesc, { currentFormat }))
      .addText((text) =>
        text
          .setPlaceholder(currentFormat)
          .setValue(formatPreview)
          .setDisabled(true),
      );

    new Setting(contentEl)
      .setName(strings.modals.reformat.scopeName)
      .setDesc(strings.modals.reformat.scopeDesc)
      .addDropdown((dd) => {
        dd.selectEl.addClass('frontmatter-date-manager-reformat-scope');
        dd.addOption('all', strings.modals.reformat.scopeOptionAll);
        dd.addOption('created', strings.modals.reformat.scopeOptionCreated);
        dd.addOption('updated', strings.modals.reformat.scopeOptionUpdated);
        if (this.plugin.settings.enableLastViewed ?? false) {
          dd.addOption('viewed', strings.modals.reformat.scopeOptionViewed);
        }
        dd.setValue(this.reformatScope);
        dd.onChange((val) => {
          this.reformatScope = val as ReformatScope;
        });
      });

    contentEl.createDiv({
      cls: 'frontmatter-date-manager-reformat-note',
      text: strings.modals.reformat.autoDetectNote,
    });

    renderButtonBar(contentEl, {
      primary: {
        label: strings.common.scanAndPreview,
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
        t(strings.modals.reformat.noPropertyConfigured, {
          missing: missing.join(', '),
        }),
      );
      return;
    }

    renderHeader(contentEl, strings.common.scanningFiles);
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

    renderHeader(contentEl, strings.modals.reformat.previewTitle);

    if (ambiguousCount > 0)
      this.renderAmbiguityControl(contentEl, ambiguousCount);

    if (willChange.length === 0) {
      const noChangeText =
        ambiguousCount > 0 && this.slashOrder === 'skip'
          ? t(strings.modals.reformat.noChangeAmbiguous, { ambiguousCount })
          : strings.modals.reformat.noChangeDefault;
      contentEl.createEl('p', {
        text: noChangeText,
        cls: 'frontmatter-date-manager-bulk-summary',
      });
      if (errorEntries.length > 0) {
        renderWarning(
          contentEl,
          t(strings.modals.reformat.errorWarningNoChange, {
            errorCount: errorEntries.length,
          }),
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
        t(strings.modals.reformat.errorWarningWillSkip, {
          errorCount: errorEntries.length,
        }),
      );
    }

    const columns = [strings.common.file];
    if (includeCreated && createdKey)
      columns.push(t(strings.common.createdKeyed, { key: createdKey }));
    if (includeUpdated && updatedKey)
      columns.push(t(strings.common.updatedKeyed, { key: updatedKey }));
    if (includeViewed && viewedKey)
      columns.push(t(strings.common.viewedKeyed, { key: viewedKey }));

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
        text: strings.modals.reformat.checkNote,
      });
    }

    renderWarning(contentEl, strings.modals.reformat.rewriteWarning);

    renderDownloadPreviewButton(contentEl, () => {
      downloadPreviewAsFile(this.plugin, columns, rows);
    });

    renderButtonBar(contentEl, {
      primary: {
        label: strings.common.run,
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
        ? strings.modals.reformat.detectedHintMonthFirst
        : this.detectedOrder === 'dmy'
          ? strings.modals.reformat.detectedHintDayFirst
          : '';
    new Setting(contentEl)
      .setName(strings.modals.reformat.ambiguityName)
      .setDesc(
        t(strings.modals.reformat.ambiguityDesc, {
          ambiguousCount,
          detectedHint,
        }),
      )
      .addDropdown((dd) => {
        dd.selectEl.addClass('frontmatter-date-manager-slash-order');
        dd.addOption('skip', strings.modals.reformat.ambiguityOptionSkip);
        dd.addOption('dmy', strings.modals.reformat.ambiguityOptionDmy);
        dd.addOption('mdy', strings.modals.reformat.ambiguityOptionMdy);
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
      return t(strings.modals.reformat.cellCouldNotRead, {
        oldValue: String(oldValue),
      });
    }
    if (newValue === null) return '-';
    // Mark a converted ambiguous value so the user double-checks the reading.
    const check = isAmbiguous ? strings.modals.reformat.cellCheckSuffix : '';
    if (oldValue !== null) {
      return t(strings.modals.reformat.cellConversion, {
        oldValue: String(oldValue),
        newValue: String(newValue),
        check,
      });
    }
    return t(strings.modals.reformat.cellNewValue, {
      newValue: String(newValue),
      check,
    });
  }

  // --- Phase 3: Execute ---

  private async renderExecutePhase() {
    const { contentEl } = this;
    contentEl.empty();
    renderHeader(contentEl, strings.modals.reformat.reformattingDates);

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
      new Notice(strings.modals.reformat.reformatStopped, 2000);
      return;
    }

    contentEl.empty();
    if (errors > 0) {
      renderHeader(
        contentEl,
        t(strings.common.doneWithErrors, { errors }),
        t(strings.modals.reformat.doneWithErrorsSubtitle, { processed }),
      );
      renderFailureTable(contentEl, this.plugin, failures);
    } else {
      renderHeader(
        contentEl,
        t(strings.modals.reformat.doneTitle, { processed }),
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

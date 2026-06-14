import { ButtonComponent, Platform, Setting } from 'obsidian';
import { clampPage, getPageCount, getPageSlice } from './pagination';
import type { ExecuteFailure } from './executePhase';
import { downloadPreviewAsFile } from './export';
import type FrontmatterDateManagerPlugin from '../main';

export const PREVIEW_MAX_ROWS = 100;

export function renderHeader(
  parent: HTMLElement,
  title: string,
  subtitle?: string,
): void {
  parent.createEl('h2', { text: title });
  if (subtitle) {
    parent.createEl('p', { text: subtitle });
  }
}

export interface ButtonBarSpec {
  primary?: {
    label: string;
    destructive: boolean;
    disabled?: boolean;
    onClick: () => void;
  };
  back?: () => void;
  footer: { kind: 'cancel' | 'close'; onClick: () => void };
}

export interface ButtonBarHandle {
  setPrimaryDisabled(disabled: boolean): void;
  setPrimaryDestructive(destructive: boolean): void;
}

/**
 * Render the consistent button bar: primary (Run, red iff destructive) →
 * optional Back → footer (Cancel before execution / Close after). Returns a
 * handle so callers can toggle the primary button from interactive handlers
 * (e.g. FindInversions enabling Run once a strategy is chosen).
 */
export function renderButtonBar(
  parent: HTMLElement,
  spec: ButtonBarSpec,
): ButtonBarHandle {
  let primaryBtn: ButtonComponent | null = null;
  const setting = new Setting(parent);

  if (spec.primary) {
    const p = spec.primary;
    setting.addButton((btn) => {
      primaryBtn = btn;
      btn.buttonEl.addClass('frontmatter-date-manager-bulk-primary');
      btn.setButtonText(p.label);
      if (p.destructive) btn.setWarning();
      else btn.setCta();
      btn.setDisabled(p.disabled ?? false);
      btn.onClick(() => void p.onClick());
    });
  }

  if (spec.back) {
    const back = spec.back;
    setting.addButton((btn) => {
      btn.buttonEl.addClass('frontmatter-date-manager-bulk-back');
      btn.setButtonText('Back').onClick(() => void back());
    });
  }

  const footerLabel = spec.footer.kind === 'cancel' ? 'Cancel' : 'Close';
  setting.addButton((btn) => {
    btn.buttonEl.addClass('frontmatter-date-manager-bulk-footer');
    btn.setButtonText(footerLabel).onClick(() => void spec.footer.onClick());
  });

  return {
    setPrimaryDisabled(disabled: boolean) {
      primaryBtn?.setDisabled(disabled);
    },
    setPrimaryDestructive(destructive: boolean) {
      if (!primaryBtn) return;
      if (destructive) primaryBtn.setWarning();
      else primaryBtn.setCta();
    },
  };
}

export function renderWarning(parent: HTMLElement, text: string): void {
  parent.createDiv({ cls: 'frontmatter-date-manager-bulk-warning', text });
}

export function renderSummary(
  parent: HTMLElement,
  counts: { changed: number; skipped: number; errors?: number },
): void {
  const parts = [
    `${counts.changed} file(s) will change`,
    `${counts.skipped} skipped`,
  ];
  if (counts.errors && counts.errors > 0) {
    parts.push(`${counts.errors} error(s)`);
  }
  parent.createEl('p', {
    text: parts.join(' · '),
    cls: 'frontmatter-date-manager-bulk-summary',
  });
}

export interface PaginatedDiffTableOptions {
  columns: string[];
  /** The FULL set of changed rows - never pre-sliced. Pagination shows them all. */
  rows: string[][];
  /** Rows per page. Defaults to PREVIEW_MAX_ROWS. */
  pageSize?: number;
  /** Extra class for a row, keyed by its GLOBAL index (so highlights survive paging). */
  rowClass?: (globalRowIndex: number) => string | undefined;
  /** Per-column cell class, aligned to `columns` (e.g. the inversion delta accent). */
  columnClasses?: Array<string | undefined>;
}

/**
 * Render the diff preview as a paginated table so the user can inspect EVERY
 * changed row (the project's "exact diff" safety contract) without rendering
 * thousands of rows at once. Only one page (<= pageSize) lives in the DOM; the
 * Prev/Next pager re-renders only the tbody + pager info, leaving the header
 * and surrounding phase DOM untouched. The pager is hidden when there is a
 * single page. Returns the page count for callers that want it.
 *
 * Not unit-tested (the obsidian mock no-ops DOM); the page math it relies on
 * lives in ./pagination and is tested there.
 */
export function renderPaginatedDiffTable(
  parent: HTMLElement,
  opts: PaginatedDiffTableOptions,
): { pageCount: number } {
  const pageSize = opts.pageSize ?? PREVIEW_MAX_ROWS;
  const pageCount = getPageCount(opts.rows.length, pageSize);
  let page = 0;

  const list = parent.createDiv({
    cls: 'frontmatter-date-manager-bulk-preview-list',
  });
  const table = list.createEl('table', {
    cls: 'frontmatter-date-manager-bulk-table',
  });
  const thead = table.createEl('thead');
  const headerRow = thead.createEl('tr');
  for (const col of opts.columns) headerRow.createEl('th', { text: col });
  const tbody = table.createEl('tbody');

  const renderTbody = () => {
    tbody.empty();
    const slice = getPageSlice(opts.rows, page, pageSize);
    for (let i = 0; i < slice.length; i++) {
      const tr = tbody.createEl('tr');
      const extraCls = opts.rowClass?.(page * pageSize + i);
      if (extraCls) tr.addClass(extraCls);
      const cells = slice[i]!;
      for (let c = 0; c < cells.length; c++) {
        const td = tr.createEl('td', { text: cells[c]! });
        const cellCls = opts.columnClasses?.[c];
        if (cellCls) td.addClass(cellCls);
      }
    }
  };

  renderTbody();

  if (pageCount > 1) {
    const pager = parent.createDiv({
      cls: 'frontmatter-date-manager-bulk-pagination',
    });
    const prevBtn = new ButtonComponent(pager).setButtonText('Prev');
    prevBtn.buttonEl.addClass('frontmatter-date-manager-bulk-pager-prev');
    const info = pager.createSpan({
      cls: 'frontmatter-date-manager-bulk-pagination-info',
    });
    const nextBtn = new ButtonComponent(pager).setButtonText('Next');
    nextBtn.buttonEl.addClass('frontmatter-date-manager-bulk-pager-next');

    const syncPager = () => {
      info.setText(`Page ${page + 1} of ${pageCount}`);
      prevBtn.setDisabled(page === 0);
      nextBtn.setDisabled(page === pageCount - 1);
    };

    prevBtn.onClick(() => {
      page = clampPage(page - 1, pageCount);
      renderTbody();
      syncPager();
    });
    nextBtn.onClick(() => {
      page = clampPage(page + 1, pageCount);
      renderTbody();
      syncPager();
    });

    syncPager();
  }

  return { pageCount };
}

/**
 * Render a neutral "Download full preview" button that exports the COMPLETE
 * diff (every changed row, not just the visible page) via the provided callback.
 * Placed between the table and the action bar.
 *
 * Desktop only: the file download relies on the HTML `download` attribute, which
 * is unreliable in Obsidian's mobile (Capacitor) webview. Rather than offer a
 * button that would silently no-op there, we hide it entirely on mobile - the
 * full diff stays readable in the on-screen paginated table. We do not add a
 * per-platform fallback that would re-introduce a removed capability disclosure.
 */
export function renderDownloadPreviewButton(
  parent: HTMLElement,
  onClick: () => void,
): void {
  if (Platform.isMobileApp) return;
  const wrapper = parent.createDiv({
    cls: 'frontmatter-date-manager-bulk-download',
  });
  new ButtonComponent(wrapper)
    .setButtonText('Download full preview')
    .onClick(() => {
      onClick();
    });
}

/**
 * Render the list of items that failed during execution as a paginated
 * `File | Error` table plus a "Download full preview" button. This is the
 * user-facing channel for execute-phase failures: `logError` is a no-op in
 * production, so the console shows nothing - the failing paths and reasons must
 * be presented here.
 */
export function renderFailureTable(
  parent: HTMLElement,
  plugin: FrontmatterDateManagerPlugin,
  failures: ExecuteFailure[],
): void {
  const columns = ['File', 'Error'];
  const rows = failures.map((f) => [f.label, f.message]);
  renderPaginatedDiffTable(parent, { columns, rows });
  renderDownloadPreviewButton(parent, () => {
    downloadPreviewAsFile(
      plugin,
      columns,
      rows,
      'frontmatter-date-manager-failures',
    );
  });
}

export interface ProgressHandle {
  update(count: number): void;
  remove(): void;
}

export function renderProgress(
  parent: HTMLElement,
  max: number,
): ProgressHandle {
  const wrapper = parent.createDiv({
    cls: 'frontmatter-date-manager-bulk-progress-section',
  });
  const bar = wrapper.createEl('progress');
  bar.setAttr('max', max);
  const counter = wrapper.createEl('span');
  return {
    update(count: number) {
      bar.setAttr('value', count);
      counter.setText(`${count}/${max}`);
    },
    remove() {
      wrapper.remove();
    },
  };
}

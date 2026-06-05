import { ButtonComponent, Setting } from 'obsidian';

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
      btn.setButtonText(p.label);
      if (p.destructive) btn.setWarning();
      else btn.setCta();
      btn.setDisabled(p.disabled ?? false);
      btn.onClick(() => void p.onClick());
    });
  }

  if (spec.back) {
    const back = spec.back;
    setting.addButton((btn) =>
      btn.setButtonText('Back').onClick(() => void back()),
    );
  }

  const footerLabel = spec.footer.kind === 'cancel' ? 'Cancel' : 'Close';
  setting.addButton((btn) =>
    btn.setButtonText(footerLabel).onClick(() => void spec.footer.onClick()),
  );

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

export interface DiffTableOptions {
  columns: string[];
  rows: string[][];
  maxRows: number;
  moreCount?: number;
  rowClass?: (rowIndex: number) => string | undefined;
}

export function renderDiffTable(
  parent: HTMLElement,
  opts: DiffTableOptions,
): void {
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
  const shown = Math.min(opts.rows.length, opts.maxRows);
  for (let i = 0; i < shown; i++) {
    const tr = tbody.createEl('tr');
    const extraCls = opts.rowClass?.(i);
    if (extraCls) tr.addClass(extraCls);
    for (const cell of opts.rows[i]!) tr.createEl('td', { text: cell });
  }

  const more = opts.moreCount ?? Math.max(0, opts.rows.length - opts.maxRows);
  if (more > 0) {
    const moreRow = tbody.createEl('tr');
    const moreCell = moreRow.createEl('td');
    moreCell.setAttr('colspan', String(opts.columns.length));
    moreCell.setText(`… and ${more} more file(s)`);
    moreCell.addClass('frontmatter-date-manager-bulk-summary');
  }
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

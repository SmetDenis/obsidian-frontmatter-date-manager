import { Notice } from 'obsidian';
import FrontmatterDateManagerPlugin from '../main';
import { strings, format } from '../i18n';

/**
 * Serialize a preview diff (the SAME columns + full rows shown in the on-screen
 * paginated table) to TSV. Pure and unit-tested. Tabs and newlines inside a
 * cell are flattened to spaces so the row/column structure stays intact.
 */
export function toTSV(columns: string[], rows: string[][]): string {
  const escapeCell = (cell: string): string =>
    cell.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
  const lines = [columns.map(escapeCell).join('\t')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join('\t'));
  }
  return lines.join('\n');
}

/**
 * Download the full preview diff as a TSV file. The complete diff is already
 * held in memory by each modal, so this exports EVERY changed row - the escape
 * hatch that lets the paginated preview honor the "exact diff" contract for
 * review in an external tool. The file is saved to the user's system downloads
 * via a transient object-URL anchor; NO vault file is written. Synchronous (the
 * browser handles the download).
 *
 * Desktop only: callers gate the button with `Platform.isMobileApp` (see
 * `renderDownloadPreviewButton`) because the HTML `download` attribute is
 * unreliable in Obsidian's mobile (Capacitor) webview. This function therefore
 * assumes a desktop context and does not re-check.
 */
export function downloadPreviewAsFile(
  plugin: FrontmatterDateManagerPlugin,
  columns: string[],
  rows: string[][],
  filenameBase = 'frontmatter-date-manager-preview',
): void {
  try {
    const blob = new Blob([toTSV(columns, rows)], {
      type: 'text/tab-separated-values',
    });
    const url = URL.createObjectURL(blob);
    const filename = `${filenameBase}.tsv`;
    // createEl (Obsidian helper) appends to body; satisfies prefer-active-doc
    // and is not a forbidden element (only style/link are).
    const anchor = activeDocument.body.createEl('a', {
      attr: { href: url, download: filename },
    });
    anchor.click();
    anchor.remove();
    // Revoke on the next tick so the download has started.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
    new Notice(
      format(strings.bulkChrome.downloadSuccess, {
        count: rows.length,
        filename,
      }),
      2500,
    );
  } catch (err: unknown) {
    plugin.logError('Failed to download preview', err);
    new Notice(strings.bulkChrome.downloadFailed, 4000);
  }
}

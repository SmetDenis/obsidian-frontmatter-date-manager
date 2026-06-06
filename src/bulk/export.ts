import { Notice } from 'obsidian';
import FrontmatterDateManagerPlugin from '../main';

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
 * Copy the full preview diff to the clipboard as TSV. The complete diff is
 * already held in memory by each modal, so this exports EVERY changed row — the
 * escape hatch that lets the paginated preview honor the "exact diff" contract
 * for review in an external tool. No vault file is written.
 */
export async function copyPreviewToClipboard(
  plugin: FrontmatterDateManagerPlugin,
  columns: string[],
  rows: string[][],
): Promise<void> {
  try {
    await navigator.clipboard.writeText(toTSV(columns, rows));
    new Notice(`Copied ${rows.length} row(s) to clipboard.`, 2000);
  } catch (err: unknown) {
    plugin.logError('Failed to copy preview to clipboard', err);
    new Notice(
      'Could not copy to clipboard. Check clipboard permissions.',
      4000,
    );
  }
}

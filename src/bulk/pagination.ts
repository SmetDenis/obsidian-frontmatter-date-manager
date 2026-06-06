/**
 * Pure page-math helpers for the paginated preview tables in src/bulk/chrome.ts.
 * No DOM or obsidian dependency, so the slicing/counting logic is unit-tested
 * even though the table rendering itself is not (the obsidian mock no-ops DOM).
 *
 * Contract: pageSize must be >= 1.
 */

/** Number of pages needed to show `total` rows; 0 rows yields 0 pages. */
export function getPageCount(total: number, pageSize: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / pageSize);
}

/** Clamp a page index into [0, max(0, pageCount - 1)]. */
export function clampPage(page: number, pageCount: number): number {
  const max = Math.max(0, pageCount - 1);
  if (page < 0) return 0;
  if (page > max) return max;
  return page;
}

/** Return the slice of `rows` for the given page, clamping out-of-range pages. */
export function getPageSlice<T>(
  rows: T[],
  page: number,
  pageSize: number,
): T[] {
  const pageCount = getPageCount(rows.length, pageSize);
  const safePage = clampPage(page, pageCount);
  const start = safePage * pageSize;
  return rows.slice(start, start + pageSize);
}

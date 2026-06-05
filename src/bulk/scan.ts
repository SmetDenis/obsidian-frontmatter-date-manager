import { TFile } from 'obsidian';

export const SCAN_BATCH_SIZE = 50;

export interface BatchedScanOptions<T> {
  files: TFile[];
  isOpen: () => boolean;
  onProgress: (done: number, total: number) => void;
  compute: (file: TFile) => T;
  batchSize?: number;
}

/**
 * Run a synchronous per-file `compute` across `files`, yielding to the event
 * loop every `batchSize` items so large vaults (10k+) do not freeze the UI.
 * Reports progress after each batch (and on the final item). Aborts early and
 * returns the partial result when `isOpen()` becomes false.
 */
export async function runBatchedScan<T>(
  opts: BatchedScanOptions<T>,
): Promise<T[]> {
  const batchSize = opts.batchSize ?? SCAN_BATCH_SIZE;
  const total = opts.files.length;
  const result: T[] = [];

  for (let i = 0; i < total; i++) {
    if (!opts.isOpen()) return result;
    result.push(opts.compute(opts.files[i]!));

    if ((i + 1) % batchSize === 0 || i === total - 1) {
      opts.onProgress(i + 1, total);
      // Yield to the browser event loop between batches.
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
  }

  return result;
}

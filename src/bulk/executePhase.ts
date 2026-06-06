import FrontmatterDateManagerPlugin from '../main';
import { errorToMessage } from '../utils';

export interface ExecutePhaseOptions<T> {
  plugin: FrontmatterDateManagerPlugin;
  items: T[];
  isOpen: () => boolean;
  processItem: (item: T) => Promise<void>;
  onProgress: (done: number, total: number) => void;
  onComplete?: () => Promise<void>;
  labelFor?: (item: T) => string;
}

/** A single item that threw during execution: its label (file path) + reason. */
export interface ExecuteFailure {
  label: string;
  message: string;
}

export interface ExecutePhaseResult {
  processed: number;
  errors: number;
  /**
   * Per-item failures collected in order, so the modal can show the user exactly
   * which files failed and why — `logError` is a no-op in production, so the
   * console is not a viable channel for these details.
   */
  failures: ExecuteFailure[];
}

/**
 * Drive a bulk execute loop: set `bulkRunning` for the duration (reset in
 * finally, even on throw), count per-item errors without aborting, abort the
 * loop when `isOpen()` becomes false, then run `onComplete`.
 */
export async function runExecutePhase<T>(
  opts: ExecutePhaseOptions<T>,
): Promise<ExecutePhaseResult> {
  const total = opts.items.length;
  let processed = 0;
  let errors = 0;
  const failures: ExecuteFailure[] = [];

  opts.plugin.bulkRunning = true;
  try {
    for (let i = 0; i < total; i++) {
      if (!opts.isOpen()) break;
      opts.onProgress(i + 1, total);
      const item = opts.items[i]!;
      try {
        await opts.processItem(item);
        processed++;
      } catch (e) {
        errors++;
        const label = opts.labelFor ? opts.labelFor(item) : String(i);
        failures.push({ label, message: errorToMessage(e) });
        opts.plugin.logError('Error processing', label, e);
      }
    }
  } finally {
    opts.plugin.bulkRunning = false;
  }

  if (opts.onComplete) await opts.onComplete();

  return { processed, errors, failures };
}

import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { runBatchedScan } from '../../bulk/scan';

function files(n: number): TFile[] {
  return Array.from(
    { length: n },
    (_, i) => ({ path: `f${i}.md` }) as unknown as TFile,
  );
}

describe('runBatchedScan', () => {
  it('computes an entry per file and reports final progress', async () => {
    const progress: Array<[number, number]> = [];
    const result = await runBatchedScan<string>({
      files: files(5),
      isOpen: () => true,
      onProgress: (done, total) => progress.push([done, total]),
      compute: (f) => f.path.toUpperCase(),
      batchSize: 2,
    });

    expect(result).toEqual(['F0.MD', 'F1.MD', 'F2.MD', 'F3.MD', 'F4.MD']);
    expect(progress[progress.length - 1]).toEqual([5, 5]);
  });

  it('aborts early and returns what it has when isOpen flips false', async () => {
    let open = true;
    const result = await runBatchedScan<string>({
      files: files(10),
      isOpen: () => open,
      onProgress: (done) => {
        if (done >= 4) open = false;
      },
      compute: (f) => f.path,
      batchSize: 2,
    });

    expect(result.length).toBeLessThan(10);
    expect(result.length).toBeGreaterThan(0);
  });
});

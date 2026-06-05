import { describe, it, expect } from 'vitest';
import { createPlugin } from '../helpers';
import { runExecutePhase } from '../../bulk/executePhase';

describe('runExecutePhase', () => {
  it('processes every item, resets bulkRunning, runs onComplete', async () => {
    const plugin = createPlugin();
    const processed: number[] = [];
    let completed = false;

    const res = await runExecutePhase<number>({
      plugin,
      items: [1, 2, 3],
      isOpen: () => true,
      processItem: async (n) => {
        processed.push(n);
      },
      onProgress: () => {},
      onComplete: async () => {
        completed = true;
      },
    });

    expect(processed).toEqual([1, 2, 3]);
    expect(res).toEqual({ processed: 3, errors: 0 });
    expect(plugin.bulkRunning).toBe(false);
    expect(completed).toBe(true);
  });

  it('counts errors without aborting and always resets bulkRunning', async () => {
    const plugin = createPlugin();
    const res = await runExecutePhase<number>({
      plugin,
      items: [1, 2, 3],
      isOpen: () => true,
      processItem: async (n) => {
        if (n === 2) throw new Error('boom');
      },
      onProgress: () => {},
    });

    expect(res).toEqual({ processed: 2, errors: 1 });
    expect(plugin.bulkRunning).toBe(false);
  });

  it('aborts when isOpen flips false', async () => {
    const plugin = createPlugin();
    let open = true;
    const processed: number[] = [];
    const res = await runExecutePhase<number>({
      plugin,
      items: [1, 2, 3, 4],
      isOpen: () => open,
      processItem: async (n) => {
        processed.push(n);
        if (n === 2) open = false;
      },
      onProgress: () => {},
    });

    expect(processed).toEqual([1, 2]);
    expect(res.processed).toBe(2);
    expect(plugin.bulkRunning).toBe(false);
  });
});

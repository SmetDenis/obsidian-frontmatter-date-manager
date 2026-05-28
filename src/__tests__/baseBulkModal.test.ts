import { describe, it, expect } from 'vitest';
import { TFile } from 'obsidian';
import { BaseBulkModal } from '../BaseBulkModal';
import { createPlugin } from './helpers';

class NoOpModal extends BaseBulkModal {
  protected getTitle(n: number) {
    return `t ${n}`;
  }
  protected getDescription() {
    return 'd';
  }
  protected getWarning(_: number) {
    return null;
  }
  protected getRunningMessage() {
    return 'r';
  }
  protected async processFile(_: TFile) {
    /* noop */
  }
}

describe('BaseBulkModal hooks', () => {
  it('narrowFiles defaults to identity', async () => {
    const modal = new NoOpModal({} as any, createPlugin());
    const files = [{ path: 'a.md' }, { path: 'b.md' }] as unknown as TFile[];
    const narrowed = await (modal as any).narrowFiles(files);
    expect(narrowed).toBe(files);
  });

  it('renderExtraSection defaults to no-op', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    const parent = { children: [] } as unknown as HTMLElement;
    const result = (modal as any).renderExtraSection(parent, []);
    expect(result).toBeUndefined();
  });

  it('canRun defaults to true when files non-empty', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    expect((modal as any).canRun([{ path: 'a.md' }])).toBe(true);
  });

  it('canRun returns false on empty list', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    expect((modal as any).canRun([])).toBe(false);
  });
});

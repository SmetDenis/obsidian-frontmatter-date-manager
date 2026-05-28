import { describe, it, expect, vi } from 'vitest';
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

describe('BaseBulkModal.refreshRunButton', () => {
  it('does nothing when runButtonRef is null', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    expect(() => (modal as any).refreshRunButton()).not.toThrow();
  });

  it('disables run button when canRun is false (no confirmation)', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    const setDisabled = vi.fn();
    (modal as any).runButtonRef = { setDisabled };
    (modal as any).cachedFiles = [];
    (modal as any).refreshRunButton();
    expect(setDisabled).toHaveBeenCalledWith(true);
  });

  it('enables run button when canRun is true (no confirmation)', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    const setDisabled = vi.fn();
    (modal as any).runButtonRef = { setDisabled };
    (modal as any).cachedFiles = [{ path: 'a.md' } as unknown as TFile];
    (modal as any).refreshRunButton();
    expect(setDisabled).toHaveBeenCalledWith(false);
  });

  it('respects confirmation gate when prompt is set', () => {
    class ConfirmModal extends NoOpModal {
      protected getConfirmationPrompt() {
        return { text: 'type X', match: 'X' };
      }
    }
    const modal = new ConfirmModal({} as any, createPlugin());
    const setDisabled = vi.fn();
    (modal as any).runButtonRef = { setDisabled };
    (modal as any).cachedFiles = [{ path: 'a.md' } as unknown as TFile];
    // canRun true, but confirmation not matched yet
    (modal as any).confirmMatched = false;
    (modal as any).refreshRunButton();
    expect(setDisabled).toHaveBeenLastCalledWith(true);

    // canRun true AND confirmation matched
    (modal as any).confirmMatched = true;
    (modal as any).refreshRunButton();
    expect(setDisabled).toHaveBeenLastCalledWith(false);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { TFile } from 'obsidian';
import { BaseBulkModal } from '../BaseBulkModal';
import { createPlugin, fakeWarnEl } from './helpers';

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

// A modal whose warning depends on mutable interactive state, mirroring how
// FindInversionsModal's warning depends on the selected strategy.
class DynamicWarnModal extends BaseBulkModal {
  public showWarning = false;
  protected getTitle(n: number) {
    return `t ${n}`;
  }
  protected getDescription() {
    return 'd';
  }
  protected getWarning(n: number) {
    return this.showWarning ? `Irreversible change to ${n} files.` : null;
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

  it('refresh only gates on canRun (no confirmation step)', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    const setDisabled = vi.fn();
    (modal as any).runButtonRef = { setDisabled };
    (modal as any).cachedFiles = [{ path: 'a.md' } as unknown as TFile];
    (modal as any).refreshRunButton();
    expect(setDisabled).toHaveBeenLastCalledWith(false);

    (modal as any).cachedFiles = [];
    (modal as any).refreshRunButton();
    expect(setDisabled).toHaveBeenLastCalledWith(true);
  });
});

describe('BaseBulkModal.isRunDestructive', () => {
  it('defaults to false (non-destructive Run)', () => {
    const modal = new NoOpModal({} as any, createPlugin());
    expect((modal as any).isRunDestructive()).toBe(false);
  });
});

describe('BaseBulkModal.refreshWarning', () => {
  it('does nothing when warningEl is null', () => {
    const modal = new DynamicWarnModal({} as any, createPlugin());
    expect(() => (modal as any).refreshWarning()).not.toThrow();
  });

  it('renders the warning text when getWarning returns non-null', () => {
    const modal = new DynamicWarnModal({} as any, createPlugin());
    const el = fakeWarnEl();
    (modal as any).warningEl = el;
    (modal as any).cachedFiles = [{ path: 'a.md' } as unknown as TFile];
    modal.showWarning = true;

    (modal as any).refreshWarning();

    expect(
      el.children.some((c) => c.text === 'Irreversible change to 1 files.'),
    ).toBe(true);
  });

  it('renders nothing when getWarning returns null', () => {
    const modal = new DynamicWarnModal({} as any, createPlugin());
    const el = fakeWarnEl();
    (modal as any).warningEl = el;
    (modal as any).cachedFiles = [{ path: 'a.md' } as unknown as TFile];
    modal.showWarning = false;

    (modal as any).refreshWarning();

    expect(el.children).toHaveLength(0);
  });

  it('clears a stale warning when state flips back to no-warning', () => {
    const modal = new DynamicWarnModal({} as any, createPlugin());
    const el = fakeWarnEl();
    (modal as any).warningEl = el;
    (modal as any).cachedFiles = [{ path: 'a.md' } as unknown as TFile];

    modal.showWarning = true;
    (modal as any).refreshWarning();
    expect(el.children.length).toBeGreaterThan(0);

    modal.showWarning = false;
    (modal as any).refreshWarning();
    expect(el.children).toHaveLength(0);
  });
});

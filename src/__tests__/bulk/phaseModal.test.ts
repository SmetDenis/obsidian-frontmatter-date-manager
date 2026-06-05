import { describe, it, expect } from 'vitest';
import { PhaseModal } from '../../bulk/PhaseModal';

// Concrete subclass exposing the protected navigation for testing. The
// obsidian mock's contentEl.empty() is a no-op, so we assert on the render
// call order and the back-stack, not on DOM.
class TestPhaseModal extends PhaseModal {
  public log: string[] = [];
  public start() {
    void this.goTo(() => {
      this.log.push('a');
    });
  }
  public next() {
    void this.goTo(() => {
      this.log.push('b');
    });
  }
  public goBack() {
    this.back();
  }
  public openState() {
    return this.isOpenState();
  }
}

describe('PhaseModal navigation', () => {
  it('renders the current phase and supports back to the previous phase', () => {
    const modal = new TestPhaseModal({} as any);
    modal.start();
    modal.next();
    expect(modal.log).toEqual(['a', 'b']);

    modal.goBack();
    expect(modal.log).toEqual(['a', 'b', 'a']);
  });

  it('tracks open state across open/close', () => {
    const modal = new TestPhaseModal({} as any);
    expect(modal.openState()).toBe(false);
    modal.onOpen();
    expect(modal.openState()).toBe(true);
    modal.onClose();
    expect(modal.openState()).toBe(false);
  });
});

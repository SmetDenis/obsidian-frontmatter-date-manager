import { Modal } from 'obsidian';

type PhaseRender = () => void | Promise<void>;

/**
 * Thin host for multi-phase bulk modals. Single responsibility: phase
 * navigation (a render stack with goTo/back) plus open-state lifecycle. It
 * renders no UI of its own — concrete modals build screens with the helpers
 * in chrome.ts. Operation-specific logic must NOT live here.
 */
export abstract class PhaseModal extends Modal {
  private phaseStack: PhaseRender[] = [];
  private opened = false;

  onOpen() {
    this.opened = true;
  }

  onClose() {
    this.contentEl.empty();
    this.opened = false;
    this.phaseStack = [];
  }

  /** True while the modal is open; passed to scan/execute as `isOpen`. */
  protected isOpenState(): boolean {
    return this.opened;
  }

  /** Render a new phase, clearing the content and pushing onto the back-stack. */
  protected async goTo(render: PhaseRender): Promise<void> {
    this.phaseStack.push(render);
    this.contentEl.empty();
    await render();
  }

  /** Re-render the previous phase (no-op if there is no previous phase). */
  protected back(): void {
    if (this.phaseStack.length < 2) return;
    this.phaseStack.pop();
    const prev = this.phaseStack[this.phaseStack.length - 1]!;
    this.contentEl.empty();
    void prev();
  }
}

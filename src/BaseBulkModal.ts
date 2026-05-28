import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';

export abstract class BaseBulkModal extends Modal {
  protected plugin: FrontmatterDateManagerPlugin;
  private divContainer?: HTMLDivElement;
  private settingsSection?: Setting;
  private isOpened = false;
  private cachedFiles: TFile[] | null = null;
  private runButtonRef: { setDisabled: (disabled: boolean) => void } | null =
    null;
  private confirmMatched = false;

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app);
    this.plugin = plugin;
  }

  protected abstract getTitle(fileCount: number): string;
  protected abstract getDescription(): string;
  protected abstract getWarning(fileCount: number): string | null;
  protected abstract getRunningMessage(): string;
  protected abstract processFile(file: TFile): Promise<void>;
  protected async onComplete(): Promise<void> {}

  protected skipHashCheck(): boolean {
    return false;
  }

  protected async narrowFiles(files: TFile[]): Promise<TFile[]> {
    return files;
  }

  protected renderExtraSection(_parent: HTMLElement, _files: TFile[]): void {
    // default: no-op
  }

  protected canRun(files: TFile[]): boolean {
    return files.length > 0;
  }

  protected getConfirmationPrompt(): {
    text: string;
    match: string;
  } | null {
    return null;
  }

  private async onRun() {
    if (!this.divContainer) {
      this.close();
      return;
    }

    const allMdFiles =
      this.cachedFiles ??
      (await this.plugin.getAllFilesPossiblyAffected({
        skipHashCheck: this.skipHashCheck(),
      }));

    this.divContainer.empty();

    const header = this.divContainer.createEl('span');
    header.setText(this.getRunningMessage());

    const wrapperBar = this.divContainer.createEl('div');
    wrapperBar.addClass('frontmatter-date-manager-progress-section');

    const progress = wrapperBar.createEl('progress');
    progress.setAttr('max', allMdFiles.length);

    const fileCounter = wrapperBar.createEl('span');

    const updateCount = (count: number) => {
      progress.setAttr('value', count);
      fileCounter.setText(`${count}/${allMdFiles.length}`);
    };
    updateCount(0);

    if (this.settingsSection) {
      this.contentEl.removeChild(this.settingsSection.settingEl);
    }

    let errorCount = 0;
    this.plugin.bulkRunning = true;
    try {
      for (let i = 0; i < allMdFiles.length; i++) {
        // User can close the modal mid-operation; skip remaining files.
        if (!this.isOpened) {
          new Notice('Bulk operation stopped.', 2000);
          return;
        }
        updateCount(i + 1);
        const file = allMdFiles[i]!;
        try {
          await this.processFile(file);
        } catch (e) {
          errorCount++;
          this.plugin.logError('Error processing', file.path, e);
        }
      }
    } finally {
      this.plugin.bulkRunning = false;
    }

    await this.onComplete();

    let doneText = 'Done! You can safely close this modal.';
    if (errorCount > 0) {
      doneText = `Done with ${errorCount} error(s). Check the console for details.`;
    }

    this.divContainer.empty();

    const doneMessage = this.divContainer.createEl('span');
    doneMessage.setText(doneText);

    this.divContainer.createEl('br');
    this.divContainer.createEl('br');

    new Setting(this.divContainer).addButton((btn) => {
      btn.setButtonText('Close').onClick(() => {
        this.close();
      });
    });
  }

  async onOpen() {
    this.isOpened = true;
    const { contentEl } = this;
    contentEl.addClass('frontmatter-date-manager-bulk-modal');

    const header = contentEl.createEl('h2', {
      text: 'Finding eligible files in the vault...',
    });

    this.cachedFiles = await this.plugin.getAllFilesPossiblyAffected({
      skipHashCheck: this.skipHashCheck(),
    });
    this.cachedFiles = await this.narrowFiles(this.cachedFiles);

    header.setText(this.getTitle(this.cachedFiles.length));

    const div = contentEl.createDiv();
    this.divContainer = div;

    div.createSpan({ text: this.getDescription() });
    div.createEl('br');
    div.createEl('br');

    const warning = this.getWarning(this.cachedFiles.length);
    if (warning) {
      div.createSpan({
        text: warning,
        cls: 'frontmatter-date-manager-settings-warn',
      });
      div.createEl('br');
      div.createEl('br');
    }

    this.renderExtraSection(div, this.cachedFiles);

    const confirmation = this.getConfirmationPrompt();

    this.settingsSection = new Setting(contentEl)
      .addButton((btn) => {
        const canStart = this.canRun(this.cachedFiles ?? []);
        if (confirmation) {
          btn.setWarning().setDisabled(true);
        } else {
          btn.setCta();
          btn.setDisabled(!canStart);
        }
        btn.setButtonText('Run').onClick(() => {
          void this.onRun();
        });
        this.runButtonRef = btn;
      })
      .addButton((btn) => {
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
        });
      });

    if (confirmation) {
      const confirmSetting = new Setting(contentEl)
        .setName(confirmation.text)
        .addText((text) => {
          text.setPlaceholder(confirmation.match);
          text.onChange((value) => {
            this.confirmMatched = value.trim() === confirmation.match;
            this.refreshRunButton();
          });
        });
      confirmSetting.settingEl.addClass(
        'frontmatter-date-manager-bulk-confirm',
      );
      contentEl.insertBefore(
        confirmSetting.settingEl,
        this.settingsSection.settingEl,
      );
    }
  }

  protected refreshRunButton(): void {
    if (!this.runButtonRef) return;
    const canStart = this.canRun(this.cachedFiles ?? []);
    const confirmation = this.getConfirmationPrompt();
    const disabled = confirmation
      ? !canStart || !this.confirmMatched
      : !canStart;
    this.runButtonRef.setDisabled(disabled);
  }

  onClose() {
    this.contentEl.empty();
    this.isOpened = false;
    this.cachedFiles = null;
    this.runButtonRef = null;
    this.confirmMatched = false;
  }
}

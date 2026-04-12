import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';

export abstract class BaseBulkModal extends Modal {
  protected plugin: FrontmatterDateManagerPlugin;
  private divContainer?: HTMLDivElement;
  private settingsSection?: Setting;
  private isOpened = false;
  private cachedFiles: TFile[] | null = null;

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
    wrapperBar.addClass('progress-section');

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
    this.plugin._bulkRunning = true;
    try {
      for (let i = 0; i < allMdFiles.length; i++) {
        if (!this.isOpened) {
          new Notice('Bulk operation stopped.', 2000);
          return;
        }
        updateCount(i + 1);
        try {
          await this.processFile(allMdFiles[i]);
        } catch (e) {
          errorCount++;
          this.plugin.logError('Error processing', allMdFiles[i].path, e);
        }
      }
    } finally {
      this.plugin._bulkRunning = false;
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

    const el = new Setting(this.divContainer).addButton((btn) => {
      btn.setButtonText('Close').onClick(() => {
        this.close();
      });
    }).settingEl;
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

    const confirmation = this.getConfirmationPrompt();

    let setRunDisabled = (_disabled: boolean) => {};

    this.settingsSection = new Setting(contentEl)
      .addButton((btn) => {
        if (confirmation) {
          btn.setWarning().setDisabled(true);
        } else {
          btn.setCta();
        }
        btn.setButtonText('Run').onClick(() => {
          this.onRun();
        });
        setRunDisabled = (disabled) => btn.setDisabled(disabled);
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
            setRunDisabled(value.trim() !== confirmation.match);
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

  onClose() {
    this.contentEl.empty();
    this.isOpened = false;
    this.cachedFiles = null;
  }
}

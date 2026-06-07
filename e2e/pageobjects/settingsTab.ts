import { browser, $ } from '@wdio/globals';

const PLUGIN_ID = 'frontmatter-date-manager';

export const settingsTab = {
  /** Open the settings window directly on this plugin's tab. */
  async open(): Promise<void> {
    await browser.executeObsidian(({ app }, id) => {
      const setting = (
        app as unknown as {
          setting: { open(): void; openTabById(id: string): void };
        }
      ).setting;
      setting.open();
      setting.openTabById(id);
    }, PLUGIN_ID);
  },

  /** Click a bulk-operation button by its stable class (opens the modal). */
  async openModal(buttonClass: string): Promise<void> {
    const btn = await $(`.${buttonClass}`);
    await btn.waitForClickable({ timeout: 5_000 });
    await btn.click();
  },

  async close(): Promise<void> {
    await browser.executeObsidian(({ app }) => {
      (app as unknown as { setting: { close(): void } }).setting.close();
    });
  },
};

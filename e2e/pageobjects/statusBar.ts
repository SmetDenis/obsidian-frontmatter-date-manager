import { $ } from '@wdio/globals';

// The plugin's status bar indicator (class added in setupStatusBar). Hidden
// states use a CSS class, so "shown" means rendered AND displayed.
const INDICATOR = '.frontmatter-date-manager-status';

export const statusBar = {
  async text(): Promise<string> {
    const el = $(INDICATOR);
    await el.waitForExist({ timeout: 5_000 });
    return el.getText();
  },

  async isShown(): Promise<boolean> {
    const el = $(INDICATOR);
    return (await el.isExisting()) && el.isDisplayed();
  },

  async click(): Promise<void> {
    await $(INDICATOR).click();
  },
};

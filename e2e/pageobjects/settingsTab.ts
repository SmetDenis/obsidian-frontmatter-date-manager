import { browser, $, $$ } from '@wdio/globals';

const PLUGIN_ID = 'frontmatter-date-manager';

const EXCLUDE_INPUT = '.frontmatter-date-manager-exclude-input';
const EXCLUDE_ADD = '.frontmatter-date-manager-exclude-add';
const CHIP = '.frontmatter-date-manager-property-chip';
const CHIP_LABEL = '.frontmatter-date-manager-property-chip-label';
const CHIP_REMOVE = '.frontmatter-date-manager-property-chip-remove';

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
    const btn = $(`.${buttonClass}`);
    await btn.waitForClickable({ timeout: 5_000 });
    await btn.click();
  },

  // --- "Ignore these properties" exclude list (comma input + chips) ---

  /** Type into the exclude input and click "+" to commit. */
  async addExcludeProperty(value: string): Promise<void> {
    const input = $(EXCLUDE_INPUT);
    await input.waitForExist({ timeout: 5_000 });
    await input.setValue(value);
    await $(EXCLUDE_ADD).click();
  },

  /** Labels of the currently rendered exclude chips, in order. */
  async excludeChipLabels(): Promise<string[]> {
    return $$(CHIP_LABEL).map((l) => l.getText());
  },

  async excludeChipCount(): Promise<number> {
    return $$(CHIP).length;
  },

  /** Click the remove control of the chip whose label matches. */
  async removeExcludeChip(label: string): Promise<void> {
    const chips = await $$(CHIP).getElements();
    for (const chip of chips) {
      if ((await chip.$(CHIP_LABEL).getText()) === label) {
        await chip.$(CHIP_REMOVE).click();
        return;
      }
    }
  },

  async close(): Promise<void> {
    await browser.executeObsidian(({ app }) => {
      (app as unknown as { setting: { close(): void } }).setting.close();
    });
  },
};

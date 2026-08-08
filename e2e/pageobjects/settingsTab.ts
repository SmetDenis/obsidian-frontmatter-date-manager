import { browser, $, $$ } from '@wdio/globals';

const PLUGIN_ID = 'frontmatter-date-manager';

const EXCLUDE_INPUT = '.frontmatter-date-manager-exclude-input';
const EXCLUDE_ADD = '.frontmatter-date-manager-exclude-add';
const EXCLUDE_LIST = '.frontmatter-date-manager-exclude-list';
// Real entries only. The list renders two non-entry rows as .setting-item too:
// its empty-state placeholder (.mod-empty-state) and, since the list carries a
// `heading`, the heading row (.setting-item-heading). Both must be excluded or
// the row count is off by one.
const EXCLUDE_ROW = `${EXCLUDE_LIST} .setting-item:not(.mod-empty-state):not(.setting-item-heading)`;
const ROW_NAME = '.setting-item-name';
// Delete affordance the declarative list adds to each row when onDelete is set.
const ROW_DELETE = '.clickable-icon';
// Sub-page chrome (declarative `type: 'page'` navigation).
const SUBPAGE_BACK = '.setting-page-back-button';
const NAVIGABLE_ROW = '.setting-item.mod-navigable';

async function visibleBackButton() {
  const backs = await $$(SUBPAGE_BACK).getElements();
  for (const back of backs) {
    if (await back.isDisplayed()) return back;
  }
  return null;
}

export const settingsTab = {
  /** Open the settings UI directly on this plugin's tab. */
  async open(): Promise<void> {
    await browser.executeObsidian(({ app }, id) => {
      const internal = app as unknown as {
        vault: { setConfig(key: string, value: unknown): void };
        setting: { open(): void; openTabById(id: string): void };
      };
      // Obsidian 1.13 opens settings in a separate OS window by default
      // (vault config `settingsPopoutWindow`, default true). Force the classic
      // in-window modal so every Page Object selector - and the bulk modals
      // opened from settings buttons - stays in the main webdriver context.
      internal.vault.setConfig('settingsPopoutWindow', false);
      internal.setting.open();
      internal.setting.openTabById(id);
    }, PLUGIN_ID);
  },

  /** Click a bulk-operation button by its stable class (opens the modal). */
  async openModal(buttonClass: string): Promise<void> {
    const btn = $(`.${buttonClass}`);
    await btn.waitForClickable({ timeout: 5_000 });
    await btn.click();
  },

  /** Open a declarative sub-page by its visible row name (English-only e2e). */
  async openSubPage(name: string): Promise<void> {
    const rows = await $$(NAVIGABLE_ROW).getElements();
    for (const row of rows) {
      if (
        (await row.isDisplayed()) &&
        (await row.$(ROW_NAME).getText()) === name
      ) {
        await row.click();
        await browser.waitUntil(
          async () => (await visibleBackButton()) !== null,
          {
            timeout: 5_000,
            timeoutMsg: 'sub-page back button never appeared',
          },
        );
        return;
      }
    }
    throw new Error(`no navigable settings row named "${name}"`);
  },

  async backFromSubPage(): Promise<void> {
    // The settings modal keeps other tabs' DOM around, so a bare $ can match
    // a hidden back button (and the raw-coordinates click lands on whatever
    // sits there, e.g. the tab sidebar). Only ever click the visible one.
    const back = await visibleBackButton();
    if (!back) throw new Error('no visible sub-page back button');
    await back.click();
  },

  // --- "Ignore these properties" exclude list (comma input + native list) ---

  /** Type into the exclude input and click "+" to commit. */
  async addExcludeProperty(value: string): Promise<void> {
    const input = $(EXCLUDE_INPUT);
    await input.waitForExist({ timeout: 5_000 });
    await input.setValue(value);
    await $(EXCLUDE_ADD).click();
  },

  /** Names of the currently rendered exclude-list rows, in order. */
  async excludeRowLabels(): Promise<string[]> {
    return $$(`${EXCLUDE_ROW} ${ROW_NAME}`).map((l) => l.getText());
  },

  async excludeRowCount(): Promise<number> {
    return $$(EXCLUDE_ROW).length;
  },

  /** Click the delete control of the list row whose name matches. */
  async removeExcludeRow(label: string): Promise<void> {
    const rows = await $$(EXCLUDE_ROW).getElements();
    for (const row of rows) {
      if ((await row.$(ROW_NAME).getText()) === label) {
        await row.$(ROW_DELETE).click();
        return;
      }
    }
    throw new Error(`no exclude-list row named "${label}"`);
  },

  async close(): Promise<void> {
    await browser.executeObsidian(({ app }) => {
      (app as unknown as { setting: { close(): void } }).setting.close();
    });
  },
};

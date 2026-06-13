import { $ } from '@wdio/globals';

const M = '.modal';
const PRIMARY = `${M} .frontmatter-date-manager-bulk-primary`;
const FOOTER = `${M} .frontmatter-date-manager-bulk-footer`;
const TABLE = `${M} .frontmatter-date-manager-bulk-table`;
const PAGE_INFO = `${M} .frontmatter-date-manager-bulk-pagination-info`;
const NEXT = `${M} .frontmatter-date-manager-bulk-pager-next`;

export const bulkModal = {
  /** Choose a dropdown value by the dropdown's stable class. */
  async select(selectClass: string, value: string): Promise<void> {
    const sel = $(`${M} .${selectClass}`);
    await sel.waitForExist({ timeout: 5_000 });
    await sel.selectByAttribute('value', value);
  },

  /** Fill a text input by its stable class. */
  async fillByClass(inputClass: string, value: string): Promise<void> {
    const input = $(`${M} .${inputClass}`);
    await input.waitForExist({ timeout: 5_000 });
    await input.setValue(value);
  },

  /** Click the primary (Run / Scan & preview) button. */
  async clickPrimary(): Promise<void> {
    const btn = $(PRIMARY);
    await btn.waitForClickable({ timeout: 10_000 });
    await btn.click();
  },

  async isPrimaryDisabled(): Promise<boolean> {
    const btn = $(PRIMARY);
    return (await btn.getAttribute('disabled')) !== null;
  },

  /** Wait until the preview diff table is rendered. */
  async waitForPreview(): Promise<void> {
    await $(TABLE).waitForExist({ timeout: 20_000 });
  },

  async previewVisible(): Promise<boolean> {
    return $(TABLE).isExisting();
  },

  async pageInfo(): Promise<string> {
    return $(PAGE_INFO).getText();
  },

  async nextPage(): Promise<void> {
    await $(NEXT).click();
  },

  /** Close the modal via its footer (Cancel/Close) button. */
  async close(): Promise<void> {
    const btn = $(FOOTER);
    if (await btn.isExisting()) await btn.click();
  },
};

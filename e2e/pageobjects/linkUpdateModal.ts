import { $$, browser } from '@wdio/globals';

// Obsidian's own "Update links" prompt, shown by FileManager.renameFile when
// the vault setting "Automatically update internal links" is off. It blocks the
// rename until a human clicks, which is exactly the window the experimental
// rename suppression has to survive.
//
// All DOM coupling for that modal lives here. The settings modal keeps other
// tabs' DOM around, so every lookup is scoped to the modal whose title reads
// "Update links" and only displayed elements are touched.

export type LinkUpdateChoice = 'Always update' | 'Just once' | 'Do not update';

const TITLE = 'Update links';

async function findModal() {
  for (const modal of await $$('.modal').getElements()) {
    if (!(await modal.isDisplayed())) continue;
    const title = modal.$('.modal-title');
    if (!(await title.isExisting())) continue;
    if ((await title.getText()).trim() === TITLE) return modal;
  }
  return null;
}

export const linkUpdateModal = {
  async isOpen(): Promise<boolean> {
    return (await findModal()) !== null;
  },

  async waitForOpen(timeout = 15_000): Promise<void> {
    await browser.waitUntil(async () => (await findModal()) !== null, {
      timeout,
      interval: 200,
      timeoutMsg: 'the "Update links" modal never opened',
    });
  },

  /** Click one of the three choices and wait for the modal to close. */
  async choose(label: LinkUpdateChoice): Promise<void> {
    await this.waitForOpen();
    const modal = await findModal();
    if (modal === null) throw new Error('modal vanished before the click');
    for (const button of await modal
      .$$('.modal-button-container button')
      .getElements()) {
      if (!(await button.isDisplayed())) continue;
      if ((await button.getText()).trim() !== label) continue;
      await button.click();
      await browser.waitUntil(async () => (await findModal()) === null, {
        timeout: 10_000,
        interval: 200,
        timeoutMsg: `the "Update links" modal stayed open after "${label}"`,
      });
      return;
    }
    throw new Error(`no "${label}" button in the "Update links" modal`);
  },
};

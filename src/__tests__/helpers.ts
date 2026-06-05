import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS, FrontmatterDateManagerSettings } from '../Settings';

export function createPlugin(
  overrides: Partial<FrontmatterDateManagerSettings> = {},
): FrontmatterDateManagerPlugin {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, ...overrides };
  return plugin;
}

export interface FakeChild {
  tag: string;
  text?: string;
  cls?: string;
}

/**
 * Minimal recorder element implementing the tiny subset of the Obsidian DOM
 * helper API that `BaseBulkModal.refreshWarning()` uses (`empty`,
 * `createSpan`, `createEl`). Records appended children so tests can assert
 * what was rendered.
 */
export interface FakeEl {
  children: FakeChild[];
  empty(): void;
  createSpan(opts: { text?: string; cls?: string }): FakeChild;
  createEl(tag: string, opts?: { text?: string; cls?: string }): FakeChild;
}

export function fakeWarnEl(): FakeEl {
  const children: FakeChild[] = [];
  return {
    children,
    empty() {
      children.length = 0;
    },
    createSpan(opts) {
      const child: FakeChild = { tag: 'span', ...opts };
      children.push(child);
      return child;
    },
    createEl(tag, opts = {}) {
      const child: FakeChild = { tag, ...opts };
      children.push(child);
      return child;
    },
  };
}

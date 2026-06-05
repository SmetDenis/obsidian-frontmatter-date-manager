import { describe, it, expect } from 'vitest';
import { UpdateAllCacheData } from '../UpdateAllCacheData';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS } from '../Settings';

function createMockPlugin(): FrontmatterDateManagerPlugin {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS };
  return plugin;
}

// Testable subclasses to access protected methods
class TestableUpdateAllCacheData extends UpdateAllCacheData {
  public getTitle(n: number) {
    return super.getTitle(n);
  }
  public getDescription() {
    return super.getDescription();
  }
  public getWarning() {
    return super.getWarning();
  }
  public getRunningMessage() {
    return super.getRunningMessage();
  }
}

describe('UpdateAllCacheData', () => {
  const plugin = createMockPlugin();
  const modal = new TestableUpdateAllCacheData({} as any, plugin);

  it('getTitle includes file count', () => {
    expect(modal.getTitle(100)).toBe('Populate hash cache for 100 files');
  });

  it('getDescription returns expected text', () => {
    expect(modal.getDescription()).toContain('update all cache data');
  });

  it('getWarning returns null', () => {
    expect(modal.getWarning()).toBeNull();
  });

  it('getRunningMessage returns expected text', () => {
    expect(modal.getRunningMessage()).toBe('Updating cache...');
  });
});

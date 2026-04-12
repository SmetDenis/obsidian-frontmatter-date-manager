import { describe, it, expect } from 'vitest';
import { UpdateAllModal } from '../UpdateAllModal';
import { UpdateAllCacheData } from '../UpdateAllCacheData';
import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS } from '../Settings';

function createMockPlugin(): FrontmatterDateManagerPlugin {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS };
  return plugin;
}

// Testable subclasses to access protected methods
class TestableUpdateAllModal extends UpdateAllModal {
  public getTitle(n: number) {
    return super.getTitle(n);
  }
  public getDescription() {
    return super.getDescription();
  }
  public getWarning(n: number) {
    return super.getWarning(n);
  }
  public getRunningMessage() {
    return super.getRunningMessage();
  }
  public getConfirmationPrompt() {
    return super.getConfirmationPrompt();
  }
}

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

describe('UpdateAllModal', () => {
  const plugin = createMockPlugin();
  const modal = new TestableUpdateAllModal({} as any, plugin);

  it('getTitle includes file count', () => {
    expect(modal.getTitle(100)).toBe('Overwrite timestamps in 100 files');
  });

  it('getDescription mentions permanent loss', () => {
    expect(modal.getDescription()).toContain('permanently lost');
  });

  it('getWarning includes file count and DESTRUCTIVE', () => {
    const warning = modal.getWarning(50);
    expect(warning).not.toBeNull();
    expect(warning).toContain('50');
    expect(warning).toContain('DESTRUCTIVE');
  });

  it('getRunningMessage returns expected text', () => {
    expect(modal.getRunningMessage()).toBe('Overwriting timestamps...');
  });

  it('getConfirmationPrompt requires typing OVERWRITE', () => {
    const prompt = modal.getConfirmationPrompt();
    expect(prompt).not.toBeNull();
    expect(prompt!.match).toBe('OVERWRITE');
  });
});

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

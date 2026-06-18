// Minimal stubs for Obsidian API types used across the codebase.
// Only shapes needed for imports to resolve - no real behavior.

export class TAbstractFile {
  vault: any;
  path = '';
  name = '';
  parent = null;
}

export class TFile extends TAbstractFile {
  stat = { ctime: 0, mtime: 0, size: 0 };
  basename = '';
  extension = '';
}

export class TFolder extends TAbstractFile {
  children: any[] = [];
  isRoot() {
    return false;
  }
}

export class App {
  vault: any = {};
  workspace: any = {};
}

export class Plugin {
  app: any = {};
  manifest: any = { dir: '' };
  loadData = async () => ({});
  saveData = async () => {};
  addSettingTab = () => {};
  addCommand = () => {};
  addStatusBarItem = () => ({
    setText: () => {},
    onClickEvent: () => {},
  });
  registerEvent = () => {};
  registerInterval = (id: number) => id;
}

export function normalizePath(path: string): string {
  return path;
}

export class Modal {
  app: any;
  contentEl: any = {
    empty: () => {},
    createEl: () => ({}),
    createDiv: () => ({}),
    addClass: () => {},
    removeChild: () => {},
  };
  modalEl: any = {
    addClass: () => {},
    removeClass: () => {},
  };
  containerEl: any = {};
  constructor(app: any) {
    this.app = app;
  }
  open() {}
  close() {}
}

export class Notice {
  constructor(_message: string, _timeout?: number) {}
}

export class PluginSettingTab {
  app: any;
  containerEl: any = { empty: () => {}, createEl: () => ({}) };
  constructor(app: any, _plugin: any) {
    this.app = app;
  }
}

export class Setting {
  settingEl: any = {};
  constructor(_el: any) {}
  setName(_n: string) {
    return this;
  }
  setDesc(_d: any) {
    return this;
  }
  addText(_cb: any) {
    return this;
  }
  addToggle(_cb: any) {
    return this;
  }
  addSlider(_cb: any) {
    return this;
  }
  addButton(_cb: any) {
    return this;
  }
  addSearch(_cb: any) {
    return this;
  }
  addDropdown(_cb: any) {
    return this;
  }
}

export class SearchComponent {
  inputEl: any = {};
  getValue() {
    return '';
  }
  setValue(_v: string) {
    return this;
  }
  setPlaceholder(_p: string) {
    return this;
  }
}

export class AbstractInputSuggest<T> {
  app: any;
  constructor(app: any, _inputEl: any) {
    this.app = app;
  }
  setValue(_v: string) {}
  close() {}
}

export function getLanguage(): string {
  return 'en';
}

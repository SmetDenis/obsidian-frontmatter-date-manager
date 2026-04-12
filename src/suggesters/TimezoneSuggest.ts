import { AbstractInputSuggest, App } from 'obsidian';

declare namespace Intl {
  function supportedValuesOf(key: string): string[];
}

const TIMEZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [];
  }
})();

export class TimezoneSuggest extends AbstractInputSuggest<string> {
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    if (!lowerQuery) return ['UTC', ...TIMEZONES.filter((tz) => tz !== 'UTC')];
    return TIMEZONES.filter((tz) => tz.toLowerCase().includes(lowerQuery));
  }

  renderSuggestion(timezone: string, el: HTMLElement): void {
    el.setText(timezone);
  }

  selectSuggestion(timezone: string): void {
    this.setValue(timezone);
    this.close();
  }
}

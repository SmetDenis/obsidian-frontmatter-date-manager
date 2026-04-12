import { AbstractInputSuggest, App } from 'obsidian';

const TIMEZONES: string[] = (() => {
  try {
    // Intl.supportedValuesOf is available in all modern browsers (ES2022+)
    return (
      Intl as unknown as { supportedValuesOf: (key: string) => string[] }
    ).supportedValuesOf('timeZone');
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

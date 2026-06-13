import { App, Notice, PluginSettingTab, Setting, setIcon } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { TimezoneSuggest } from './suggesters/TimezoneSuggest';
import { getMomentFormatHint, parsePropertyKeys } from './utils';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { UpdateAllCacheData } from './UpdateAllCacheData';
import { BulkPopulateTimestampsModal } from './BulkPopulateTimestampsModal';
import { RenameKeyModal } from './RenameKeyModal';
import { ReformatDateModal } from './ReformatDateModal';
import { FindInversionsModal } from './FindInversionsModal';
import { parseFilterRules, isFileExcluded } from './filterRules';
import { InversionFixStrategy } from './inversionDetection';

export type HashTrackingMode = 'body' | 'frontmatter' | 'both';

export interface FrontmatterDateManagerSettings {
  dateFormat: string;
  timezone: string;
  enableNumberProperties: boolean;
  enableCreateTime: boolean;
  enableAutoUpdate: boolean;
  headerUpdated: string;
  headerCreated: string;
  minSecondsBetweenSaves: number;
  delayForNewFiles: number;
  postUpdateCommand: string;
  filterRules?: string;
  enableModifiedTime?: boolean;

  enableLastViewed?: boolean;
  headerLastViewed?: string;

  enableContentHashCheck?: boolean;
  hashTrackingMode?: HashTrackingMode;
  frontmatterHashExcludeKeys?: string[];
  enableAutoPopulateCache?: boolean;
  hashCacheMaxSize?: number;

  inversionFixStrategy?: InversionFixStrategy;
  inversionToleranceSec?: number;
}

export const DEFAULT_SETTINGS: FrontmatterDateManagerSettings = {
  dateFormat: "yyyy-MM-dd'T'HH:mm:ss",
  timezone: '',
  enableNumberProperties: false,
  enableCreateTime: true,
  enableAutoUpdate: true,
  headerUpdated: 'updated',
  headerCreated: 'created',
  minSecondsBetweenSaves: 30,
  delayForNewFiles: 5000,
  postUpdateCommand: '',
  filterRules: '',
  enableModifiedTime: true,
  enableLastViewed: false,
  headerLastViewed: 'viewed',
  enableContentHashCheck: true,
  hashTrackingMode: 'body',
  frontmatterHashExcludeKeys: [],
  enableAutoPopulateCache: true,
  hashCacheMaxSize: 10_000,
  inversionFixStrategy: 'disabled',
  inversionToleranceSec: 0,
};

export class FrontmatterDateManagerSettingsTab extends PluginSettingTab {
  plugin: FrontmatterDateManagerPlugin;
  // Obsidian re-renders the entire settings tab (calls display()) on any
  // setting change. This preserves the collapsible section's open/closed state.
  private advancedOpen = false;

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // --- Plugin description ---
    const descEl = containerEl.createEl('div', {
      cls: 'frontmatter-date-manager-plugin-description',
    });
    descEl.createEl('p', {
      text: "Sync services, backup tools, and other plugins often rewrite files without changing their content - which resets the file's dates on disk. That makes it impossible to tell when you actually last edited a note.",
    });
    descEl.createEl('p', {
      text: "This plugin writes created and last-edited dates straight into each note's properties, and detects real changes by comparing content, so your dates reflect actual edits - not sync artifacts.",
    });

    // --- Section 1: Timestamp fields ---
    new Setting(containerEl).setHeading().setName('Dates to track');

    this.addEnableCreated();
    this.addFrontMatterCreated();
    this.addEnableModifiedTime();
    this.addFrontMatterUpdated();
    this.addEnableLastViewed();
    this.addFrontMatterLastViewed();

    const modifiedEnabled = this.plugin.settings.enableModifiedTime ?? true;
    const viewedEnabled = this.plugin.settings.enableLastViewed ?? false;

    if (
      !this.plugin.settings.enableCreateTime &&
      !modifiedEnabled &&
      !viewedEnabled
    ) {
      containerEl.createEl('div', {
        cls: 'frontmatter-date-manager-hint-message',
        text: 'Turn on at least one date above to set up the plugin.',
      });
      return;
    }

    // --- Section 2: Date formatting ---
    new Setting(containerEl).setHeading().setName('Date formatting');

    this.addDateFormat();
    this.addTimezone();
    this.addEnableNumberProperties();

    // --- Section 3: Behavior ---
    new Setting(containerEl).setHeading().setName('Behavior');

    this.addEnableAutoUpdate();
    this.addTimeBetweenUpdates();
    this.addFilterRulesSetting();
    this.addContentHashToggle();

    // --- Section: Timestamp inversion ---
    new Setting(containerEl)
      .setHeading()
      .setName('Modified-before-created dates');
    this.addInversionStrategy();
    this.addInversionTolerance();

    // Advanced (collapsible)
    const advancedDetails = containerEl.createEl('details', {
      cls: 'frontmatter-date-manager-advanced-section',
    });
    if (this.advancedOpen) {
      advancedDetails.setAttribute('open', '');
    }
    // Listener is cleaned up when containerEl.empty() destroys the element
    advancedDetails.addEventListener('toggle', () => {
      this.advancedOpen = advancedDetails.open;
    });
    advancedDetails.createEl('summary', { text: 'Advanced' });

    this.addDelayForNewFiles(advancedDetails);
    this.addAutoPopulateCache(advancedDetails);
    this.addMaxCacheEntries(advancedDetails);
    this.addPostUpdateCommand(advancedDetails);

    // --- Section 4: Bulk operations ---
    new Setting(containerEl).setHeading().setName('Bulk operations');

    new Setting(this.containerEl)
      .setName("Set dates from the file's own dates")
      .setDesc(
        "Fill in the created and last-edited dates from each file's own creation and modification dates on disk. Great for first-time setup.",
      )
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-populate');
        cb.setButtonText('Fill in dates').onClick(() => {
          new BulkPopulateTimestampsModal(this.app, this.plugin).open();
        });
      });

    this.addRenameKeyButton();
    this.addReformatDateButton();
    this.addFindInversionsButton();

    if (this.plugin.settings.enableContentHashCheck ?? true) {
      new Setting(this.containerEl)
        .setName('Rebuild hash cache')
        .setDesc(
          'Recompute change-detection data (content hashes) for all your notes. Useful after changing what counts as a change above.',
        )
        .addButton((cb) => {
          cb.buttonEl.addClass('frontmatter-date-manager-open-rebuild-cache');
          cb.setButtonText('Rebuild cache').onClick(() => {
            new UpdateAllCacheData(this.app, this.plugin).open();
          });
        });
    }
  }

  async saveSettings() {
    await this.plugin.saveSettings();
  }

  // --- Timestamp fields ---

  addEnableModifiedTime(): void {
    new Setting(this.containerEl)
      .setName('Track last-edited date')
      .setDesc('Update this date whenever you edit the note.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableModifiedTime ?? true)
          .onChange(async (newValue) => {
            this.plugin.settings.enableModifiedTime = newValue;
            await this.saveSettings();
            this.display();
          }),
      );
  }

  addFrontMatterUpdated(): void {
    if (!(this.plugin.settings.enableModifiedTime ?? true)) {
      return;
    }
    new Setting(this.containerEl)
      .setName('Updated property')
      .setDesc('Property name where the last-edited date is saved.')
      .addText((text) =>
        text
          .setPlaceholder('Updated')
          .setValue(this.plugin.settings.headerUpdated)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) return;
            this.plugin.settings.headerUpdated = trimmed;
            await this.saveSettings();
          }),
      );
  }

  private addRenameKeyButton(): void {
    new Setting(this.containerEl)
      .setName('Rename a property')
      .setDesc(
        'Move values from an old property name to a new one across all notes. ' +
          'Useful after changing a property name above.',
      )
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-rename');
        cb.setButtonText('Rename property').onClick(() => {
          new RenameKeyModal(this.app, this.plugin).open();
        });
      });
  }

  addEnableCreated(): void {
    new Setting(this.containerEl)
      .setName('Track creation date')
      .setDesc("Add a creation date to notes that don't have one yet.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableCreateTime)
          .onChange(async (newValue) => {
            this.plugin.settings.enableCreateTime = newValue;
            await this.saveSettings();
            this.display();
          }),
      );
  }

  addFrontMatterCreated(): void {
    if (!this.plugin.settings.enableCreateTime) {
      return;
    }
    new Setting(this.containerEl)
      .setName('Created property')
      .setDesc('Property name where the creation date is saved.')
      .addText((text) =>
        text
          .setPlaceholder('Created')
          .setValue(this.plugin.settings.headerCreated)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) return;
            this.plugin.settings.headerCreated = trimmed;
            await this.saveSettings();
          }),
      );
  }

  addEnableLastViewed(): void {
    new Setting(this.containerEl)
      .setName('Track last-opened date')
      .setDesc('Save the date each time you open the note.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableLastViewed ?? false)
          .onChange(async (newValue) => {
            this.plugin.settings.enableLastViewed = newValue;
            await this.saveSettings();
            this.display();
          }),
      );
  }

  addFrontMatterLastViewed(): void {
    if (!(this.plugin.settings.enableLastViewed ?? false)) {
      return;
    }
    new Setting(this.containerEl)
      .setName('Viewed property')
      .setDesc('Property name where the last-opened date is saved.')
      .addText((text) =>
        text
          .setPlaceholder('Viewed')
          .setValue(this.plugin.settings.headerLastViewed ?? 'viewed')
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) return;
            this.plugin.settings.headerLastViewed = trimmed;
            await this.saveSettings();
          }),
      );
  }

  // --- Date formatting ---

  addDateFormat(): void {
    this.createDateFormatEditor({
      getValue: () => this.plugin.settings.dateFormat,
      name: 'Date format',
      description: 'How dates and times are written into your notes.',
      setValue: (newValue) => (this.plugin.settings.dateFormat = newValue),
    });
  }

  private addReformatDateButton(): void {
    new Setting(this.containerEl)
      .setName('Reformat existing dates')
      .setDesc(
        'Find dates written in an old format and rewrite them in your current format. ' +
          'Useful after changing the date format above.',
      )
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-reformat');
        cb.setButtonText('Reformat dates').onClick(() => {
          new ReformatDateModal(this.app, this.plugin).open();
        });
      });
  }

  addTimezone(): void {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    new Setting(this.containerEl)
      .setName('Timezone')
      .setDesc(
        `Timezone used when writing dates. Leave blank to use your device's timezone (${localTz}).`,
      )
      .addText((text) => {
        new TimezoneSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(`Local (${localTz})`)
          .setValue(this.plugin.settings.timezone)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              // Intl.DateTimeFormat constructor throws on invalid timezone strings;
              // used here as validation. Silent return prevents saving invalid value.
              try {
                Intl.DateTimeFormat(undefined, { timeZone: trimmed });
              } catch {
                return;
              }
            }
            this.plugin.settings.timezone = trimmed;
            await this.saveSettings();
          });
      })
      .addExtraButton((cb) => {
        cb.setIcon('reset')
          .setTooltip('Reset to local timezone')
          .onClick(async () => {
            this.plugin.settings.timezone = '';
            await this.saveSettings();
            this.display();
          });
      });
  }

  addEnableNumberProperties(): void {
    new Setting(this.containerEl)
      .setName('Save number-only dates without quotes')
      .setDesc(
        'If your date format is only digits (like a unix timestamp), write it as a plain number (updated: 1712930400) instead of text in quotes (updated: "1712930400"). No effect when your format includes dashes or colons.',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableNumberProperties)
          .onChange(async (newValue) => {
            this.plugin.settings.enableNumberProperties = newValue;
            await this.saveSettings();
          }),
      );
  }

  // --- Behavior ---

  addEnableAutoUpdate(): void {
    new Setting(this.containerEl)
      .setName('Auto-update')
      .setDesc(
        'Automatically update dates when you edit a note. Also available from the command palette.',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAutoUpdate)
          .onChange(async (newValue) => {
            this.plugin.settings.enableAutoUpdate = newValue;
            await this.saveSettings();
            this.plugin.updateStatusBar();
          }),
      );
  }

  addTimeBetweenUpdates(): void {
    const modifiedEnabled = this.plugin.settings.enableModifiedTime ?? true;
    const viewedEnabled = this.plugin.settings.enableLastViewed ?? false;
    if (!modifiedEnabled && !viewedEnabled) {
      return;
    }
    new Setting(this.containerEl)
      .setName('Minimum seconds between updates')
      .setDesc(
        'Avoids updating the date too often while you type or switch between notes.',
      )
      .addSlider((slider) =>
        slider
          .setLimits(5, 300, 5)
          .setValue(this.plugin.settings.minSecondsBetweenSaves)
          .onChange(async (value) => {
            this.plugin.settings.minSecondsBetweenSaves = value;
            await this.saveSettings();
          })
          .setDynamicTooltip(),
      );
  }

  addFilterRulesSetting(): void {
    const descr = createFragment();
    descr.append(
      'Choose files or folders to leave alone (no automatic date updates). ',
      'One pattern per line. Lines starting with ',
    );
    descr.createEl('code', { text: '#' });
    descr.append(' are comments. Start a line with ');
    descr.createEl('code', { text: '!' });
    descr.append(
      ' to add a path back. ',
      'If several lines match, the last one wins.',
    );
    descr.createEl('br');
    descr.createEl('a', {
      href: 'https://git-scm.com/docs/gitignore',
      text: 'Advanced syntax (gitignore-style)',
    });

    const setting = new Setting(this.containerEl)
      .setName('Files and folders to skip')
      .setDesc(descr);
    setting.settingEl.addClass('frontmatter-date-manager-filter-setting');

    const warnEl = this.containerEl.createEl('div', {
      cls: 'frontmatter-date-manager-filter-warn',
      text: 'No rules set - all notes get automatic date updates.',
    });

    const errorsEl = this.containerEl.createEl('div', {
      cls: 'frontmatter-date-manager-filter-errors',
    });

    this.addFilterRulesReference();

    const previewEl = this.containerEl.createEl('div', {
      cls: 'frontmatter-date-manager-filter-preview',
    });

    const currentValue = this.plugin.settings.filterRules ?? '';

    const updateFeedback = (text: string) => {
      const trimmed = text.trim();
      warnEl.toggleClass('frontmatter-date-manager-hidden', trimmed.length > 0);

      errorsEl.empty();
      if (trimmed.length > 0) {
        const { errors } = parseFilterRules(trimmed);
        for (const err of errors) {
          errorsEl.createEl('div', {
            text: `Line ${err.lineNumber}: ${err.message} - "${err.text.trim()}"`,
          });
        }
      }
    };

    setting.addTextArea((textArea) => {
      textArea.inputEl.addClass('frontmatter-date-manager-filter-textarea');
      textArea.inputEl.rows = 10;
      textArea.inputEl.placeholder = [
        '# Exclude a folder',
        'templates/',
        '',
        '# Exclude by pattern',
        'daily/**/*.md',
        '',
        '# Re-include a specific file',
        '!daily/important.md',
      ].join('\n');
      textArea.setValue(currentValue);
      updateFeedback(currentValue);

      textArea.onChange(async (value) => {
        this.plugin.settings.filterRules = value;
        await this.saveSettings();
        this.plugin.recompileFilterRules();
        updateFeedback(value);
        previewEl.empty();
      });
    });

    new Setting(this.containerEl).setName('').addButton((btn) => {
      btn.setButtonText('Preview matching files');
      btn.onClick(() => {
        previewEl.empty();
        const rules = this.plugin.getCompiledRules();
        const allFiles = this.app.vault.getMarkdownFiles();
        const excluded: string[] = [];
        const tracked: string[] = [];

        for (const file of allFiles) {
          if (rules.length > 0 && isFileExcluded(file.path, rules)) {
            excluded.push(file.path);
          } else {
            tracked.push(file.path);
          }
        }

        previewEl.createEl('div', {
          text: `${tracked.length} notes tracked, ${excluded.length} notes skipped`,
          cls: 'frontmatter-date-manager-filter-preview-summary',
        });

        if (excluded.length > 0) {
          const details = previewEl.createEl('details');
          details.createEl('summary', {
            text: `Skipped files (${excluded.length})`,
          });
          const list = details.createEl('ul');
          const limit = Math.min(excluded.length, 50);
          for (let i = 0; i < limit; i++) {
            list.createEl('li', { text: excluded[i] });
          }
          if (excluded.length > 50) {
            list.createEl('li', {
              text: `...and ${excluded.length - 50} more`,
            });
          }
        }
      });
    });
  }

  addFilterRulesReference(): void {
    const refEl = this.containerEl.createEl('details', {
      cls: 'frontmatter-date-manager-filter-reference',
    });
    refEl.createEl('summary', { text: 'Pattern syntax reference' });

    const addSection = (title: string, rows: [string, string][]): void => {
      refEl.createEl('div', {
        text: title,
        cls: 'frontmatter-date-manager-ref-section-title',
      });
      const table = refEl.createEl('table');
      for (const [pattern, desc] of rows) {
        const tr = table.createEl('tr');
        tr.createEl('td', {
          text: pattern,
          cls: 'frontmatter-date-manager-ref-pattern',
        });
        tr.createEl('td', {
          text: desc,
          cls: 'frontmatter-date-manager-ref-desc',
        });
      }
    };

    addSection('Syntax basics', [
      ['# comment', 'Lines starting with # are ignored'],
      ['', 'Blank lines are ignored'],
      ['templates/', 'Exclude - files inside templates/ are skipped'],
      ['!templates/keep.md', 'Re-include - prefix with ! to undo exclusion'],
      ['', 'When multiple rules match, the last one wins'],
    ]);

    addSection('Exclude a folder', [
      ['templates/', 'All files inside templates/'],
      ['templates', 'Same effect (trailing slash is optional)'],
      ['projects/drafts/', 'Nested folder'],
    ]);

    addSection('Re-include (undo an exclusion)', [
      ['templates/', 'Exclude the whole folder'],
      ['!templates/keep.md', 'But keep tracking this specific file'],
    ]);

    addSection('Wildcards', [
      ['*', 'Any characters except /'],
      ['**', 'Any characters including / (crosses folders)'],
      ['?', 'Exactly one character'],
    ]);

    addSection('Wildcard examples', [
      ['*.canvas.md', 'Files ending in .canvas.md at vault root'],
      ['**/*.canvas.md', 'Files ending in .canvas.md in any folder'],
      ['daily/2024-*.md', 'Files like daily/2024-01-01.md'],
      ['notes/??.md', 'Two-character filenames in notes/'],
    ]);

    addSection('Specific files', [
      ['inbox/scratch.md', 'One exact file'],
      ['README.md', 'A file at vault root'],
    ]);

    addSection('Paths with spaces', [
      ['My Folder/My Notes/', 'Just write the path as-is'],
      ['Work in Progress/', 'No quotes needed around spaces'],
    ]);

    addSection('Non-Latin characters', [
      ['notes/Заметки/', 'Cyrillic folder name'],
      ['projects/日记/', 'Chinese characters'],
      ['Записки/черновики.md', 'Full non-Latin path'],
    ]);

    addSection('Obsidian-specific examples', [
      ['templates/', 'Template folder'],
      ['daily/', 'Daily notes folder'],
      ['attachments/', 'Attachments / media folder'],
      ['**/*.canvas.md', 'All canvas files'],
      ['**/*.excalidraw.md', 'All Excalidraw drawings'],
      ['inbox/', 'Inbox / scratchpad folder'],
      ['archive/', 'Archived notes'],
    ]);

    addSection('Allowlist mode (track only specific folders)', [
      ['**', 'First, exclude everything'],
      ['!projects/', 'Then re-include only what you want'],
      ['!notes/', 'Re-include another folder'],
    ]);

    const noteEl = refEl.createEl('p', {
      cls: 'frontmatter-date-manager-ref-note',
    });
    noteEl.append(
      'When this field is empty, all notes get automatic date updates.',
    );
  }

  addContentHashToggle(): void {
    const hashEnabled = this.plugin.settings.enableContentHashCheck ?? true;

    new Setting(this.containerEl)
      .setName('Change detection (content hashing)')
      .setDesc(
        hashEnabled
          ? "The last-edited date is written only when the note's content actually changes - this prevents false updates from sync plugins."
          : 'Disabled - the last-edited date is written on every save, even if nothing changed.',
      )
      .addToggle((cb) =>
        cb.setValue(hashEnabled).onChange(async (newValue) => {
          this.plugin.settings.enableContentHashCheck = newValue;
          await this.saveSettings();
          this.display();
        }),
      );

    if (!hashEnabled) return;

    this.addFrontmatterHashTracking();
    this.addFrontmatterExcludeKeys();
  }

  private addFrontmatterHashTracking(): void {
    const setting = new Setting(this.containerEl)
      .setName('What counts as a change')
      .setDesc(
        'Which part of a note counts as a change. ' +
          '"Body only" - editing properties (tags, aliases, etc.) will not update the date. ' +
          '"Properties only" - editing the note text will not update the date. ' +
          '"Both" - any edit updates the date.',
      )
      .addDropdown((dropdown) => {
        dropdown.addOption('body', 'Note body only (default)');
        dropdown.addOption('frontmatter', 'Properties only');
        dropdown.addOption('both', 'Body and properties');
        dropdown.setValue(this.plugin.settings.hashTrackingMode ?? 'body');
        dropdown.onChange(async (value) => {
          this.plugin.settings.hashTrackingMode = value as HashTrackingMode;
          await this.saveSettings();
          new Notice(
            'Tracking mode changed. Rebuild the hash cache (in bulk operations) so dates stay accurate.',
            6000,
          );
          this.display();
        });
      });
    setting.settingEl.addClass('frontmatter-date-manager-nested-setting');
  }

  private addFrontmatterExcludeKeys(): void {
    const mode = this.plugin.settings.hashTrackingMode ?? 'body';
    if (mode !== 'frontmatter' && mode !== 'both') return;

    const currentList = this.plugin.settings.frontmatterHashExcludeKeys ?? [];
    let inputValue = '';

    const addKeys = async () => {
      const newKeys = parsePropertyKeys(inputValue, currentList);
      if (newKeys.length === 0) return;
      this.plugin.settings.frontmatterHashExcludeKeys = [
        ...currentList,
        ...newKeys,
      ];
      await this.saveSettings();
      this.display();
    };

    const setting = new Setting(this.containerEl)
      .setName('Ignore these properties')
      .setDesc(
        'Editing these properties will not update the date. ' +
          'You can add several at once, separated by commas. ' +
          'The created, updated, and viewed properties are always ignored automatically.',
      )
      .addText((text) => {
        text.inputEl.addClass('frontmatter-date-manager-exclude-input');
        text.setPlaceholder('Property name like tags');
        text.onChange((value) => {
          inputValue = value;
        });
        text.inputEl.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter') {
            evt.preventDefault();
            void addKeys();
          }
        });
      })
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-exclude-add');
        cb.setIcon('plus');
        cb.setTooltip('Add property');
        cb.onClick(() => {
          void addKeys();
        });
      });
    setting.settingEl.addClass('frontmatter-date-manager-nested-setting');

    if (currentList.length > 0) {
      const chips = this.containerEl.createDiv({
        cls: 'frontmatter-date-manager-property-chips',
      });
      currentList.forEach((entry) => {
        const chip = chips.createSpan({
          cls: 'frontmatter-date-manager-property-chip',
        });
        chip.createSpan({
          cls: 'frontmatter-date-manager-property-chip-label',
          text: entry,
        });
        const remove = chip.createSpan({
          cls: 'frontmatter-date-manager-property-chip-remove',
          attr: {
            'role': 'button',
            'tabindex': '0',
            'aria-label': `Remove ${entry}`,
          },
        });
        setIcon(remove, 'x');
        const triggerRemove = () => {
          void this.removeExcludeKey(entry);
        };
        remove.addEventListener('click', triggerRemove);
        remove.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            triggerRemove();
          }
        });
      });
    }
  }

  private async removeExcludeKey(entry: string): Promise<void> {
    const list = this.plugin.settings.frontmatterHashExcludeKeys ?? [];
    this.plugin.settings.frontmatterHashExcludeKeys = list.filter(
      (v) => v !== entry,
    );
    await this.saveSettings();
    this.display();
  }

  // --- Advanced (rendered into a custom container) ---

  addDelayForNewFiles(parent: HTMLElement): void {
    new Setting(parent)
      .setName('New file delay')
      .setDesc(
        'Wait this many milliseconds before stamping a date on a newly created note. Helps avoid conflicts with template plugins. Set to 0 to turn off.',
      )
      .addText((text) =>
        text
          .setPlaceholder('5000')
          .setValue(String(this.plugin.settings.delayForNewFiles))
          .onChange(async (value) => {
            this.plugin.settings.delayForNewFiles = parseInt(value) || 0;
            await this.saveSettings();
          }),
      );
  }

  addAutoPopulateCache(parent: HTMLElement): void {
    new Setting(parent)
      .setName('Auto-populate cache on startup')
      .setDesc(
        'When the plugin loads, build change-detection data for notes that do not have it yet. Runs in the background.',
      )
      .addToggle((cb) =>
        cb
          .setValue(this.plugin.settings.enableAutoPopulateCache ?? false)
          .onChange(async (newValue) => {
            this.plugin.settings.enableAutoPopulateCache = newValue;
            await this.saveSettings();
          }),
      );
  }

  addMaxCacheEntries(parent: HTMLElement): void {
    new Setting(parent)
      .setName('Maximum cache entries')
      .setDesc(
        'When the cache grows past this limit, the oldest unused entries are removed. 0 = no limit.',
      )
      .addText((text) =>
        text
          .setPlaceholder('10000')
          .setValue(String(this.plugin.settings.hashCacheMaxSize ?? 10_000))
          .onChange(async (value) => {
            this.plugin.settings.hashCacheMaxSize = parseInt(value) || 10_000;
            await this.saveSettings();
          }),
      );
  }

  addPostUpdateCommand(parent: HTMLElement): void {
    new Setting(parent)
      .setName('Command after update')
      .setDesc(
        'Run an Obsidian command after a date is updated. Leave empty to turn off.',
      )
      .addDropdown((dropdown) => {
        dropdown.addOption('', 'None');
        // Obsidian internal API - no public typings available
        const internalApp = this.app as unknown as {
          commands: { commands: Record<string, { name: string }> };
        };
        const commands = internalApp.commands.commands;
        for (const [id, cmd] of Object.entries(commands)) {
          dropdown.addOption(id, cmd.name);
        }
        dropdown.setValue(this.plugin.settings.postUpdateCommand);
        dropdown.onChange(async (value) => {
          this.plugin.settings.postUpdateCommand = value;
          await this.saveSettings();
        });
      });
  }

  // --- Inversion handling ---

  private addInversionStrategy(): void {
    new Setting(this.containerEl)
      .setName('How to fix out-of-order dates')
      .setDesc(
        'What to do when the last-edited date is earlier than the creation date. ' +
          'Applies to automatic edits, and sets the default for the bulk tool.',
      )
      .addDropdown((dd) => {
        dd.addOption('disabled', "Don't fix (detect only)");
        dd.addOption(
          'created-to-updated',
          'Set creation date to the last-edited date',
        );
        dd.addOption(
          'updated-to-created',
          'Set last-edited date to the creation date',
        );
        dd.addOption('max-all', 'Set both to the most recent date');
        dd.setValue(this.plugin.settings.inversionFixStrategy ?? 'disabled');
        dd.onChange(async (value) => {
          this.plugin.settings.inversionFixStrategy =
            value as InversionFixStrategy;
          await this.saveSettings();
        });
      });
  }

  private addInversionTolerance(): void {
    new Setting(this.containerEl)
      .setName('Ignore tiny differences (seconds)')
      .setDesc(
        'Ignore out-of-order dates when the gap is smaller than this. A small value hides tiny clock differences.',
      )
      .addText((text) =>
        text
          .setPlaceholder('0')
          .setValue(String(this.plugin.settings.inversionToleranceSec ?? 0))
          .onChange(async (value) => {
            const parsed = parseInt(value, 10);
            this.plugin.settings.inversionToleranceSec = Number.isFinite(parsed)
              ? Math.max(0, parsed)
              : 0;
            await this.saveSettings();
          }),
      );
  }

  private addFindInversionsButton(): void {
    new Setting(this.containerEl)
      .setName('Find out-of-order dates')
      .setDesc(
        'Scan your notes and list ones where the last-edited date is earlier than the creation date. You can then apply the fix you chose above.',
      )
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-inversions');
        cb.setButtonText('Find out-of-order dates').onClick(() => {
          new FindInversionsModal(this.app, this.plugin).open();
        });
      });
  }

  // --- Helpers ---

  createDateFormatEditor({
    description,
    name,
    getValue,
    setValue,
  }: DateFormatArgs) {
    const createDoc = () => {
      const descr = createFragment();
      const tzOptions = this.plugin.settings.timezone
        ? { in: tz(this.plugin.settings.timezone) }
        : {};
      let preview: string;
      try {
        preview = `Currently: ${format(new Date(), getValue(), tzOptions)}`;
      } catch {
        const hint = getMomentFormatHint(getValue());
        preview = hint
          ? `Invalid format. ${hint}`
          : 'Invalid date format string.';
      }
      descr.append(
        description,
        descr.createEl('br'),
        descr.createEl('a', {
          href: 'https://date-fns.org/v4.1.0/docs/format',
          text: 'See available format codes',
        }),
        descr.createEl('br'),
        preview,
        descr.createEl('br'),
        `Obsidian default: yyyy-MM-dd'T'HH:mm:ss (date and time, local timezone)`,
      );
      return descr;
    };
    const dformat = new Setting(this.containerEl)
      .setName(name)
      .setDesc(createDoc())
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.dateFormat)
          .setValue(getValue())
          .onChange(async (value) => {
            setValue(value);
            dformat.setDesc(createDoc());
            await this.saveSettings();
          }),
      );
  }
}

type DateFormatArgs = {
  getValue: () => string;
  setValue: (newValue: string) => void;
  name: string;
  description: string;
};

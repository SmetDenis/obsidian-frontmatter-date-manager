import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { TimezoneSuggest } from './suggesters/TimezoneSuggest';
import { getMomentFormatHint, onlyUniqueArray } from './utils';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { UpdateAllModal } from './UpdateAllModal';
import { UpdateAllCacheData } from './UpdateAllCacheData';
import { BulkPopulateTimestampsModal } from './BulkPopulateTimestampsModal';
import { RenameKeyModal } from './RenameKeyModal';
import { ReformatDateModal } from './ReformatDateModal';
import { parseFilterRules, isFileExcluded } from './filterRules';

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

  enableContentHashCheck?: boolean;
  hashTrackingMode?: HashTrackingMode;
  frontmatterHashExcludeKeys?: string[];
  enableAutoPopulateCache?: boolean;
  hashCacheMaxSize?: number;
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
  enableContentHashCheck: true,
  hashTrackingMode: 'body',
  frontmatterHashExcludeKeys: [],
  enableAutoPopulateCache: true,
  hashCacheMaxSize: 10_000,
};

export class FrontmatterDateManagerSettingsTab extends PluginSettingTab {
  plugin: FrontmatterDateManagerPlugin;
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
      text: 'Sync services, backup tools, and other plugins often rewrite files without changing their content — resetting filesystem dates in the process. This makes it impossible to tell when you actually last edited a note.',
    });
    descEl.createEl('p', {
      text: 'This plugin writes created/updated timestamps directly into frontmatter and uses content hashing to detect real changes, so your dates reflect actual edits — not sync artifacts.',
    });

    // --- Section 1: Timestamp fields ---
    new Setting(containerEl).setHeading().setName('Timestamp fields');

    this.addEnableCreated();
    this.addFrontMatterCreated();
    this.addEnableModifiedTime();
    this.addFrontMatterUpdated();

    const modifiedEnabled = this.plugin.settings.enableModifiedTime ?? true;

    if (!this.plugin.settings.enableCreateTime && !modifiedEnabled) {
      containerEl.createEl('div', {
        cls: 'frontmatter-date-manager-hint-message',
        text: 'Enable at least one timestamp type above to configure the plugin.',
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
      .setName('Populate from filesystem')
      .setDesc(
        'Set created/updated dates in frontmatter using filesystem timestamps (ctime/mtime). Useful for first-time setup.',
      )
      .addButton((cb) => {
        cb.setButtonText('Populate timestamps').onClick(() => {
          new BulkPopulateTimestampsModal(this.app, this.plugin).open();
        });
      });

    this.addRenameKeyButton();
    this.addReformatDateButton();

    if (this.plugin.settings.enableContentHashCheck ?? true) {
      new Setting(this.containerEl)
        .setName('Rebuild hash cache')
        .setDesc(
          'Recompute content hashes for all eligible files. Useful after changing tracking mode.',
        )
        .addButton((cb) => {
          cb.setButtonText('Rebuild cache').onClick(() => {
            new UpdateAllCacheData(this.app, this.plugin).open();
          });
        });
    }

    if (this.plugin.settings.enableModifiedTime ?? true) {
      new Setting(this.containerEl)
        .setName('Overwrite all timestamps')
        .setDesc(
          'Replaces the "updated" timestamp on ALL eligible files with the current date/time. ' +
            'Original timestamps will be lost. Irreversible without a backup.',
        )
        .addButton((cb) => {
          cb.setButtonText('Overwrite all timestamps')
            .setWarning()
            .onClick(() => {
              new UpdateAllModal(this.app, this.plugin).open();
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
      .setName("Track 'updated' timestamp")
      .setDesc('Write an updated timestamp to frontmatter on each save.')
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
      .setName('Updated key')
      .setDesc('Frontmatter key name for the last-modified date.')
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
      .setName('Rename frontmatter key')
      .setDesc(
        'Move values from an old key name to a new one across all files. ' +
          'Useful after changing the created or updated key name above.',
      )
      .addButton((cb) => {
        cb.setButtonText('Rename key').onClick(() => {
          new RenameKeyModal(this.app, this.plugin).open();
        });
      });
  }

  addEnableCreated(): void {
    new Setting(this.containerEl)
      .setName("Track 'created' timestamp")
      .setDesc("Add a creation timestamp to files that don't already have one.")
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
      .setName('Created key')
      .setDesc('Frontmatter key name for the creation date.')
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

  // --- Date formatting ---

  addDateFormat(): void {
    this.createDateFormatEditor({
      getValue: () => this.plugin.settings.dateFormat,
      name: 'Date format',
      description: 'Format string for reading and writing dates',
      setValue: (newValue) => (this.plugin.settings.dateFormat = newValue),
    });
  }

  private addReformatDateButton(): void {
    new Setting(this.containerEl)
      .setName('Reformat existing dates')
      .setDesc(
        'Parse dates written in an old format and rewrite them using the current format. ' +
          'Useful after changing the date format above.',
      )
      .addButton((cb) => {
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
        `Timezone for formatting dates. Leave blank to use system timezone (${localTz}).`,
      )
      .addText((text) => {
        new TimezoneSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(`Local (${localTz})`)
          .setValue(this.plugin.settings.timezone)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              try {
                Intl.DateTimeFormat(undefined, { timeZone: trimmed });
              } catch {
                return; // Invalid timezone — don't save
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
      .setName('Store numeric timestamps without quotes')
      .setDesc(
        'When the date format produces only digits (e.g. Unix timestamp "t"), write the value as a YAML number (updated: 1712930400) instead of a quoted string (updated: "1712930400"). Has no effect if your format contains non-digit characters like dashes or colons.',
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
        'Automatically update timestamps when files are modified. Also available via command palette.',
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
    if (!(this.plugin.settings.enableModifiedTime ?? true)) {
      return;
    }
    new Setting(this.containerEl)
      .setName('Minimum seconds between updates')
      .setDesc('Prevent frequent updates during rapid editing.')
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
    const descr = document.createDocumentFragment();
    descr.append(
      'Exclude files or folders from automatic timestamp updates. ',
      'Each line is a pattern. Lines starting with ',
    );
    descr.createEl('code', { text: '#' });
    descr.append(' are comments. Prefix with ');
    descr.createEl('code', { text: '!' });
    descr.append(
      ' to re-include a previously excluded path. ',
      'When multiple rules match, the last one wins.',
    );
    descr.createEl('br');
    descr.createEl('a', {
      href: 'https://git-scm.com/docs/gitignore',
      text: 'Advanced syntax reference (gitignore)',
    });

    const setting = new Setting(this.containerEl)
      .setName('File filter rules')
      .setDesc(descr);
    setting.settingEl.addClass('frontmatter-date-manager-filter-setting');

    const warnEl = this.containerEl.createEl('div', {
      cls: 'frontmatter-date-manager-filter-warn',
      text: 'No filter rules — timestamps will be updated for all .md files.',
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
            text: `Line ${err.lineNumber}: ${err.message} — "${err.text.trim()}"`,
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
          text: `${tracked.length} files tracked, ${excluded.length} files excluded`,
          cls: 'frontmatter-date-manager-filter-preview-summary',
        });

        if (excluded.length > 0) {
          const details = previewEl.createEl('details');
          details.createEl('summary', {
            text: `Excluded files (${excluded.length})`,
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
      ['templates/', 'Exclude — files inside templates/ are skipped'],
      ['!templates/keep.md', 'Re-include — prefix with ! to undo exclusion'],
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
      'When this field is empty, timestamps are updated for all Markdown (.md) files.',
    );
  }

  addContentHashToggle(): void {
    const hashEnabled = this.plugin.settings.enableContentHashCheck ?? true;

    new Setting(this.containerEl)
      .setName('Change detection (content hashing)')
      .setDesc(
        hashEnabled
          ? 'The "updated" timestamp is written only when file content actually changes. Prevents false updates from sync plugins.'
          : 'Disabled — the "updated" timestamp is written on every save, even if nothing changed.',
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
      .setName('Tracking mode')
      .setDesc(
        'Which parts of the file count as a "change" for updating the timestamp. ' +
          '"Body only" — editing frontmatter (tags, aliases, etc.) will not update the timestamp. ' +
          '"Frontmatter only" — editing the note body will not update the timestamp. ' +
          '"Both" — any edit updates the timestamp.',
      )
      .addDropdown((dropdown) => {
        dropdown.addOption('body', 'Body only (default)');
        dropdown.addOption('frontmatter', 'Frontmatter only');
        dropdown.addOption('both', 'Both body and frontmatter');
        dropdown.setValue(this.plugin.settings.hashTrackingMode ?? 'body');
        dropdown.onChange(async (value) => {
          this.plugin.settings.hashTrackingMode = value as HashTrackingMode;
          await this.saveSettings();
          new Notice(
            'Hash mode changed. Rebuild the hash cache to avoid false updates.',
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

    const setting = new Setting(this.containerEl)
      .setName('Ignore frontmatter keys')
      .setDesc(
        'Changes to these keys will not trigger a timestamp update. ' +
          'The created/updated keys are always ignored automatically.',
      )
      .addText((text) => {
        text.setPlaceholder('Aliases, tags, cssclasses');
        text.onChange((value) => {
          inputValue = value;
        });
      })
      .addButton((cb) => {
        cb.setIcon('plus');
        cb.setTooltip('Add key');
        cb.onClick(async () => {
          const newKey = inputValue.trim();
          if (!newKey) return;
          this.plugin.settings.frontmatterHashExcludeKeys = [
            ...currentList,
            newKey,
          ].filter(onlyUniqueArray);
          await this.saveSettings();
          this.display();
        });
      });
    setting.settingEl.addClass('frontmatter-date-manager-nested-setting');

    currentList.forEach((entry) => {
      const entrySetting = new Setting(this.containerEl)
        .setName(entry)
        .addButton((button) =>
          button.setButtonText('Remove').onClick(async () => {
            this.plugin.settings.frontmatterHashExcludeKeys =
              currentList.filter((v) => v !== entry);
            await this.saveSettings();
            this.display();
          }),
        );
      entrySetting.settingEl.addClass(
        'frontmatter-date-manager-nested-setting',
      );
    });
  }

  // --- Advanced (rendered into a custom container) ---

  addDelayForNewFiles(parent: HTMLElement): void {
    new Setting(parent)
      .setName('New file delay')
      .setDesc(
        'Wait this many milliseconds before processing newly created files. Helps avoid conflicts with template plugins. Set to 0 to disable.',
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
        'Automatically hash uncached files when the plugin loads. Runs in the background.',
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
        'Oldest unused entries are evicted when cache exceeds this limit. 0 = unlimited.',
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
        'Run an Obsidian command after timestamps are updated. Leave empty to disable.',
      )
      .addDropdown((dropdown) => {
        dropdown.addOption('', 'None');
        // Obsidian internal API — no public typings available
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

  // --- Helpers ---

  createDateFormatEditor({
    description,
    name,
    getValue,
    setValue,
  }: DateFormatArgs) {
    const createDoc = () => {
      const descr = document.createDocumentFragment();
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
        'Check ',
        descr.createEl('a', {
          href: 'https://date-fns.org/v4.1.0/docs/format',
          text: 'Date-fns documentation',
        }),
        descr.createEl('br'),
        preview,
        descr.createEl('br'),
        `Obsidian default: yyyy-MM-dd'T'HH:mm:ss (ISO 8601, second resolution, local time)`,
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

import { App, Notice, PluginSettingTab, Setting, setIcon } from 'obsidian';
import FrontmatterDateManagerPlugin from './main';
import { TimezoneSuggest } from './suggesters/TimezoneSuggest';
import {
  getMomentFormatHint,
  parseCacheMaxSize,
  parsePropertyKeys,
} from './utils';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { UpdateAllCacheData } from './UpdateAllCacheData';
import { BulkPopulateTimestampsModal } from './BulkPopulateTimestampsModal';
import { RenameKeyModal } from './RenameKeyModal';
import { ReformatDateModal } from './ReformatDateModal';
import { FindInversionsModal } from './FindInversionsModal';
import { parseFilterRules, isFileExcluded } from './filterRules';
import { InversionFixStrategy } from './inversionDetection';
import { strings, format as t } from './i18n';

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

  countUpdatesEnabled?: boolean;
  headerUpdateCount?: string;

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
  countUpdatesEnabled: false,
  headerUpdateCount: 'updated_count',
  enableContentHashCheck: true,
  hashTrackingMode: 'body',
  frontmatterHashExcludeKeys: [],
  enableAutoPopulateCache: true,
  hashCacheMaxSize: 10_000,
  inversionFixStrategy: 'disabled',
  inversionToleranceSec: 0,
};

// Validate externally-loaded settings against DEFAULT_SETTINGS types. data.json
// can be hand-edited or rewritten by a sync/backup tool, so a field may arrive
// with the wrong type. Each wrong-typed known field is replaced with its default
// so it can never reach code that asserts a type (.trim(), for...of, date-fns)
// and crash onload or file processing. Unknown keys are preserved for forward
// compatibility. This mirrors the runtime type-validation already done for the
// equally-external hash-cache.json in loadHashCache.
export function sanitizeSettings(raw: unknown): FrontmatterDateManagerSettings {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_SETTINGS };
  }

  const input = raw as Record<string, unknown>;
  // Preserve unknown keys, then overwrite every known field with a valid value.
  const result: Record<string, unknown> = { ...DEFAULT_SETTINGS, ...input };

  // Primitive fields (string / number / boolean): the runtime type must match
  // the default's. Numbers must also be finite. Arrays are handled separately.
  for (const key of Object.keys(
    DEFAULT_SETTINGS,
  ) as (keyof FrontmatterDateManagerSettings)[]) {
    const def = DEFAULT_SETTINGS[key];
    if (Array.isArray(def)) continue;
    const val = input[key];
    const typeMatches = typeof val === typeof def;
    const finiteIfNumber =
      typeof def !== 'number' ||
      (typeof val === 'number' && Number.isFinite(val));
    if (!typeMatches || !finiteIfNumber) {
      result[key] = def;
    }
  }

  // String-array field: keep only string elements; anything else -> default [].
  // A plain typeof check is not enough here ([] and {} are both 'object'), so a
  // non-array (or array of non-strings) must be coerced explicitly.
  result.frontmatterHashExcludeKeys = Array.isArray(
    input.frontmatterHashExcludeKeys,
  )
    ? input.frontmatterHashExcludeKeys.filter(
        (k): k is string => typeof k === 'string',
      )
    : [...(DEFAULT_SETTINGS.frontmatterHashExcludeKeys ?? [])];

  // Enum fields: a string of the wrong value passes the typeof check above, so
  // membership in the allowed set must be verified explicitly.
  const hashModes: HashTrackingMode[] = ['body', 'frontmatter', 'both'];
  if (!hashModes.includes(result.hashTrackingMode as HashTrackingMode)) {
    result.hashTrackingMode = DEFAULT_SETTINGS.hashTrackingMode;
  }

  const strategies: InversionFixStrategy[] = [
    'disabled',
    'created-to-updated',
    'updated-to-created',
    'max-all',
  ];
  if (
    !strategies.includes(result.inversionFixStrategy as InversionFixStrategy)
  ) {
    result.inversionFixStrategy = DEFAULT_SETTINGS.inversionFixStrategy;
  }

  // Cast to the settings shape for the remaining checks: every field read below
  // was already type-coerced by the loop above, so they read as their declared
  // types here. `sanitized` is the same object reference as `result`.
  const sanitized = result as unknown as FrontmatterDateManagerSettings;

  // The edit-activity counter name must be a non-empty string: '' passes the
  // generic typeof-string check above, so reset it explicitly (an empty key
  // would write a '' property; data.json can also set it blank directly).
  if (
    typeof sanitized.headerUpdateCount !== 'string' ||
    sanitized.headerUpdateCount.trim() === ''
  ) {
    sanitized.headerUpdateCount = DEFAULT_SETTINGS.headerUpdateCount;
  }

  // Name-collision guard: the counter and a date property cannot share a key, or
  // they would clobber each other in a single processFrontMatter write. On
  // collision, DISABLE the counter (never reset the name to the default, which
  // could itself collide and silently reintroduce the clash). Compare against ALL
  // three date-key names UNCONDITIONALLY (not just the enabled ones), so this stays
  // symmetric with the write-boundary guard `counterKeyOrNull()` in main.ts. An
  // enabled-only check here would leave the counter enabled in settings while
  // `counterKeyOrNull` silently rejects the same name - a confusing inert toggle.
  // It also covers the cases where a "disabled" date key still gets written: the
  // inversion fix can stamp `created`/`updated` even when their toggle is off, and
  // last-viewed can be re-enabled later.
  const counterName = (sanitized.headerUpdateCount ?? '').trim();
  const dateKeys = [
    sanitized.headerCreated.trim(),
    sanitized.headerUpdated.trim(),
    (sanitized.headerLastViewed ?? 'viewed').trim(),
  ];
  if (
    sanitized.countUpdatesEnabled === true &&
    dateKeys.includes(counterName)
  ) {
    sanitized.countUpdatesEnabled = false;
  }

  return sanitized;
}

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
      text: strings.settings.description.syncIntro,
    });
    descEl.createEl('p', {
      text: strings.settings.description.pluginIntro,
    });

    // --- Section 1: Timestamp fields ---
    new Setting(containerEl)
      .setHeading()
      .setName(strings.settings.dates.heading);

    this.addEnableCreated();
    this.addFrontMatterCreated();
    this.addEnableModifiedTime();
    this.addFrontMatterUpdated();
    this.addEnableUpdateCount();
    this.addFrontMatterUpdateCount();
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
        text: strings.settings.dates.enableNoneHint,
      });
      return;
    }

    // --- Section 2: Date formatting ---
    new Setting(containerEl)
      .setHeading()
      .setName(strings.settings.formatting.heading);

    this.addDateFormat();
    this.addTimezone();
    this.addEnableNumberProperties();

    // --- Section 3: Behavior ---
    new Setting(containerEl)
      .setHeading()
      .setName(strings.settings.behavior.heading);

    this.addEnableAutoUpdate();
    this.addTimeBetweenUpdates();
    this.addFilterRulesSetting();
    this.addContentHashToggle();

    // --- Section: Timestamp inversion ---
    new Setting(containerEl)
      .setHeading()
      .setName(strings.settings.inversions.heading);
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
    advancedDetails.createEl('summary', {
      text: strings.settings.advanced.summary,
    });

    this.addDelayForNewFiles(advancedDetails);
    this.addAutoPopulateCache(advancedDetails);
    this.addMaxCacheEntries(advancedDetails);
    this.addPostUpdateCommand(advancedDetails);

    // --- Section 4: Bulk operations ---
    new Setting(containerEl)
      .setHeading()
      .setName(strings.settings.bulk.heading);

    new Setting(this.containerEl)
      .setName(strings.settings.bulk.populate.name)
      .setDesc(strings.settings.bulk.populate.desc)
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-populate');
        cb.setButtonText(strings.settings.bulk.populate.button).onClick(() => {
          new BulkPopulateTimestampsModal(this.app, this.plugin).open();
        });
      });

    this.addRenameKeyButton();
    this.addReformatDateButton();
    this.addFindInversionsButton();

    if (this.plugin.settings.enableContentHashCheck ?? true) {
      new Setting(this.containerEl)
        .setName(strings.settings.bulk.rebuildCache.name)
        .setDesc(strings.settings.bulk.rebuildCache.desc)
        .addButton((cb) => {
          cb.buttonEl.addClass('frontmatter-date-manager-open-rebuild-cache');
          cb.setButtonText(strings.settings.bulk.rebuildCache.button).onClick(
            () => {
              new UpdateAllCacheData(this.app, this.plugin).open();
            },
          );
        });
    }
  }

  async saveSettings() {
    await this.plugin.saveSettings();
  }

  // --- Timestamp fields ---

  addEnableModifiedTime(): void {
    new Setting(this.containerEl)
      .setName(strings.settings.dates.updated.enableName)
      .setDesc(strings.settings.dates.updated.enableDesc)
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
      .setName(strings.settings.dates.updated.propertyName)
      .setDesc(strings.settings.dates.updated.propertyDesc)
      .addText((text) =>
        text
          .setPlaceholder(strings.settings.dates.updated.propertyPlaceholder)
          .setValue(this.plugin.settings.headerUpdated)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) return;
            this.plugin.settings.headerUpdated = trimmed;
            await this.saveSettings();
          }),
      );
  }

  addEnableUpdateCount(): void {
    if (!(this.plugin.settings.enableModifiedTime ?? true)) {
      return;
    }
    new Setting(this.containerEl)
      .setName(strings.settings.dates.updateCount.enableName)
      .setDesc(strings.settings.dates.updateCount.enableDesc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.countUpdatesEnabled ?? false)
          .onChange(async (newValue) => {
            this.plugin.settings.countUpdatesEnabled = newValue;
            await this.saveSettings();
            this.display();
          }),
      );
  }

  addFrontMatterUpdateCount(): void {
    if (!(this.plugin.settings.enableModifiedTime ?? true)) {
      return;
    }
    if (!(this.plugin.settings.countUpdatesEnabled ?? false)) {
      return;
    }
    new Setting(this.containerEl)
      .setName(strings.settings.dates.updateCount.propertyName)
      .setDesc(strings.settings.dates.updateCount.propertyDesc)
      .addText((text) =>
        text
          .setValue(this.plugin.settings.headerUpdateCount ?? 'updated_count')
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length === 0) return;
            this.plugin.settings.headerUpdateCount = trimmed;
            await this.saveSettings();
          }),
      );
  }

  private addRenameKeyButton(): void {
    new Setting(this.containerEl)
      .setName(strings.settings.bulk.rename.name)
      .setDesc(strings.settings.bulk.rename.desc)
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-rename');
        cb.setButtonText(strings.settings.bulk.rename.button).onClick(() => {
          new RenameKeyModal(this.app, this.plugin).open();
        });
      });
  }

  addEnableCreated(): void {
    new Setting(this.containerEl)
      .setName(strings.settings.dates.created.enableName)
      .setDesc(strings.settings.dates.created.enableDesc)
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
      .setName(strings.settings.dates.created.propertyName)
      .setDesc(strings.settings.dates.created.propertyDesc)
      .addText((text) =>
        text
          .setPlaceholder(strings.settings.dates.created.propertyPlaceholder)
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
      .setName(strings.settings.dates.viewed.enableName)
      .setDesc(strings.settings.dates.viewed.enableDesc)
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
      .setName(strings.settings.dates.viewed.propertyName)
      .setDesc(strings.settings.dates.viewed.propertyDesc)
      .addText((text) =>
        text
          .setPlaceholder(strings.settings.dates.viewed.propertyPlaceholder)
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
      name: strings.settings.formatting.dateFormat.name,
      description: strings.settings.formatting.dateFormat.desc,
      setValue: (newValue) => (this.plugin.settings.dateFormat = newValue),
    });
  }

  private addReformatDateButton(): void {
    new Setting(this.containerEl)
      .setName(strings.settings.bulk.reformat.name)
      .setDesc(strings.settings.bulk.reformat.desc)
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-reformat');
        cb.setButtonText(strings.settings.bulk.reformat.button).onClick(() => {
          new ReformatDateModal(this.app, this.plugin).open();
        });
      });
  }

  addTimezone(): void {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    new Setting(this.containerEl)
      .setName(strings.settings.formatting.timezone.name)
      .setDesc(t(strings.settings.formatting.timezone.desc, { localTz }))
      .addText((text) => {
        new TimezoneSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(
            t(strings.settings.formatting.timezone.placeholder, { localTz }),
          )
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
          .setTooltip(strings.settings.formatting.timezone.resetTooltip)
          .onClick(async () => {
            this.plugin.settings.timezone = '';
            await this.saveSettings();
            this.display();
          });
      });
  }

  addEnableNumberProperties(): void {
    new Setting(this.containerEl)
      .setName(strings.settings.formatting.numberProperties.name)
      .setDesc(strings.settings.formatting.numberProperties.desc)
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
      .setName(strings.settings.behavior.autoUpdate.name)
      .setDesc(strings.settings.behavior.autoUpdate.desc)
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
      .setName(strings.settings.behavior.minSeconds.name)
      .setDesc(strings.settings.behavior.minSeconds.desc)
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
      strings.settings.filterRules.descIntro,
      strings.settings.filterRules.descOnePerLine,
    );
    descr.createEl('code', { text: '#' });
    descr.append(strings.settings.filterRules.descCommentsAre);
    descr.createEl('code', { text: '!' });
    descr.append(
      strings.settings.filterRules.descAddBack,
      strings.settings.filterRules.descLastWins,
    );
    descr.createEl('br');
    descr.createEl('a', {
      href: 'https://git-scm.com/docs/gitignore',
      text: strings.settings.filterRules.advancedSyntaxLink,
    });

    const setting = new Setting(this.containerEl)
      .setName(strings.settings.filterRules.name)
      .setDesc(descr);
    setting.settingEl.addClass('frontmatter-date-manager-filter-setting');

    const warnEl = this.containerEl.createEl('div', {
      cls: 'frontmatter-date-manager-filter-warn',
      text: strings.settings.filterRules.noRulesWarning,
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
            text: t(strings.settings.filterRules.parseError, {
              lineNumber: err.lineNumber,
              message: err.message,
              text: err.text.trim(),
            }),
          });
        }
      }
    };

    setting.addTextArea((textArea) => {
      textArea.inputEl.addClass('frontmatter-date-manager-filter-textarea');
      textArea.inputEl.rows = 10;
      textArea.inputEl.placeholder = [
        strings.settings.filterRules.placeholderExcludeFolder,
        'templates/',
        '',
        strings.settings.filterRules.placeholderExcludeByPattern,
        'daily/**/*.md',
        '',
        strings.settings.filterRules.placeholderReinclude,
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
      btn.setButtonText(strings.settings.filterRules.previewButton);
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
          text: t(strings.settings.filterRules.previewSummary, {
            tracked: tracked.length,
            excluded: excluded.length,
          }),
          cls: 'frontmatter-date-manager-filter-preview-summary',
        });

        if (excluded.length > 0) {
          const details = previewEl.createEl('details');
          details.createEl('summary', {
            text: t(strings.settings.filterRules.skippedFilesSummary, {
              excluded: excluded.length,
            }),
          });
          const list = details.createEl('ul');
          const limit = Math.min(excluded.length, 50);
          for (let i = 0; i < limit; i++) {
            list.createEl('li', { text: excluded[i] });
          }
          if (excluded.length > 50) {
            list.createEl('li', {
              text: t(strings.settings.filterRules.skippedMore, {
                count: excluded.length - 50,
              }),
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
    refEl.createEl('summary', {
      text: strings.settings.filterRules.reference.summary,
    });

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

    const ref = strings.settings.filterRules.reference;

    addSection(ref.sectionBasics, [
      ['# comment', ref.basicsCommentDesc],
      ['', ref.basicsBlankDesc],
      ['templates/', ref.basicsExcludeDesc],
      ['!templates/keep.md', ref.basicsReincludeDesc],
      ['', ref.basicsLastWinsDesc],
    ]);

    addSection(ref.sectionExcludeFolder, [
      ['templates/', ref.excludeFolderAllFilesDesc],
      ['templates', ref.excludeFolderSameEffectDesc],
      ['projects/drafts/', ref.excludeFolderNestedDesc],
    ]);

    addSection(ref.sectionReinclude, [
      ['templates/', ref.reincludeExcludeWholeDesc],
      ['!templates/keep.md', ref.reincludeKeepDesc],
    ]);

    addSection(ref.sectionWildcards, [
      ['*', ref.wildcardStarDesc],
      ['**', ref.wildcardDoubleStarDesc],
      ['?', ref.wildcardQuestionDesc],
    ]);

    addSection(ref.sectionWildcardExamples, [
      ['*.canvas.md', ref.wildcardExCanvasRootDesc],
      ['**/*.canvas.md', ref.wildcardExCanvasAnyDesc],
      ['daily/2024-*.md', ref.wildcardExDailyDesc],
      ['notes/??.md', ref.wildcardExTwoCharDesc],
    ]);

    addSection(ref.sectionSpecificFiles, [
      ['inbox/scratch.md', ref.specificFilesOneExactDesc],
      ['README.md', ref.specificFilesRootDesc],
    ]);

    addSection(ref.sectionPathsWithSpaces, [
      ['My Folder/My Notes/', ref.pathsWithSpacesAsIsDesc],
      ['Work in Progress/', ref.pathsWithSpacesNoQuotesDesc],
    ]);

    addSection(ref.sectionNonLatin, [
      ['notes/Заметки/', ref.nonLatinCyrillicDesc],
      ['projects/日记/', ref.nonLatinChineseDesc],
      ['Записки/черновики.md', ref.nonLatinFullPathDesc],
    ]);

    addSection(ref.sectionObsidianExamples, [
      ['templates/', ref.obsidianTemplateFolderDesc],
      ['daily/', ref.obsidianDailyFolderDesc],
      ['attachments/', ref.obsidianAttachmentsDesc],
      ['**/*.canvas.md', ref.obsidianCanvasDesc],
      ['**/*.excalidraw.md', ref.obsidianExcalidrawDesc],
      ['inbox/', ref.obsidianInboxDesc],
      ['archive/', ref.obsidianArchiveDesc],
    ]);

    addSection(ref.sectionAllowlist, [
      ['**', ref.allowlistExcludeEverythingDesc],
      ['!projects/', ref.allowlistReincludeWantedDesc],
      ['!notes/', ref.allowlistReincludeAnotherDesc],
    ]);

    const noteEl = refEl.createEl('p', {
      cls: 'frontmatter-date-manager-ref-note',
    });
    noteEl.append(ref.emptyNote);
  }

  addContentHashToggle(): void {
    const hashEnabled = this.plugin.settings.enableContentHashCheck ?? true;

    new Setting(this.containerEl)
      .setName(strings.settings.behavior.changeDetection.name)
      .setDesc(
        hashEnabled
          ? strings.settings.behavior.changeDetection.descEnabled
          : strings.settings.behavior.changeDetection.descDisabled,
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
      .setName(strings.settings.behavior.hashTrackingMode.name)
      .setDesc(strings.settings.behavior.hashTrackingMode.desc)
      .addDropdown((dropdown) => {
        dropdown.addOption(
          'body',
          strings.settings.behavior.hashTrackingMode.optionBody,
        );
        dropdown.addOption(
          'frontmatter',
          strings.settings.behavior.hashTrackingMode.optionFrontmatter,
        );
        dropdown.addOption(
          'both',
          strings.settings.behavior.hashTrackingMode.optionBoth,
        );
        dropdown.setValue(this.plugin.settings.hashTrackingMode ?? 'body');
        dropdown.onChange(async (value) => {
          this.plugin.settings.hashTrackingMode = value as HashTrackingMode;
          await this.saveSettings();
          new Notice(
            strings.settings.behavior.hashTrackingMode.changedNotice,
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
      .setName(strings.settings.behavior.excludeKeys.name)
      .setDesc(strings.settings.behavior.excludeKeys.desc)
      .addText((text) => {
        text.inputEl.addClass('frontmatter-date-manager-exclude-input');
        text.setPlaceholder(strings.settings.behavior.excludeKeys.placeholder);
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
        cb.setTooltip(strings.settings.behavior.excludeKeys.addTooltip);
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
            'aria-label': t(
              strings.settings.behavior.excludeKeys.chipRemoveAriaLabel,
              { entry },
            ),
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
      .setName(strings.settings.advanced.newFileDelay.name)
      .setDesc(strings.settings.advanced.newFileDelay.desc)
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
      .setName(strings.settings.advanced.autoPopulateCache.name)
      .setDesc(strings.settings.advanced.autoPopulateCache.desc)
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
      .setName(strings.settings.advanced.maxCacheEntries.name)
      .setDesc(strings.settings.advanced.maxCacheEntries.desc)
      .addText((text) =>
        text
          .setPlaceholder('10000')
          .setValue(String(this.plugin.settings.hashCacheMaxSize ?? 10_000))
          .onChange(async (value) => {
            this.plugin.settings.hashCacheMaxSize = parseCacheMaxSize(value);
            await this.saveSettings();
          }),
      );
  }

  addPostUpdateCommand(parent: HTMLElement): void {
    new Setting(parent)
      .setName(strings.settings.advanced.postUpdateCommand.name)
      .setDesc(strings.settings.advanced.postUpdateCommand.desc)
      .addDropdown((dropdown) => {
        dropdown.addOption(
          '',
          strings.settings.advanced.postUpdateCommand.optionNone,
        );
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
      .setName(strings.settings.inversions.strategy.name)
      .setDesc(strings.settings.inversions.strategy.desc)
      .addDropdown((dd) => {
        dd.addOption(
          'disabled',
          strings.settings.inversions.strategy.optionDisabled,
        );
        dd.addOption(
          'created-to-updated',
          strings.settings.inversions.strategy.optionCreatedToUpdated,
        );
        dd.addOption(
          'updated-to-created',
          strings.settings.inversions.strategy.optionUpdatedToCreated,
        );
        dd.addOption(
          'max-all',
          strings.settings.inversions.strategy.optionMaxAll,
        );
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
      .setName(strings.settings.inversions.tolerance.name)
      .setDesc(strings.settings.inversions.tolerance.desc)
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
      .setName(strings.settings.bulk.findInversions.name)
      .setDesc(strings.settings.bulk.findInversions.desc)
      .addButton((cb) => {
        cb.buttonEl.addClass('frontmatter-date-manager-open-inversions');
        cb.setButtonText(strings.settings.bulk.findInversions.button).onClick(
          () => {
            new FindInversionsModal(this.app, this.plugin).open();
          },
        );
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
        preview = t(strings.settings.formatting.dateFormat.currentlyPreview, {
          preview: format(new Date(), getValue(), tzOptions),
        });
      } catch {
        const hint = getMomentFormatHint(getValue());
        preview = hint
          ? t(strings.settings.formatting.dateFormat.invalidWithHint, { hint })
          : strings.settings.formatting.dateFormat.invalidFormat;
      }
      descr.append(
        description,
        descr.createEl('br'),
        descr.createEl('a', {
          href: 'https://date-fns.org/v4.1.0/docs/format',
          text: strings.settings.formatting.dateFormat.formatCodesLink,
        }),
        descr.createEl('br'),
        preview,
        descr.createEl('br'),
        strings.settings.formatting.dateFormat.obsidianDefault,
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

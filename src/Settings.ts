import { App, Notice, PluginSettingTab } from 'obsidian';
import type {
  Setting,
  SettingDefinitionItem,
  SettingGroupItem,
} from 'obsidian';
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

// Settings keys whose values are property names: setControlValue trims them
// before persisting (a name with stray spaces would write a different key).
const TRIMMED_KEYS = new Set([
  'headerCreated',
  'headerUpdated',
  'headerLastViewed',
  'headerUpdateCount',
]);

export class FrontmatterDateManagerSettingsTab extends PluginSettingTab {
  plugin: FrontmatterDateManagerPlugin;

  constructor(app: App, plugin: FrontmatterDateManagerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Declarative settings tree (Obsidian 1.13+). Called on every update() AND
  // once at addSettingTab() registration for search indexing - must stay cheap
  // (no I/O, no DOM). All DOM work lives in the render callbacks, which run
  // only when a row is actually drawn.
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      this.introItem(),
      this.datesGroup(),
      this.noneEnabledHintItem(),
      this.formattingGroup(),
      this.behaviorGroup(),
      // A list cannot nest inside a group (group items are settings/pages
      // only), so the exclude list sits at top level right after Behavior.
      this.excludeKeysList(),
      this.inversionsGroup(),
      this.advancedPage(),
      this.bulkGroup(),
    ];
  }

  // Central write funnel: every control-bound change (and every render row that
  // saves a single key) goes through here. Overriding replaces the framework's
  // auto-save, so this must persist itself; it also dispatches the per-key side
  // effects the old per-onChange wiring performed.
  async setControlValue(key: string, value: unknown): Promise<void> {
    let v = value;
    if (TRIMMED_KEYS.has(key) && typeof v === 'string') {
      v = v.trim();
    }
    (this.plugin.settings as unknown as Record<string, unknown>)[key] = v;
    await this.plugin.saveSettings();
    switch (key) {
      case 'filterRules':
        this.plugin.recompileFilterRules();
        break;
      case 'enableAutoUpdate':
        this.plugin.updateStatusBar();
        break;
      case 'hashTrackingMode':
        new Notice(
          strings.settings.behavior.hashTrackingMode.changedNotice,
          6000,
        );
        break;
    }
  }

  // --- Visibility predicates ---

  private allDatesOff(): boolean {
    const s = this.plugin.settings;
    return (
      !s.enableCreateTime &&
      !(s.enableModifiedTime ?? true) &&
      !(s.enableLastViewed ?? false)
    );
  }

  private excludeKeysVisible(): boolean {
    const s = this.plugin.settings;
    const mode = s.hashTrackingMode ?? 'body';
    return (
      (s.enableContentHashCheck ?? true) &&
      (mode === 'frontmatter' || mode === 'both')
    );
  }

  // --- Input validation (UI gate only - sanitizeSettings stays the load
  // boundary for already-stored data) ---

  private validatePropertyName(value: string): string | undefined {
    return value.trim() === ''
      ? strings.settings.validation.propertyNameRequired
      : undefined;
  }

  // Date-key fields reject the counter's name (mirrors the sanitizeSettings /
  // counterKeyOrNull collision rule, surfaced as an inline error instead of a
  // silent counter disable at next load). Only guards while the counter is
  // enabled - with it off there is nothing to clobber.
  private validateDateKey(value: string): string | undefined {
    const base = this.validatePropertyName(value);
    if (base) return base;
    const s = this.plugin.settings;
    if (
      (s.countUpdatesEnabled ?? false) &&
      value.trim() === (s.headerUpdateCount ?? 'updated_count').trim()
    ) {
      return strings.settings.validation.counterNameCollision;
    }
    return undefined;
  }

  private validateCounterName(value: string): string | undefined {
    const base = this.validatePropertyName(value);
    if (base) return base;
    const s = this.plugin.settings;
    const dateKeys = [
      s.headerCreated.trim(),
      s.headerUpdated.trim(),
      (s.headerLastViewed ?? 'viewed').trim(),
    ];
    return dateKeys.includes(value.trim())
      ? strings.settings.validation.counterNameCollision
      : undefined;
  }

  // --- Tree builders ---

  private introItem(): SettingDefinitionItem {
    return {
      name: '',
      searchable: false,
      render: (setting: Setting) => {
        // The in-place re-render path (update() with the tab open) only
        // clears controlEl - every element created on settingEl must be
        // detached by the returned cleanup, or it duplicates on each update().
        // Applies to ALL render rows below that touch settingEl.
        const descEl = setting.settingEl.createDiv({
          cls: 'frontmatter-date-manager-plugin-description',
        });
        descEl.createEl('p', { text: strings.settings.description.syncIntro });
        descEl.createEl('p', {
          text: strings.settings.description.pluginIntro,
        });
        return () => void descEl.remove();
      },
    };
  }

  // First section carries no heading (style guide: the leading "general"
  // section is unheaded; headings start at the second section).
  private datesGroup(): SettingDefinitionItem {
    const d = strings.settings.dates;
    const s = () => this.plugin.settings;
    const items: SettingGroupItem[] = [
      {
        name: d.created.enableName,
        desc: d.created.enableDesc,
        control: { type: 'toggle', key: 'enableCreateTime' },
      },
      {
        name: d.created.propertyName,
        desc: d.created.propertyDesc,
        visible: () => s().enableCreateTime,
        control: {
          type: 'text',
          key: 'headerCreated',
          placeholder: d.created.propertyPlaceholder,
          validate: (value: string) => this.validateDateKey(value),
        },
      },
      {
        name: d.updated.enableName,
        desc: d.updated.enableDesc,
        control: {
          type: 'toggle',
          key: 'enableModifiedTime',
          defaultValue: true,
        },
      },
      {
        name: d.updated.propertyName,
        desc: d.updated.propertyDesc,
        visible: () => s().enableModifiedTime ?? true,
        control: {
          type: 'text',
          key: 'headerUpdated',
          placeholder: d.updated.propertyPlaceholder,
          validate: (value: string) => this.validateDateKey(value),
        },
      },
      {
        name: d.updateCount.enableName,
        desc: d.updateCount.enableDesc,
        visible: () => s().enableModifiedTime ?? true,
        control: {
          type: 'toggle',
          key: 'countUpdatesEnabled',
          defaultValue: false,
        },
      },
      {
        name: d.updateCount.propertyName,
        desc: d.updateCount.propertyDesc,
        visible: () =>
          (s().enableModifiedTime ?? true) &&
          (s().countUpdatesEnabled ?? false),
        control: {
          type: 'text',
          key: 'headerUpdateCount',
          defaultValue: DEFAULT_SETTINGS.headerUpdateCount,
          validate: (value: string) => this.validateCounterName(value),
        },
      },
      {
        name: d.viewed.enableName,
        desc: d.viewed.enableDesc,
        control: {
          type: 'toggle',
          key: 'enableLastViewed',
          defaultValue: false,
        },
      },
      {
        name: d.viewed.propertyName,
        desc: d.viewed.propertyDesc,
        visible: () => s().enableLastViewed ?? false,
        control: {
          type: 'text',
          key: 'headerLastViewed',
          placeholder: d.viewed.propertyPlaceholder,
          defaultValue: DEFAULT_SETTINGS.headerLastViewed,
          validate: (value: string) => this.validateDateKey(value),
        },
      },
    ];
    return { type: 'group', items };
  }

  private noneEnabledHintItem(): SettingDefinitionItem {
    return {
      name: '',
      searchable: false,
      visible: () => this.allDatesOff(),
      render: (setting: Setting) => {
        const hintEl = setting.settingEl.createDiv({
          cls: 'frontmatter-date-manager-hint-message',
          text: strings.settings.dates.enableNoneHint,
        });
        return () => void hintEl.remove();
      },
    };
  }

  private formattingGroup(): SettingDefinitionItem {
    const f = strings.settings.formatting;
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      type: 'group',
      heading: f.heading,
      visible: () => !this.allDatesOff(),
      items: [
        {
          name: f.dateFormat.name,
          render: (setting: Setting) => void this.renderDateFormatRow(setting),
        },
        {
          name: f.timezone.name,
          desc: t(f.timezone.desc, { localTz }),
          render: (setting: Setting) => this.renderTimezoneRow(setting),
        },
        {
          name: f.numberProperties.name,
          desc: f.numberProperties.desc,
          control: { type: 'toggle', key: 'enableNumberProperties' },
        },
      ],
    };
  }

  private behaviorGroup(): SettingDefinitionItem {
    const b = strings.settings.behavior;
    const s = () => this.plugin.settings;
    return {
      type: 'group',
      heading: b.heading,
      visible: () => !this.allDatesOff(),
      items: [
        {
          name: b.autoUpdate.name,
          desc: b.autoUpdate.desc,
          control: { type: 'toggle', key: 'enableAutoUpdate' },
        },
        {
          name: b.minSeconds.name,
          desc: b.minSeconds.desc,
          visible: () =>
            (s().enableModifiedTime ?? true) || (s().enableLastViewed ?? false),
          control: {
            type: 'slider',
            key: 'minSecondsBetweenSaves',
            min: 5,
            max: 300,
            step: 5,
          },
        },
        this.filterRulesPage(),
        {
          name: b.changeDetection.name,
          desc: b.changeDetection.desc,
          control: {
            type: 'toggle',
            key: 'enableContentHashCheck',
            defaultValue: true,
          },
        },
        {
          name: b.hashTrackingMode.name,
          desc: b.hashTrackingMode.desc,
          visible: () => s().enableContentHashCheck ?? true,
          control: {
            type: 'dropdown',
            key: 'hashTrackingMode',
            defaultValue: 'body',
            options: {
              body: b.hashTrackingMode.optionBody,
              frontmatter: b.hashTrackingMode.optionFrontmatter,
              both: b.hashTrackingMode.optionBoth,
            },
          },
        },
        {
          name: b.excludeKeys.name,
          desc: b.excludeKeys.desc,
          visible: () => this.excludeKeysVisible(),
          render: (setting: Setting) =>
            void this.renderExcludeInputRow(setting),
        },
      ],
    };
  }

  private excludeKeysList(): SettingDefinitionItem {
    const keys = this.plugin.settings.frontmatterHashExcludeKeys ?? [];
    return {
      type: 'list',
      cls: 'frontmatter-date-manager-exclude-list',
      visible: () => !this.allDatesOff() && this.excludeKeysVisible(),
      emptyState: strings.settings.behavior.excludeKeys.emptyState,
      onDelete: (index: number) => {
        void this.removeExcludeKeyAt(index);
      },
      items: keys.map((key) => ({ name: key, searchable: false })),
    };
  }

  private inversionsGroup(): SettingDefinitionItem {
    const i = strings.settings.inversions;
    return {
      type: 'group',
      heading: i.heading,
      visible: () => !this.allDatesOff(),
      items: [
        {
          name: i.strategy.name,
          desc: i.strategy.desc,
          control: {
            type: 'dropdown',
            key: 'inversionFixStrategy',
            defaultValue: 'disabled',
            options: {
              'disabled': i.strategy.optionDisabled,
              'created-to-updated': i.strategy.optionCreatedToUpdated,
              'updated-to-created': i.strategy.optionUpdatedToCreated,
              'max-all': i.strategy.optionMaxAll,
            },
          },
        },
        {
          name: i.tolerance.name,
          desc: i.tolerance.desc,
          control: {
            type: 'number',
            key: 'inversionToleranceSec',
            min: 0,
            step: 1,
            placeholder: '0',
            defaultValue: 0,
          },
        },
      ],
    };
  }

  private advancedPage(): SettingDefinitionItem {
    const a = strings.settings.advanced;
    return {
      type: 'page',
      name: a.pageName,
      desc: a.pageDesc,
      visible: () => !this.allDatesOff(),
      items: [
        {
          name: a.newFileDelay.name,
          desc: a.newFileDelay.desc,
          control: {
            type: 'number',
            key: 'delayForNewFiles',
            min: 0,
            step: 1,
            placeholder: '5000',
          },
        },
        {
          name: a.autoPopulateCache.name,
          desc: a.autoPopulateCache.desc,
          control: {
            type: 'toggle',
            key: 'enableAutoPopulateCache',
            defaultValue: DEFAULT_SETTINGS.enableAutoPopulateCache,
          },
        },
        {
          name: a.maxCacheEntries.name,
          desc: a.maxCacheEntries.desc,
          control: {
            type: 'number',
            key: 'hashCacheMaxSize',
            min: 0,
            step: 1,
            placeholder: '10000',
            defaultValue: 10_000,
          },
        },
        {
          name: a.postUpdateCommand.name,
          desc: a.postUpdateCommand.desc,
          // A control dropdown would bake the command list into the
          // definitions snapshot, built once at plugin load - commands from
          // later-loading plugins would be missing for the whole session.
          // A render row re-enumerates app.commands on every open instead.
          render: (setting: Setting) => {
            setting.addDropdown((dd) => {
              for (const [id, label] of Object.entries(this.commandOptions())) {
                dd.addOption(id, label);
              }
              dd.setValue(this.plugin.settings.postUpdateCommand);
              dd.onChange(async (value) => {
                await this.setControlValue('postUpdateCommand', value);
              });
            });
          },
        },
      ],
    };
  }

  private commandOptions(): Record<string, string> {
    const options: Record<string, string> = {
      '': strings.settings.advanced.postUpdateCommand.optionNone,
    };
    // Obsidian internal API - no public typings available
    const internalApp = this.app as unknown as {
      commands: { commands: Record<string, { name: string }> };
    };
    for (const [id, cmd] of Object.entries(internalApp.commands.commands)) {
      options[id] = cmd.name;
    }
    return options;
  }

  private bulkGroup(): SettingDefinitionItem {
    const b = strings.settings.bulk;
    return {
      type: 'group',
      heading: b.heading,
      visible: () => !this.allDatesOff(),
      items: [
        this.bulkButtonRow(
          b.populate,
          'frontmatter-date-manager-open-populate',
          () =>
            void new BulkPopulateTimestampsModal(this.app, this.plugin).open(),
        ),
        this.bulkButtonRow(
          b.rename,
          'frontmatter-date-manager-open-rename',
          () => void new RenameKeyModal(this.app, this.plugin).open(),
        ),
        this.bulkButtonRow(
          b.reformat,
          'frontmatter-date-manager-open-reformat',
          () => void new ReformatDateModal(this.app, this.plugin).open(),
        ),
        this.bulkButtonRow(
          b.findInversions,
          'frontmatter-date-manager-open-inversions',
          () => void new FindInversionsModal(this.app, this.plugin).open(),
        ),
        {
          ...this.bulkButtonRow(
            b.rebuildCache,
            'frontmatter-date-manager-open-rebuild-cache',
            () => void new UpdateAllCacheData(this.app, this.plugin).open(),
          ),
          visible: () => this.plugin.settings.enableContentHashCheck ?? true,
        },
      ],
    };
  }

  // Render (not action) rows: action rows cannot carry a CSS class, and the
  // e2e Page Objects locate these buttons by their stable
  // frontmatter-date-manager-open-* classes.
  private bulkButtonRow(
    labels: { name: string; desc: string; button: string },
    cssClass: string,
    openModal: () => void,
  ): SettingGroupItem {
    return {
      name: labels.name,
      desc: labels.desc,
      render: (setting: Setting) => {
        setting.addButton((cb) => {
          cb.buttonEl.addClass(cssClass);
          cb.setButtonText(labels.button).onClick(openModal);
        });
      },
    };
  }

  // --- Filter rules sub-page ---

  private filterRulesPage(): SettingGroupItem {
    const fr = strings.settings.filterRules;
    // Shared between the editor and preview render callbacks: typing in the
    // textarea clears a stale preview. Both closures are recreated together on
    // every update(), so the ref can never outlive its sibling row.
    const shared: { previewEl: HTMLElement | null } = { previewEl: null };
    return {
      type: 'page',
      name: fr.name,
      desc: fr.pageDesc,
      displayValue: () =>
        t(fr.ruleCount, { count: this.plugin.getCompiledRules().length }),
      items: [
        {
          name: fr.name,
          // The page entry already carries this name - keeping the editor row
          // out of the search index avoids a duplicate hit for the same thing.
          searchable: false,
          render: (setting: Setting) =>
            this.renderFilterRulesEditor(setting, shared),
        },
        {
          name: '',
          searchable: false,
          render: (setting: Setting) => this.renderFilterReference(setting),
        },
        {
          name: '',
          searchable: false,
          render: (setting: Setting) =>
            this.renderFilterPreviewRow(setting, shared),
        },
      ],
    };
  }

  private renderFilterRulesEditor(
    setting: Setting,
    shared: { previewEl: HTMLElement | null },
  ): () => void {
    const fr = strings.settings.filterRules;
    const descr = createFragment();
    descr.append(fr.descIntro, fr.descOnePerLine);
    descr.createEl('code', { text: '#' });
    descr.append(fr.descCommentsAre);
    descr.createEl('code', { text: '!' });
    descr.append(fr.descAddBack, fr.descLastWins);
    descr.createEl('br');
    descr.createEl('a', {
      href: 'https://git-scm.com/docs/gitignore',
      text: fr.advancedSyntaxLink,
    });
    setting.setDesc(descr);
    setting.settingEl.addClass('frontmatter-date-manager-filter-setting');

    const warnEl = setting.settingEl.createDiv({
      cls: 'frontmatter-date-manager-filter-warn',
      text: fr.noRulesWarning,
    });
    const errorsEl = setting.settingEl.createDiv({
      cls: 'frontmatter-date-manager-filter-errors',
    });

    const updateFeedback = (text: string) => {
      const trimmed = text.trim();
      warnEl.toggleClass('frontmatter-date-manager-hidden', trimmed.length > 0);

      errorsEl.empty();
      if (trimmed.length > 0) {
        const { errors } = parseFilterRules(trimmed);
        for (const err of errors) {
          errorsEl.createDiv({
            text: t(fr.parseError, {
              lineNumber: err.lineNumber,
              message: err.message,
              text: err.text.trim(),
            }),
          });
        }
      }
    };

    const currentValue = this.plugin.settings.filterRules ?? '';
    setting.addTextArea((textArea) => {
      textArea.inputEl.addClass('frontmatter-date-manager-filter-textarea');
      textArea.inputEl.rows = 10;
      textArea.inputEl.placeholder = [
        fr.placeholderExcludeFolder,
        'templates/',
        '',
        fr.placeholderExcludeByPattern,
        'daily/**/*.md',
        '',
        fr.placeholderReinclude,
        '!daily/important.md',
      ].join('\n');
      textArea.setValue(currentValue);
      updateFeedback(currentValue);

      textArea.onChange(async (value) => {
        // Rules with a bad line still save (valid lines compile) - that is
        // why this is a render row, not a textarea control with validate.
        await this.setControlValue('filterRules', value);
        updateFeedback(value);
        shared.previewEl?.empty();
      });
    });

    return () => {
      warnEl.remove();
      errorsEl.remove();
    };
  }

  private renderFilterPreviewRow(
    setting: Setting,
    shared: { previewEl: HTMLElement | null },
  ): () => void {
    const fr = strings.settings.filterRules;
    setting.settingEl.addClass('frontmatter-date-manager-filter-setting');
    const previewEl = setting.settingEl.createDiv({
      cls: 'frontmatter-date-manager-filter-preview',
    });
    shared.previewEl = previewEl;

    setting.addButton((btn) => {
      btn.setButtonText(fr.previewButton);
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

        previewEl.createDiv({
          text: t(fr.previewSummary, {
            tracked: tracked.length,
            excluded: excluded.length,
          }),
          cls: 'frontmatter-date-manager-filter-preview-summary',
        });

        if (excluded.length > 0) {
          const details = previewEl.createEl('details');
          details.createEl('summary', {
            text: t(fr.skippedFilesSummary, { excluded: excluded.length }),
          });
          const list = details.createEl('ul');
          const limit = Math.min(excluded.length, 50);
          for (let i = 0; i < limit; i++) {
            list.createEl('li', { text: excluded[i] });
          }
          if (excluded.length > 50) {
            list.createEl('li', {
              text: t(fr.skippedMore, { count: excluded.length - 50 }),
            });
          }
        }
      });
    });

    return () => {
      previewEl.remove();
      if (shared.previewEl === previewEl) shared.previewEl = null;
    };
  }

  private renderFilterReference(setting: Setting): () => void {
    // Column layout, like the editor/preview rows: without it the row's empty
    // .setting-item-info flex child eats the left half and squeezes the
    // reference into the right column.
    setting.settingEl.addClass('frontmatter-date-manager-filter-setting');
    const refEl = setting.settingEl.createEl('details', {
      cls: 'frontmatter-date-manager-filter-reference',
    });
    refEl.createEl('summary', {
      text: strings.settings.filterRules.reference.summary,
    });

    const addSection = (title: string, rows: [string, string][]): void => {
      refEl.createDiv({
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

    return () => void refEl.remove();
  }

  // --- Render helpers (rows a control cannot express) ---

  // Live preview of the current format in the description, rebuilt on every
  // keystroke - a control's desc is static, so this stays a render row.
  private renderDateFormatRow(setting: Setting): void {
    const df = strings.settings.formatting.dateFormat;
    const createDoc = () => {
      const descr = createFragment();
      const tzOptions = this.plugin.settings.timezone
        ? { in: tz(this.plugin.settings.timezone) }
        : {};
      let preview: string;
      try {
        preview = t(df.currentlyPreview, {
          preview: format(
            new Date(),
            this.plugin.settings.dateFormat,
            tzOptions,
          ),
        });
      } catch {
        const hint = getMomentFormatHint(this.plugin.settings.dateFormat);
        preview = hint ? t(df.invalidWithHint, { hint }) : df.invalidFormat;
      }
      descr.append(
        df.desc,
        descr.createEl('br'),
        descr.createEl('a', {
          href: 'https://date-fns.org/v4.1.0/docs/format',
          text: df.formatCodesLink,
        }),
        descr.createEl('br'),
        preview,
        descr.createEl('br'),
        df.obsidianDefault,
      );
      return descr;
    };

    setting.setDesc(createDoc());
    setting.addText((text) =>
      text
        .setPlaceholder(DEFAULT_SETTINGS.dateFormat)
        .setValue(this.plugin.settings.dateFormat)
        .onChange(async (value) => {
          await this.setControlValue('dateFormat', value);
          setting.setDesc(createDoc());
        }),
    );
  }

  // TimezoneSuggest needs the raw input element, which control rows never
  // expose - so this stays a render row.
  private renderTimezoneRow(setting: Setting): () => void {
    const tzStrings = strings.settings.formatting.timezone;
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let errorEl: HTMLElement | null = null;
    const showError = (show: boolean) => {
      errorEl ??= setting.settingEl.createDiv({
        cls: 'frontmatter-date-manager-timezone-error',
        text: tzStrings.invalidTimezone,
      });
      errorEl.toggleClass('frontmatter-date-manager-hidden', !show);
    };

    setting
      .addText((text) => {
        new TimezoneSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(t(tzStrings.placeholder, { localTz }))
          .setValue(this.plugin.settings.timezone)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              // Intl.DateTimeFormat constructor throws on invalid timezone
              // strings; used here as validation. An invalid value shows an
              // inline error and is never saved.
              try {
                Intl.DateTimeFormat(undefined, { timeZone: trimmed });
              } catch {
                showError(true);
                return;
              }
            }
            showError(false);
            await this.setControlValue('timezone', trimmed);
          });
      })
      .addExtraButton((cb) => {
        cb.setIcon('reset')
          .setTooltip(tzStrings.resetTooltip)
          .onClick(async () => {
            await this.setControlValue('timezone', '');
            // Full re-render: the date-format row's preview depends on the
            // timezone, and the input's displayed value must reset too.
            this.update();
          });
      });

    return () => errorEl?.remove();
  }

  private renderExcludeInputRow(setting: Setting): void {
    const ek = strings.settings.behavior.excludeKeys;
    let inputValue = '';

    const addKeys = async () => {
      const currentList = this.plugin.settings.frontmatterHashExcludeKeys ?? [];
      const newKeys = parsePropertyKeys(inputValue, currentList);
      if (newKeys.length === 0) return;
      await this.setControlValue('frontmatterHashExcludeKeys', [
        ...currentList,
        ...newKeys,
      ]);
      // The list's definition items changed - a DOM-state refresh is not
      // enough, the tree must be rebuilt.
      this.update();
    };

    setting
      .addText((text) => {
        text.inputEl.addClass('frontmatter-date-manager-exclude-input');
        text.setPlaceholder(ek.placeholder);
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
        cb.setTooltip(ek.addTooltip);
        cb.onClick(() => {
          void addKeys();
        });
      });
  }

  private async removeExcludeKeyAt(index: number): Promise<void> {
    const list = [...(this.plugin.settings.frontmatterHashExcludeKeys ?? [])];
    list.splice(index, 1);
    await this.setControlValue('frontmatterHashExcludeKeys', list);
    this.update();
  }
}

import { Notice, Plugin, TAbstractFile, TFile, normalizePath } from 'obsidian';
import { format, parse, add, isAfter } from 'date-fns';
import { tz } from '@date-fns/tz';
import {
  DEFAULT_SETTINGS,
  FrontmatterDateManagerSettings,
  FrontmatterDateManagerSettingsTab,
} from './Settings';
import { isTFile } from './utils';
import { sha256 } from 'js-sha256';
import { FilterRule, isFileExcluded, parseFilterRules } from './filterRules';

export interface HashCacheEntry {
  hash: string;
  lastAccessed: number;
}

const HASH_CACHE_FILE = 'hash-cache.json';
const HASH_CACHE_DEFAULT_MAX_SIZE = 10_000;
const MODIFY_DEBOUNCE_MS = 2000;
const HASH_CACHE_DEBOUNCE_MS = 30_000;
const HASH_CACHE_MAX_DELAY_MS = 300_000;

export default class FrontmatterDateManagerPlugin extends Plugin {
  settings!: FrontmatterDateManagerSettings;
  hashCache: Record<string, HashCacheEntry> = {};
  statusBarEl!: HTMLElement;
  private recentlyCreated = new Set<string>();
  // Timers are managed manually (not via registerInterval) because they need
  // individual clearing/re-setting. All are cleaned up in onunload().
  private modifyTimers = new Map<string, number>();
  private processingFiles = new Set<string>();
  private _hashCacheDirty = false;
  private _hashCacheSaveTimer: number | null = null;
  private _hashCacheFirstDirtyAt: number | null = null;
  private _pausedUntil: number = 0;
  private _pauseResumeTimer: number | null = null;
  private _pauseCountdownTimer: number | null = null;
  private _compiledRules: FilterRule[] = [];
  bulkRunning = false;

  parseDate(input: number | string): Date | undefined {
    if (typeof input === 'string') {
      try {
        const options = this.settings.timezone
          ? { in: tz(this.settings.timezone) }
          : {};
        const parsedDate = parse(
          input,
          this.settings.dateFormat,
          new Date(),
          options,
        );

        if (isNaN(parsedDate.getTime())) {
          this.log('NAN DATE', parsedDate);
          return undefined;
        }

        return parsedDate;
      } catch (e) {
        this.logError('parseDate error:', e);
        return undefined;
      }
    }
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      this.log('NAN DATE from numeric input', input);
      return undefined;
    }
    return date;
  }

  formatDate(input: Date): string | number | undefined {
    const options = this.settings.timezone
      ? { in: tz(this.settings.timezone) }
      : {};
    try {
      const output = format(input, this.settings.dateFormat, options);
      if (/^\d+$/.test(output) && this.settings.enableNumberProperties) {
        return parseInt(output);
      }
      return output;
    } catch (e) {
      this.logError('formatDate error:', this.settings.dateFormat, e);
      return undefined;
    }
  }

  async onload() {
    this.log('loading plugin IN DEV');

    await this.loadSettings();

    this.setupOnEditHandler();
    this.setupStatusBar();
    this.setupCommands();

    this.addSettingTab(new FrontmatterDateManagerSettingsTab(this.app, this));

    if (this.settings.enableContentHashCheck) {
      this.app.workspace.onLayoutReady(() => {
        this.garbageCollectHashCache();
        if (this.settings.enableAutoPopulateCache) {
          void this.autoPopulateHashCache();
        }
      });
    }
  }

  private async autoPopulateHashCache(): Promise<void> {
    const allFiles = this.app.vault.getMarkdownFiles();
    const uncached = allFiles.filter((f: TFile) => !this.hashCache[f.path]);

    if (uncached.length === 0) return;

    this.log(`Auto-populating hash cache for ${uncached.length} files`);

    const BATCH_SIZE = 50;
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
      const batch = uncached.slice(i, i + BATCH_SIZE);
      for (const file of batch) {
        try {
          await this.populateCacheForFileDirect(file);
        } catch (e) {
          this.log('Error hashing file during auto-populate:', file.path, e);
        }
      }
      if (i + BATCH_SIZE < uncached.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    this.evictOldestCacheEntries();
    this.markHashCacheDirty();
    await this.flushHashCache();
    this.log('Auto-populate complete');
  }

  setupStatusBar() {
    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.onClickEvent(() => {
      this.settings.enableAutoUpdate = !this.settings.enableAutoUpdate;
      void this.saveSettings();
      this.updateStatusBar();
    });
    this.updateStatusBar();
  }

  updateStatusBar() {
    if (this._pausedUntil > 0 && Date.now() < this._pausedUntil) {
      const remaining = Math.ceil((this._pausedUntil - Date.now()) / 60000);
      this.statusBarEl.setText(`Paused (${remaining}m)`);
    } else if (!this.settings.enableAutoUpdate) {
      this.statusBarEl.setText('Paused');
    } else {
      this.statusBarEl.setText('');
    }
  }

  setupCommands() {
    this.addCommand({
      id: 'update-timestamps-current-file',
      name: 'Update timestamps for current file',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file) {
          if (!checking) {
            this.handleFileChange(file, 'modify')
              .then((result) => {
                if (result.status === 'ok') {
                  new Notice('Timestamps updated.');
                } else if (result.status === 'ignored') {
                  new Notice('File is ignored by plugin settings.');
                } else {
                  new Notice(
                    'Failed to update timestamps. Check console for details.',
                  );
                }
              })
              .catch(() => {
                new Notice('Failed to update timestamps.');
              });
          }
          return true;
        }
        return false;
      },
    });

    this.addCommand({
      id: 'toggle-auto-update',
      name: 'Toggle auto-update on/off',
      callback: () => {
        this.settings.enableAutoUpdate = !this.settings.enableAutoUpdate;
        void this.saveSettings();
        this.updateStatusBar();
        new Notice(
          `Auto-update ${this.settings.enableAutoUpdate ? 'enabled' : 'disabled'}`,
        );
      },
    });

    this.addCommand({
      id: 'pause-auto-update',
      name: 'Pause auto-update for 5 minutes',
      callback: () => {
        const PAUSE_MINUTES = 5;
        this._pausedUntil = Date.now() + PAUSE_MINUTES * 60 * 1000;
        this.updateStatusBar();
        new Notice(
          `Auto-update paused for ${PAUSE_MINUTES} minutes. Will resume automatically.`,
        );

        if (this._pauseResumeTimer) clearTimeout(this._pauseResumeTimer);
        if (this._pauseCountdownTimer) clearInterval(this._pauseCountdownTimer);

        this._pauseCountdownTimer = this.registerInterval(
          window.setInterval(() => {
            this.updateStatusBar();
          }, 30_000),
        );

        this._pauseResumeTimer = window.setTimeout(
          () => {
            this._pauseResumeTimer = null;
            this._pausedUntil = 0;
            if (this._pauseCountdownTimer) {
              clearInterval(this._pauseCountdownTimer);
              this._pauseCountdownTimer = null;
            }
            this.updateStatusBar();
            new Notice('Auto-update resumed.');
          },
          PAUSE_MINUTES * 60 * 1000,
        );
      },
    });
  }

  recompileFilterRules(): void {
    const { rules } = parseFilterRules(this.settings.filterRules ?? '');
    this._compiledRules = rules;
  }

  getCompiledRules(): FilterRule[] {
    return this._compiledRules;
  }

  hashString(str: string): string {
    return sha256(str);
  }

  stripFrontmatter(content: string): string {
    const match = content.match(/^---\r?\n(?:[\s\S]*?\r?\n)?---\r?\n?/);
    return match ? content.slice(match[0].length) : content;
  }

  getContentForHashing(fileContent: string): string {
    const mode = this.settings.hashTrackingMode ?? 'body';

    if (mode === 'body') {
      return this.stripFrontmatter(fileContent);
    }

    const fmMatch = fileContent.match(/^---\r?\n([\s\S]*?\r?\n)?---\r?\n?/);
    if (!fmMatch) {
      return mode === 'frontmatter' ? '' : fileContent;
    }

    const frontmatterBlock = fmMatch[1] ?? '';
    const body = fileContent.slice(fmMatch[0].length);

    const excludedKeys = new Set<string>();
    const createdKey = this.settings.headerCreated.trim();
    const updatedKey = this.settings.headerUpdated.trim();
    if (createdKey) excludedKeys.add(createdKey);
    if (updatedKey) excludedKeys.add(updatedKey);
    for (const key of this.settings.frontmatterHashExcludeKeys ?? []) {
      const trimmed = key.trim();
      if (trimmed) excludedKeys.add(trimmed);
    }

    const filteredFrontmatter = this.filterFrontmatterKeys(
      frontmatterBlock,
      excludedKeys,
    );

    if (mode === 'frontmatter') {
      return filteredFrontmatter;
    }

    return filteredFrontmatter + body;
  }

  private filterFrontmatterKeys(
    frontmatter: string,
    excludedKeys: Set<string>,
  ): string {
    if (excludedKeys.size === 0) return frontmatter;

    const lines = frontmatter.split(/\r?\n/);
    const result: string[] = [];
    let skipCurrent = false;

    for (const line of lines) {
      const keyMatch = line.match(/^([^\s:][^:]*?)\s*:/);
      if (keyMatch) {
        skipCurrent = excludedKeys.has(keyMatch[1]!);
      } else if (/^\S/.test(line) && line.trim().length > 0) {
        skipCurrent = false;
      }

      if (!skipCurrent) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  async shouldFileBeIgnored(
    file: TFile,
    options?: { skipHashCheck?: boolean },
  ): Promise<{ ignored: boolean; fileContent?: string }> {
    if (!file.path) {
      return { ignored: true };
    }
    if (file.extension !== 'md') {
      return { ignored: true };
    }
    // Canvas files are created as 'Canvas.md',
    // so the plugin will update "frontmatter" and break the file when it gets created
    if (file.name.toLowerCase() === 'canvas.md') {
      return { ignored: true };
    }

    if (this.isExcalidrawFile(file)) {
      return { ignored: true };
    }

    // Filter rules check BEFORE reading file to avoid unnecessary I/O
    if (
      this._compiledRules.length > 0 &&
      isFileExcluded(file.path, this._compiledRules)
    ) {
      return { ignored: true };
    }

    // All path-based checks passed — now read the file
    const fileContent = (await this.app.vault.read(file)).trim();

    if (fileContent.length === 0) {
      return { ignored: true };
    }

    if (this.settings.enableContentHashCheck && !options?.skipHashCheck) {
      const entry = this.hashCache[file.path];
      if (entry) {
        entry.lastAccessed = Date.now();
        const contentToHash = this.getContentForHashing(fileContent);
        const sha = this.hashString(contentToHash);
        if (sha === entry.hash) {
          this.log('Ignoring file — SHA is the same');
          return { ignored: true };
        }
      }
    }

    return { ignored: false, fileContent };
  }

  shouldUpdateValue(currentMtime: Date, updateHeader: Date): boolean {
    const nextUpdate = add(updateHeader, {
      seconds: this.settings.minSecondsBetweenSaves,
    });
    return isAfter(currentMtime, nextUpdate);
  }

  isExcalidrawFile(file: TFile): boolean {
    // ExcalidrawAutomate is injected into the global scope by the Excalidraw plugin
    const global = globalThis as Record<string, unknown>;
    const ea = global['ExcalidrawAutomate'];
    if (
      ea != null &&
      typeof ea === 'object' &&
      'isExcalidrawFile' in ea &&
      typeof (ea as Record<string, unknown>)['isExcalidrawFile'] === 'function'
    ) {
      return (
        ea as { isExcalidrawFile: (f: TFile) => boolean }
      ).isExcalidrawFile(file);
    }
    return false;
  }

  async getAllFilesPossiblyAffected(options?: { skipHashCheck?: boolean }) {
    const allFiles = this.app.vault.getMarkdownFiles();
    const result = [];

    for (const file of allFiles) {
      const check = await this.shouldFileBeIgnored(file, options);
      if (!check.ignored) {
        result.push(file);
      }
    }

    return result;
  }

  async populateCacheForFile(file: TFile, content?: string): Promise<void> {
    const fileContent = content ?? (await this.app.vault.read(file)).trim();
    const contentToHash = this.getContentForHashing(fileContent);
    const sha = this.hashString(contentToHash);
    this.hashCache[file.path] = { hash: sha, lastAccessed: Date.now() };
    this.evictOldestCacheEntries();
    this.markHashCacheDirty();
  }

  async populateCacheForFileDirect(
    file: TFile,
    content?: string,
  ): Promise<void> {
    const fileContent = content ?? (await this.app.vault.read(file)).trim();
    const contentToHash = this.getContentForHashing(fileContent);
    const sha = this.hashString(contentToHash);
    this.hashCache[file.path] = { hash: sha, lastAccessed: Date.now() };
  }

  private computeFrontmatterUpdates(file: TFile): {
    createdValue?: string | number;
    updatedValue?: string | number;
  } | null {
    const updatedKey = this.settings.headerUpdated.trim();
    const createdKey = this.settings.headerCreated.trim();

    if (!updatedKey && !createdKey) {
      return null;
    }

    const mTime = this.parseDate(file.stat.mtime);
    const cTime = this.parseDate(file.stat.ctime);

    if (!mTime || !cTime) {
      this.log('Something went wrong, skipping');
      return null;
    }

    const cached: Record<string, unknown> | undefined =
      this.app.metadataCache.getFileCache(file)?.frontmatter;

    const result: {
      createdValue?: string | number;
      updatedValue?: string | number;
    } = {};

    if (this.settings.enableCreateTime && createdKey) {
      const existingCreated = cached?.[createdKey] as
        | string
        | number
        | undefined;
      if (!existingCreated) {
        result.createdValue = this.formatDate(cTime);
      }
    }

    if ((this.settings.enableModifiedTime ?? true) && updatedKey) {
      const existingUpdated = cached?.[updatedKey] as
        | string
        | number
        | undefined;
      if (!existingUpdated) {
        result.updatedValue = this.formatDate(mTime);
      } else {
        const currentMTimeOnFile = this.parseDate(existingUpdated);
        if (!currentMTimeOnFile) {
          result.updatedValue = this.formatDate(mTime);
        } else if (this.shouldUpdateValue(mTime, currentMTimeOnFile)) {
          result.updatedValue = this.formatDate(mTime);
        }
      }
    }

    return result;
  }

  async handleFileChange(
    file: TAbstractFile,
    triggerSource: 'modify' | 'bulk',
  ): Promise<
    | { status: 'ok' }
    | { status: 'error'; error: unknown }
    | { status: 'ignored' }
  > {
    if (!isTFile(file)) {
      return { status: 'ignored' };
    }

    const checkResult = await this.shouldFileBeIgnored(file, {
      skipHashCheck: triggerSource === 'bulk',
    });
    if (checkResult.ignored) {
      return { status: 'ignored' };
    }

    const updates = this.computeFrontmatterUpdates(file);

    if (updates === null) {
      return { status: 'ignored' };
    }

    const hasChanges =
      updates.createdValue !== undefined || updates.updatedValue !== undefined;

    if (!hasChanges) {
      this.log('Skipping processFrontMatter — no changes needed');
      if (checkResult.fileContent) {
        await this.populateCacheForFile(file, checkResult.fileContent);
      }
      return { status: 'ok' };
    }

    try {
      await this.app.fileManager.processFrontMatter(
        file,
        (frontmatter: Record<string, unknown>) => {
          this.log('current metadata: ', frontmatter);
          this.log('current stat: ', file.stat);

          if (updates.createdValue !== undefined) {
            frontmatter[this.settings.headerCreated] = updates.createdValue;
          }
          if (updates.updatedValue !== undefined) {
            frontmatter[this.settings.headerUpdated] = updates.updatedValue;
          }
        },
        { ctime: file.stat.ctime, mtime: file.stat.mtime },
      );
      // Re-read after processFrontMatter modified the file
      await this.populateCacheForFile(file);

      if (this.settings.postUpdateCommand) {
        try {
          // Obsidian internal API — no public typings available
          const internalApp = this.app as unknown as {
            commands: { executeCommandById: (id: string) => void };
          };
          internalApp.commands.executeCommandById(
            this.settings.postUpdateCommand,
          );
        } catch (cmdErr) {
          this.logError(
            'Post-update command failed:',
            this.settings.postUpdateCommand,
            cmdErr,
          );
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'YAMLParseError') {
        const errorMessage = `Frontmatter Date Manager failed
Malformed frontmatter on this file: ${file.path}

${e.message}`;
        new Notice(errorMessage, 4000);
        this.logError(errorMessage);
      } else {
        this.logError('Error processing', file.path, e);
      }
      return {
        status: 'error',
        error: e,
      };
    }
    return {
      status: 'ok',
    };
  }

  private async processFileWithLock(file: TFile): Promise<void> {
    if (this.processingFiles.has(file.path)) {
      // Already processing this file — re-schedule
      const retryTimer = window.setTimeout(() => {
        this.modifyTimers.delete(file.path);
        void this.processFileWithLock(file);
      }, MODIFY_DEBOUNCE_MS);
      this.modifyTimers.set(file.path, retryTimer);
      return;
    }
    this.processingFiles.add(file.path);
    try {
      this.log('TRIGGER FROM MODIFY (debounced)');
      await this.handleFileChange(file, 'modify');
    } finally {
      this.processingFiles.delete(file.path);
    }
  }

  setupOnEditHandler() {
    this.log('Setup handler');

    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (isTFile(file) && this.settings.delayForNewFiles > 0) {
          this.recentlyCreated.add(file.path);
          window.setTimeout(
            () => this.recentlyCreated.delete(file.path),
            this.settings.delayForNewFiles,
          );
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (!this.settings.enableAutoUpdate) return;
        if (this.bulkRunning) return;
        if (this._pausedUntil > 0 && Date.now() < this._pausedUntil) return;
        if (!isTFile(file)) return;
        if (this.recentlyCreated.has(file.path)) return;

        // Debounce per file to prevent race conditions during rapid typing.
        // Multiple concurrent processFrontMatter() calls can corrupt YAML.
        const existing = this.modifyTimers.get(file.path);
        if (existing) clearTimeout(existing);

        const timer = window.setTimeout(() => {
          this.modifyTimers.delete(file.path);
          void this.processFileWithLock(file);
        }, MODIFY_DEBOUNCE_MS);
        this.modifyTimers.set(file.path, timer);
      }),
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        // Clear pending debounce for the old path
        const oldTimer = this.modifyTimers.get(oldPath);
        if (oldTimer) {
          clearTimeout(oldTimer);
          this.modifyTimers.delete(oldPath);
        }

        const entry = this.hashCache[oldPath];
        if (!entry) {
          return;
        }
        entry.lastAccessed = Date.now();
        this.hashCache[file.path] = entry;
        delete this.hashCache[oldPath];
        this.markHashCacheDirty();
      }),
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        // Clear pending debounce for the deleted file
        const timer = this.modifyTimers.get(file.path);
        if (timer) {
          clearTimeout(timer);
          this.modifyTimers.delete(file.path);
        }

        const entry = this.hashCache[file.path];
        if (!entry) {
          return;
        }
        delete this.hashCache[file.path];
        this.markHashCacheDirty();
      }),
    );
  }

  onunload() {
    for (const timer of this.modifyTimers.values()) {
      clearTimeout(timer);
    }
    this.modifyTimers.clear();
    this.processingFiles.clear();
    if (this._pauseResumeTimer) {
      clearTimeout(this._pauseResumeTimer);
      this._pauseResumeTimer = null;
    }
    if (this._pauseCountdownTimer) {
      clearInterval(this._pauseCountdownTimer);
      this._pauseCountdownTimer = null;
    }
    if (this._hashCacheSaveTimer) {
      clearTimeout(this._hashCacheSaveTimer);
      this._hashCacheSaveTimer = null;
    }
    void this.flushHashCache();
    this.log('unloading Frontmatter Date Manager plugin');
  }

  async onExternalSettingsChange() {
    await this.loadSettings();
    this.updateStatusBar();
  }

  log(...data: unknown[]) {
    if (!__DEV_MODE__) return;
    console.debug('[FDM]:', ...data);
  }

  logError(...data: unknown[]) {
    if (!__DEV_MODE__) return;
    console.error('[FDM]:', ...data);
  }

  async loadSettings() {
    const data =
      (await this.loadData()) as Partial<FrontmatterDateManagerSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});

    this.recompileFilterRules();
    await this.loadHashCache();
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private getHashCachePath(): string {
    return normalizePath(`${this.manifest.dir}/${HASH_CACHE_FILE}`);
  }

  async loadHashCache() {
    try {
      const raw = await this.app.vault.adapter.read(this.getHashCachePath());
      const parsed: unknown = JSON.parse(raw);

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        this.hashCache = {};
        return;
      }

      const record = parsed as Record<string, unknown>;
      const validated: Record<string, HashCacheEntry> = {};
      for (const key of Object.keys(record)) {
        const entry = record[key];
        if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as Record<string, unknown>).hash === 'string' &&
          typeof (entry as Record<string, unknown>).lastAccessed === 'number'
        ) {
          validated[key] = entry as HashCacheEntry;
        }
      }
      if (Object.keys(validated).length < Object.keys(record).length) {
        this._hashCacheDirty = true;
      }
      this.hashCache = validated;
    } catch {
      this.hashCache = {};
    }
  }

  private garbageCollectHashCache(): void {
    const keys = Object.keys(this.hashCache);
    let removed = 0;
    for (const path of keys) {
      if (!this.app.vault.getAbstractFileByPath(path)) {
        delete this.hashCache[path];
        removed++;
      }
    }
    if (removed > 0) {
      this.log(`GC: removed ${removed} orphaned hash cache entries`);
      this._hashCacheDirty = true;
    }
  }

  evictOldestCacheEntries(): void {
    const maxSize =
      this.settings.hashCacheMaxSize ?? HASH_CACHE_DEFAULT_MAX_SIZE;
    if (maxSize <= 0) return;
    const keys = Object.keys(this.hashCache);
    const excess = keys.length - maxSize;
    if (excess <= 0) return;
    const sorted = keys.sort(
      (a, b) =>
        this.hashCache[a]!.lastAccessed - this.hashCache[b]!.lastAccessed,
    );
    for (let i = 0; i < excess; i++) {
      delete this.hashCache[sorted[i]!];
    }
    this.log(`LRU: evicted ${excess} oldest cache entries`);
  }

  markHashCacheDirty() {
    this._hashCacheDirty = true;

    this._hashCacheFirstDirtyAt ??= Date.now();

    if (this._hashCacheSaveTimer) {
      clearTimeout(this._hashCacheSaveTimer);
      this._hashCacheSaveTimer = null;
    }

    const elapsed = Date.now() - this._hashCacheFirstDirtyAt;
    const remainingCap = Math.max(0, HASH_CACHE_MAX_DELAY_MS - elapsed);
    const delay = Math.min(HASH_CACHE_DEBOUNCE_MS, remainingCap);

    this._hashCacheSaveTimer = window.setTimeout(() => {
      this._hashCacheSaveTimer = null;
      this.flushHashCache().catch((err) => {
        this.logError('Failed to flush hash cache:', err);
        this._hashCacheDirty = true;
      });
    }, delay);
  }

  async flushHashCache() {
    if (!this._hashCacheDirty) return;
    const json = JSON.stringify(this.hashCache);
    await this.app.vault.adapter.write(this.getHashCachePath(), json);
    // Reset flags only after successful write to avoid data loss on failure
    this._hashCacheDirty = false;
    this._hashCacheFirstDirtyAt = null;
  }
}

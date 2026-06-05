import { TFile, Setting, Notice } from 'obsidian';
import { BaseBulkModal } from './BaseBulkModal';
import {
  InversionFixStrategy,
  applyInversionFix,
  isInversion,
} from './inversionDetection';

export interface InvertedFileEntry {
  file: TFile;
  created: Date;
  updated: Date;
}

function formatDelta(created: Date, updated: Date): string {
  const ms = created.getTime() - updated.getTime();
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds <= 0) return '0s';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
}

const PREVIEW_MAX_ROWS = 50;

export class FindInversionsModal extends BaseBulkModal {
  private invertedEntries: InvertedFileEntry[] = [];
  private selectedStrategy: InversionFixStrategy = 'disabled';

  protected getTitle(count: number): string {
    return `Found ${count} inverted files`;
  }

  protected getDescription(): string {
    return (
      'These files have updated date earlier than created date. ' +
      'Choose a fix strategy below or close to review manually.'
    );
  }

  protected getWarning(count: number): string | null {
    if (count === 0) return null;
    if (this.selectedStrategy === 'disabled') return null;
    return `This will modify ${count} files. Irreversible without a backup.`;
  }

  protected getRunningMessage(): string {
    return 'Fixing inversions...';
  }

  protected skipHashCheck(): boolean {
    return true;
  }

  protected canRun(files: TFile[]): boolean {
    return files.length > 0 && this.selectedStrategy !== 'disabled';
  }

  // Running this modal always rewrites created/updated on the inverted files;
  // it is only ever enabled once a non-disabled strategy is chosen (see
  // canRun), so Run is always destructive when clickable.
  protected isRunDestructive(): boolean {
    return true;
  }

  protected async narrowFiles(files: TFile[]): Promise<TFile[]> {
    this.invertedEntries = this.computeInvertedFiles(files);
    return this.invertedEntries.map((e) => e.file);
  }

  protected computeInvertedFiles(files: TFile[]): InvertedFileEntry[] {
    const tolerance = this.plugin.settings.inversionToleranceSec ?? 0;
    const createdKey = this.plugin.settings.headerCreated.trim();
    const updatedKey = this.plugin.settings.headerUpdated.trim();
    if (!createdKey || !updatedKey) return [];

    const result: InvertedFileEntry[] = [];
    for (const file of files) {
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (!fm) continue;
      const rawCreated = fm[createdKey] as string | number | undefined;
      const rawUpdated = fm[updatedKey] as string | number | undefined;
      if (rawCreated == null || rawUpdated == null) continue;
      const created = this.plugin.parseDate(rawCreated);
      const updated = this.plugin.parseDate(rawUpdated);
      if (!created || !updated) continue;
      if (isInversion(created, updated, tolerance)) {
        result.push({ file, created, updated });
      }
    }
    return result;
  }

  protected async processFile(file: TFile): Promise<void> {
    if (this.selectedStrategy === 'disabled') return;
    const entry = this.invertedEntries.find((e) => e.file.path === file.path);
    if (!entry) return;
    const cTime = new Date(file.stat.ctime);
    const mTime = new Date(file.stat.mtime);
    const fixed = applyInversionFix(this.selectedStrategy, {
      created: entry.created,
      updated: entry.updated,
      mtime: mTime,
      ctime: cTime,
    });
    const newCreated = this.plugin.formatDate(fixed.created);
    const newUpdated = this.plugin.formatDate(fixed.updated);
    if (newCreated === undefined || newUpdated === undefined) return;

    await this.app.fileManager.processFrontMatter(
      file,
      (frontmatter: Record<string, unknown>) => {
        frontmatter[this.plugin.settings.headerCreated] = newCreated;
        frontmatter[this.plugin.settings.headerUpdated] = newUpdated;
      },
    );
    this.plugin.lastPluginWriteMtime.set(file.path, file.stat.mtime);
    if (this.plugin.settings.enableContentHashCheck ?? true) {
      await this.plugin.populateCacheForFile(file);
    }
  }

  protected renderExtraSection(parent: HTMLElement, files: TFile[]): void {
    if (files.length === 0) {
      parent.createEl('div', {
        text: 'No inverted files found in the eligible set.',
        cls: 'frontmatter-date-manager-inversion-empty',
      });
      return;
    }

    const strategySection = parent.createDiv({
      cls: 'frontmatter-date-manager-inversion-strategy-section',
    });

    new Setting(strategySection)
      .setName('Fix strategy')
      .setDesc('How to resolve the inversion.')
      .addDropdown((dd) => {
        dd.addOption('disabled', "Don't fix (review only)");
        dd.addOption('created-to-updated', 'Set created = updated');
        dd.addOption('updated-to-created', 'Set updated = created');
        dd.addOption('max-all', 'Set both = max of all known dates');
        dd.setValue(this.plugin.settings.inversionFixStrategy ?? 'disabled');
        dd.onChange((value: string) => {
          this.selectedStrategy = value as InversionFixStrategy;
          this.refreshRunButton();
          this.refreshWarning();
        });
        this.selectedStrategy =
          this.plugin.settings.inversionFixStrategy ?? 'disabled';
      });

    const tolerance = this.plugin.settings.inversionToleranceSec ?? 0;
    parent.createEl('div', {
      text: `Tolerance: ${tolerance} seconds (configurable in plugin settings).`,
      cls: 'frontmatter-date-manager-inversion-tolerance-hint',
    });

    const table = parent.createEl('table', {
      cls: 'frontmatter-date-manager-inversion-table',
    });
    const header = table.createEl('tr');
    header.createEl('th', { text: 'Path' });
    header.createEl('th', { text: 'Created' });
    header.createEl('th', { text: 'Updated' });
    header.createEl('th', { text: 'Δ' });

    const limit = Math.min(this.invertedEntries.length, PREVIEW_MAX_ROWS);
    for (let i = 0; i < limit; i++) {
      const entry = this.invertedEntries[i]!;
      const row = table.createEl('tr', {
        cls: 'frontmatter-date-manager-inversion-row',
      });
      row.createEl('td', { text: entry.file.path });
      row.createEl('td', { text: entry.created.toISOString() });
      row.createEl('td', { text: entry.updated.toISOString() });
      row.createEl('td', {
        text: formatDelta(entry.created, entry.updated),
        cls: 'frontmatter-date-manager-inversion-delta',
      });
    }

    if (this.invertedEntries.length > limit) {
      parent.createEl('div', {
        text: `...and ${this.invertedEntries.length - limit} more`,
      });
    }
  }

  protected async onComplete(): Promise<void> {
    new Notice(`Fixed ${this.invertedEntries.length} inversions.`, 4000);
  }
}

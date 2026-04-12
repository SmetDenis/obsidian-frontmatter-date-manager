import { TFile } from 'obsidian';
import { BaseBulkModal } from './BaseBulkModal';

export class UpdateAllModal extends BaseBulkModal {
  protected getTitle(fileCount: number): string {
    return `Overwrite timestamps in ${fileCount} files`;
  }

  protected getDescription(): string {
    return (
      'This will set the "updated" timestamp to the current date/time for all eligible files. ' +
      'Original timestamps will be permanently lost.'
    );
  }

  protected getWarning(fileCount: number): string | null {
    return `DESTRUCTIVE: this action will overwrite timestamps in ${fileCount} files. Make sure you have a backup before proceeding.`;
  }

  protected skipHashCheck(): boolean {
    return true;
  }

  protected getConfirmationPrompt(): { text: string; match: string } | null {
    return {
      text: 'Type OVERWRITE to confirm:',
      match: 'OVERWRITE',
    };
  }

  protected getRunningMessage(): string {
    return 'Overwriting timestamps...';
  }

  protected async processFile(file: TFile): Promise<void> {
    await this.plugin.handleFileChange(file, 'bulk');
  }
}

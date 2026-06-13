import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TFile } from 'obsidian';
import { createPlugin } from './helpers';
import { ReformatDateModal, ReformatScope } from '../ReformatDateModal';

function createMockFile(path: string): TFile {
  return {
    path,
    stat: { ctime: Date.now(), mtime: Date.now(), size: 100 },
    basename: path.replace(/\.md$/, ''),
    extension: 'md',
    name: path.split('/').pop() ?? path,
    vault: {} as any,
    parent: null,
  } as unknown as TFile;
}

class TestableReformatDate extends ReformatDateModal {
  public testComputePreviewEntry(file: TFile) {
    return this.computePreviewEntry(file);
  }

  public testTryParseDate(value: string | number) {
    return this.tryParseDate(value);
  }

  public setScope(scope: ReformatScope) {
    (this as any).reformatScope = scope;
  }

  public setSlashOrder(order: 'skip' | 'dmy' | 'mdy') {
    (this as any).slashOrder = order;
  }

  public testApplyReformat(
    file: TFile,
    entry: ReturnType<typeof this.testComputePreviewEntry>,
  ) {
    return this.applyReformat(file, entry);
  }
}

function createModal(
  scope: ReformatScope = 'both',
  settingsOverrides: Record<string, any> = {},
  frontmatterCache: Record<string, Record<string, any>> = {},
) {
  const plugin = createPlugin(settingsOverrides);

  const app = {
    metadataCache: {
      getFileCache: (file: TFile) => {
        const fm = frontmatterCache[file.path];
        return fm ? { frontmatter: fm } : {};
      },
    },
  } as any;

  const modal = new TestableReformatDate(app, plugin);
  modal.setScope(scope);
  return modal;
}

describe('ReformatDateModal - tryParseDate', () => {
  it('parses ISO 8601 datetime', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('2024-01-15T10:30:00');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
    expect(date!.getHours()).toBe(10);
    expect(date!.getMinutes()).toBe(30);
  });

  it('parses ISO 8601 date only', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('2024-01-15');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
  });

  it('parses European dot format (dd.MM.yyyy)', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('15.01.2024');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
  });

  it('parses European dot format with time', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('15.01.2024 10:30:00');

    expect(date).toBeDefined();
    expect(date!.getHours()).toBe(10);
    expect(date!.getMinutes()).toBe(30);
  });

  it('parses numeric timestamp', () => {
    const ts = new Date(2024, 0, 15).getTime();
    const modal = createModal();
    const date = modal.testTryParseDate(ts);

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
  });

  it('returns undefined for NaN numeric input', () => {
    const modal = createModal();
    const date = modal.testTryParseDate(NaN);

    expect(date).toBeUndefined();
  });

  it('returns undefined for unparseable string', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('not-a-date');

    expect(date).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('');

    expect(date).toBeUndefined();
  });

  it('parses slash-separated format (yyyy/MM/dd)', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('2024/01/15');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getDate()).toBe(15);
  });

  it('parses compact format (yyyyMMdd)', () => {
    const modal = createModal();
    const date = modal.testTryParseDate('20240115');

    expect(date).toBeDefined();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(15);
  });

  it('parses 10-digit Unix seconds number as seconds (2024), not 1970', () => {
    const modal = createModal('both', { timezone: 'UTC' });
    const date = modal.testTryParseDate(1712916000);

    expect(date).toBeDefined();
    expect(date!.getUTCFullYear()).toBe(2024);
    expect(date!.getUTCMonth()).toBe(3); // April
    expect(date!.getUTCDate()).toBe(12);
  });

  it('parses Unix seconds numeric string as seconds (2024), not 1970', () => {
    const modal = createModal('both', { timezone: 'UTC' });
    const date = modal.testTryParseDate('1712916000');

    expect(date).toBeDefined();
    expect(date!.getUTCFullYear()).toBe(2024);
  });
});

describe('ReformatDateModal - computePreviewEntry', () => {
  it('converts ISO date to new format', () => {
    const modal = createModal(
      'both',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': {
          created: '2024-01-15T10:30:00',
          updated: '2024-06-20T14:00:00',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('15.01.2024');
    expect(entry.updatedNewValue).toBe('20.06.2024');
    expect(entry.createdError).toBe(false);
    expect(entry.updatedError).toBe(false);
  });

  it('marks error for unparseable dates', () => {
    const modal = createModal(
      'both',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: 'garbage', updated: '2024-06-20' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.createdError).toBe(true);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.updatedNewValue).toBe('20.06.2024');
    expect(entry.willChange).toBe(true);
  });

  it('skips when value already in target format', () => {
    const modal = createModal(
      'both',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss" },
      {
        'test.md': {
          created: '2024-01-15T10:30:00',
          updated: '2024-06-20T14:00:00',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(false);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.updatedNewValue).toBeNull();
  });

  it('only processes created when scope is created', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: '2024-01-15', updated: '2024-06-20' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.createdNewValue).toBe('15.01.2024');
    expect(entry.updatedOldValue).toBeNull();
    expect(entry.updatedNewValue).toBeNull();
  });

  it('only processes updated when scope is updated', () => {
    const modal = createModal(
      'updated',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: '2024-01-15', updated: '2024-06-20' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.createdOldValue).toBeNull();
    expect(entry.createdNewValue).toBeNull();
    expect(entry.updatedNewValue).toBe('20.06.2024');
  });

  it('willChange is false when no frontmatter', () => {
    const modal = createModal('both', { dateFormat: 'dd.MM.yyyy' });
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(false);
    expect(entry.createdOldValue).toBeNull();
    expect(entry.updatedOldValue).toBeNull();
  });

  it('willChange is false when keys are absent', () => {
    const modal = createModal(
      'both',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { title: 'Test' },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(false);
  });

  it('uses custom key names from settings', () => {
    const modal = createModal(
      'both',
      {
        dateFormat: 'dd.MM.yyyy',
        headerCreated: 'date_created',
        headerUpdated: 'date_modified',
      },
      {
        'test.md': {
          date_created: '2024-01-15',
          date_modified: '2024-06-20',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('15.01.2024');
    expect(entry.updatedNewValue).toBe('20.06.2024');
  });

  it('handles numeric epoch timestamps', () => {
    const ts = new Date(2024, 0, 15, 12, 0, 0).getTime();
    const modal = createModal(
      'created',
      { dateFormat: 'dd.MM.yyyy' },
      {
        'test.md': { created: ts },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('15.01.2024');
  });

  it('does not collapse Unix-seconds values when reformatting to t', () => {
    // Regression: a value already stored as Unix seconds must round-trip
    // unchanged, not get re-interpreted as ms (~1970) and rewritten as 1712916.
    const modal = createModal(
      'created',
      { dateFormat: 't', enableNumberProperties: true, timezone: 'UTC' },
      {
        'test.md': { created: 1712916000 },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.createdNewValue).toBeNull();
    expect(entry.willChange).toBe(false);
  });

  it('converts European dot format to ISO', () => {
    const modal = createModal(
      'both',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss" },
      {
        'test.md': {
          created: '15.01.2024 10:30:00',
          updated: '20.06.2024 14:00:00',
        },
      },
    );
    const file = createMockFile('test.md');
    const entry = modal.testComputePreviewEntry(file);

    expect(entry.willChange).toBe(true);
    expect(entry.createdNewValue).toBe('2024-01-15T10:30:00');
    expect(entry.updatedNewValue).toBe('2024-06-20T14:00:00');
  });
});

describe('ReformatDateModal - applyReformat write contract', () => {
  it('writes without preserving mtime and records the self-trigger guard + cache', async () => {
    const plugin = createPlugin({ dateFormat: 'dd.MM.yyyy' });
    const cacheCalls: string[] = [];
    (plugin as any).populateCacheForFile = async (f: TFile) => {
      cacheCalls.push(f.path);
    };

    const file = createMockFile('test.md');
    let captured: { argCount: number; options: unknown } | null = null;
    const app = {
      metadataCache: {
        getFileCache: () => ({
          frontmatter: {
            created: '2024-01-15T10:30:00',
            updated: '2024-06-20T14:00:00',
          },
        }),
      },
      vault: { getAbstractFileByPath: () => file },
      fileManager: {
        processFrontMatter: async (...args: unknown[]) => {
          captured = { argCount: args.length, options: args[2] };
          (args[1] as (fm: Record<string, unknown>) => void)({});
        },
      },
    } as any;

    const modal = new TestableReformatDate(app, plugin);
    modal.setScope('both');
    const entry = modal.testComputePreviewEntry(file);
    await modal.testApplyReformat(file, entry);

    // Contract: no { ctime, mtime } options argument is passed.
    expect(captured!.options).toBeUndefined();
    // Contract: self-triggered modify event is suppressed via lastPluginWriteMtime.
    expect(plugin.lastPluginWriteMtime.get('test.md')).toBe(file.stat.mtime);
    // Contract: hash cache is refreshed so the stale-cache spurious update cannot fire.
    expect(cacheCalls).toContain('test.md');
  });
});

describe('ReformatDateModal - timezone-aware parsing (regression)', () => {
  // The bug (parse uses host zone, formatDate uses settings.timezone) only
  // manifests when settings.timezone differs from the host zone. Pin the host
  // zone to UTC so the regression is deterministic on any machine; Node honors
  // runtime TZ changes for subsequent Date operations.
  beforeAll(() => {
    vi.stubEnv('TZ', 'UTC');
  });
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('does not rewrite a value already in the target format (no spurious shift)', () => {
    const modal = createModal(
      'created',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss", timezone: 'America/New_York' },
      { 'test.md': { created: '2024-01-15T10:30:00' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // Parse and format must share the configured zone, so a value already in the
    // target format round-trips unchanged instead of shifting by the tz offset.
    expect(entry.createdNewValue).toBeNull();
    expect(entry.willChange).toBe(false);
  });

  it('keeps a date-only value on the same calendar day', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'America/New_York' },
      { 'test.md': { created: '2024-01-15' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // Must NOT become 2024-01-14 (the prev-day shift under a host-zone parse).
    expect(entry.createdNewValue).toBeNull();
    expect(entry.willChange).toBe(false);
  });

  it('preserves the wall clock when reformatting a naive datetime to another format', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'dd.MM.yyyy HH:mm', timezone: 'America/New_York' },
      { 'test.md': { created: '2024-01-15T10:30:00' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // 10:30 in the configured zone stays 10:30 (not 05:30 under a host parse).
    expect(entry.createdNewValue).toBe('15.01.2024 10:30');
    expect(entry.willChange).toBe(true);
  });

  it('parses a space-separated ISO variant in the configured zone', () => {
    const modal = createModal(
      'created',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss", timezone: 'America/New_York' },
      { 'test.md': { created: '2024-01-15 10:30:00' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdNewValue).toBe('2024-01-15T10:30:00');
  });

  it('respects an explicit offset in the source value', () => {
    const modal = createModal(
      'created',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss", timezone: 'America/New_York' },
      { 'test.md': { created: '2024-01-15T10:30:00+05:00' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // 10:30 at +05:00 == 05:30Z == 00:30 in New York (EST). Offset not discarded.
    expect(entry.createdNewValue).toBe('2024-01-15T00:30:00');
  });

  it('still parses the European dot format via the format loop', () => {
    const modal = createModal(
      'created',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss", timezone: 'America/New_York' },
      { 'test.md': { created: '15.01.2024 10:30:00' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdNewValue).toBe('2024-01-15T10:30:00');
  });

  it('does not re-anchor numeric epoch values (absolute instant preserved)', () => {
    const modal = createModal(
      'created',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss", timezone: 'America/New_York' },
      { 'test.md': { created: 1712916000000 } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // 1712916000000 ms = 2024-04-12T10:00:00Z = 06:00 in New York (EDT).
    expect(entry.createdNewValue).toBe('2024-04-12T06:00:00');
  });

  it('normalizes a non-existent DST spring-forward time forward, not backward', () => {
    const modal = createModal(
      'created',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss", timezone: 'America/New_York' },
      { 'test.md': { created: '2024-03-10T02:30:00' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // 02:30 does not exist on the NY spring-forward day; it normalizes to 03:30,
    // NOT the previous day (2024-03-09T21:30:00) a host-zone parse would yield.
    expect(entry.createdNewValue).toBe('2024-03-10T03:30:00');
  });

  it('does not regress the default (empty) timezone round-trip', () => {
    const modal = createModal(
      'created',
      { dateFormat: "yyyy-MM-dd'T'HH:mm:ss", timezone: '' },
      { 'test.md': { created: '2024-01-15T10:30:00' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // With no configured zone, parse and format both use the host zone, so a
    // value already in the target format is left untouched (host-independent).
    expect(entry.willChange).toBe(false);
  });
});

describe('ReformatDateModal - ambiguous slash/dot dates', () => {
  it('leaves an ambiguous slash date unchanged by default and flags it', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: '01/05/2024' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // Default order is skip: never silently pick day-first or month-first.
    expect(entry.createdAmbiguous).toBe(true);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.createdError).toBe(false);
    expect(entry.willChange).toBe(false);
  });

  it('reads an ambiguous slash date month-first when order is mdy', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: '01/05/2024' } },
    );
    modal.setSlashOrder('mdy');
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdAmbiguous).toBe(true);
    expect(entry.createdNewValue).toBe('2024-01-05');
    expect(entry.willChange).toBe(true);
  });

  it('reads an ambiguous slash date day-first when order is dmy', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: '01/05/2024' } },
    );
    modal.setSlashOrder('dmy');
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdNewValue).toBe('2024-05-01');
    // The flag must be set even when converted, so the row can be marked [check].
    // This also distinguishes the new path from the old day-first-by-default bug,
    // which produced the same value but never flagged ambiguity.
    expect(entry.createdAmbiguous).toBe(true);
    expect(entry.willChange).toBe(true);
  });

  it('flags but does not change an ambiguous value that re-formats to itself', () => {
    // Target format equals the source shape: 01/05/2024 read day-first is May 1,
    // which formats back to 01/05/2024 - a no-op, yet still ambiguous.
    const modal = createModal(
      'created',
      { dateFormat: 'dd/MM/yyyy', timezone: 'UTC' },
      { 'test.md': { created: '01/05/2024' } },
    );
    modal.setSlashOrder('dmy');
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdAmbiguous).toBe(true);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.willChange).toBe(false);
  });

  it('still converts an unambiguous day-first slash date under the skip default', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: '25/12/2024' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdAmbiguous).toBe(false);
    expect(entry.createdNewValue).toBe('2024-12-25');
    expect(entry.willChange).toBe(true);
  });

  it('still converts an unambiguous month-first slash date under the skip default', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: '12/25/2024' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdAmbiguous).toBe(false);
    expect(entry.createdNewValue).toBe('2024-12-25');
    expect(entry.willChange).toBe(true);
  });

  it('treats a genuinely unparseable value as an error, not a deliberate skip', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: 'garbage' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdError).toBe(true);
    expect(entry.createdAmbiguous).toBe(false);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.willChange).toBe(false);
  });

  it('skips an ambiguous field while converting an unambiguous field in the same note', () => {
    const modal = createModal(
      'both',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: '01/05/2024', updated: '25/12/2024' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    // created is ambiguous -> left unchanged + flagged; updated is unambiguous -> converted.
    expect(entry.createdAmbiguous).toBe(true);
    expect(entry.createdNewValue).toBeNull();
    expect(entry.updatedAmbiguous).toBe(false);
    expect(entry.updatedNewValue).toBe('2024-12-25');
    expect(entry.willChange).toBe(true);
  });

  it('applies the same skip-and-flag handling to ambiguous dot dates', () => {
    const modal = createModal(
      'created',
      { dateFormat: 'yyyy-MM-dd', timezone: 'UTC' },
      { 'test.md': { created: '01.05.2024' } },
    );
    const entry = modal.testComputePreviewEntry(createMockFile('test.md'));

    expect(entry.createdAmbiguous).toBe(true);
    expect(entry.createdNewValue).toBeNull();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { createPlugin } from './helpers';
import { TFile } from 'obsidian';

function createTFile(path: string): TFile {
  const file = new TFile();
  file.path = path;
  file.name = path.split('/').pop() || '';
  file.extension = file.name.split('.').pop() || '';
  file.basename = file.name.replace(/\.[^.]+$/, '');
  return file;
}

function createPluginWithVaultRead(
  settings: Parameters<typeof createPlugin>[0] = {},
  fileContent = 'some content',
) {
  const plugin = createPlugin(settings);
  plugin.recompileFilterRules();
  plugin.app = {
    vault: {
      read: vi.fn().mockResolvedValue(fileContent),
    },
  };
  return plugin;
}

describe('shouldFileBeIgnored - filter rules (exclude)', () => {
  it('does not ignore a markdown file outside excluded patterns', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: 'excluded/',
    });
    const file = createTFile('notes/test.md');
    const result = await plugin.shouldFileBeIgnored(file);
    expect(result.ignored).toBe(false);
    expect(result.fileContent).toBeDefined();
  });

  it('ignores a markdown file matching an exclude pattern', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: 'excluded/',
    });
    const file = createTFile('excluded/test.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('ignores files in nested subfolders of excluded folder', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: 'templates',
    });
    const file = createTFile('templates/daily/2024-01-01.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('does NOT ignore similarly-named folders', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: 'templates',
    });
    const file = createTFile('templates2/note.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(false);
  });

  it('ignores non-md files', async () => {
    const plugin = createPluginWithVaultRead();
    const file = createTFile('data/file.json');
    file.extension = 'json';
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('ignores empty files', async () => {
    const plugin = createPluginWithVaultRead({}, '');
    const file = createTFile('notes/empty.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('ignores whitespace-only files', async () => {
    const plugin = createPluginWithVaultRead({}, '   \n  ');
    const file = createTFile('notes/whitespace.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('does not ignore normal md file with no rules', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '',
    });
    const file = createTFile('notes/hello.md');
    const result = await plugin.shouldFileBeIgnored(file);
    expect(result.ignored).toBe(false);
    expect(result.fileContent).toBeDefined();
  });
});

describe('shouldFileBeIgnored - filter rules (allowlist via ** + !)', () => {
  it('empty filterRules does not filter anything', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '',
    });
    const file = createTFile('anywhere/note.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(false);
  });

  it('file matching re-include pattern is NOT ignored', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '**\n!Projects/',
    });
    const file = createTFile('Projects/task.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(false);
  });

  it('file not matching re-include pattern IS ignored', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '**\n!Projects/',
    });
    const file = createTFile('Random/note.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('multiple re-include patterns', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '**\n!Projects/\n!Notes/',
    });
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('Projects/a.md'))).ignored,
    ).toBe(false);
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('Notes/b.md'))).ignored,
    ).toBe(false);
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('Archive/c.md'))).ignored,
    ).toBe(true);
  });

  it('nested subfolders of re-included folder are included', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '**\n!Projects/',
    });
    const file = createTFile('Projects/sub/deep/note.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(false);
  });
});

describe('shouldFileBeIgnored - negate (re-include) rules', () => {
  it('negate re-includes a previously excluded subfolder', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: 'templates/\n!templates/daily/',
    });
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('templates/note.md')))
        .ignored,
    ).toBe(true);
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('templates/daily/note.md')))
        .ignored,
    ).toBe(false);
  });

  it('last matching rule wins', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: 'templates/\n!templates/daily/\ntemplates/daily/secret/',
    });
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('templates/daily/note.md')))
        .ignored,
    ).toBe(false);
    expect(
      (
        await plugin.shouldFileBeIgnored(
          createTFile('templates/daily/secret/note.md'),
        )
      ).ignored,
    ).toBe(true);
  });
});

describe('shouldFileBeIgnored - Canvas.md handling', () => {
  it('ignores Canvas.md (exact case)', async () => {
    const plugin = createPluginWithVaultRead();
    const file = createTFile('Canvas.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('ignores canvas.md (lowercase)', async () => {
    const plugin = createPluginWithVaultRead();
    const file = createTFile('canvas.md');
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });

  it('ignores CANVAS.MD (uppercase)', async () => {
    const plugin = createPluginWithVaultRead();
    const file = createTFile('CANVAS.MD');
    file.extension = 'md';
    expect((await plugin.shouldFileBeIgnored(file)).ignored).toBe(true);
  });
});

describe('shouldFileBeIgnored - performance: filter rules before file read', () => {
  it('does not read file when excluded by filter rules', async () => {
    const readSpy = vi.fn().mockResolvedValue('some content');
    const plugin = createPlugin({
      filterRules: 'excluded',
    });
    plugin.recompileFilterRules();
    plugin.app = { vault: { read: readSpy } };
    const file = createTFile('excluded/test.md');
    await plugin.shouldFileBeIgnored(file);
    expect(readSpy).not.toHaveBeenCalled();
  });

  it('does not read file when excluded by allowlist rules', async () => {
    const readSpy = vi.fn().mockResolvedValue('some content');
    const plugin = createPlugin({
      filterRules: '**\n!Projects/',
    });
    plugin.recompileFilterRules();
    plugin.app = { vault: { read: readSpy } };
    const file = createTFile('Random/note.md');
    await plugin.shouldFileBeIgnored(file);
    expect(readSpy).not.toHaveBeenCalled();
  });
});

describe('shouldFileBeIgnored - glob patterns in filter rules', () => {
  it('glob pattern excludes matching files', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '**/README.md',
    });
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('docs/README.md'))).ignored,
    ).toBe(true);
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('docs/guide.md'))).ignored,
    ).toBe(false);
  });

  it('mix of plain folder and glob in filter rules', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: 'archive\n**/README.md',
    });
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('archive/old.md'))).ignored,
    ).toBe(true);
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('notes/README.md')))
        .ignored,
    ).toBe(true);
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('notes/guide.md'))).ignored,
    ).toBe(false);
  });

  it('allowlist + specific exclude via filter rules', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '**\n!Projects/\n**/*.excalidraw.md',
    });
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('Projects/task.md')))
        .ignored,
    ).toBe(false);
    expect(
      (
        await plugin.shouldFileBeIgnored(
          createTFile('Projects/diagram.excalidraw.md'),
        )
      ).ignored,
    ).toBe(true);
  });

  it('comments and blank lines are ignored', async () => {
    const plugin = createPluginWithVaultRead({
      filterRules: '# This is a comment\n\ntemplates/\n\n# Another comment',
    });
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('templates/note.md')))
        .ignored,
    ).toBe(true);
    expect(
      (await plugin.shouldFileBeIgnored(createTFile('notes/note.md'))).ignored,
    ).toBe(false);
  });
});

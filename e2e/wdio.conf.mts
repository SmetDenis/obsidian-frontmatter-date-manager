import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '..');

// WebdriverIO config for end-to-end tests against a real Obsidian instance.
// wdio-obsidian-service downloads Obsidian, sandboxes it, copies the vault
// fixture, installs + enables our built plugin, and exposes Obsidian helpers
// (browser.executeObsidian / executeObsidianCommand, obsidianPage.*).
export const config: WebdriverIO.Config = {
  runner: 'local',
  framework: 'mocha',
  // Spec glob is resolved relative to this config file.
  specs: ['./specs/**/*.e2e.ts'],
  maxInstances: 1,

  capabilities: [
    {
      browserName: 'obsidian',
      // App version of Obsidian to download and run. Pinned to 1.12.7 - the
      // newest PUBLIC release of the 1.12.x line we type against (the `obsidian`
      // types are pinned ~1.12.3 in package.json, i.e. >=1.12.3 <1.13.0).
      // We pin to a concrete version (not "latest") to keep e2e off 1.13.x,
      // which is catalyst/insider-only. Older 1.12 patches (1.12.3-1.12.6) are
      // flagged beta in the launcher catalog and need an Insiders account to
      // download, so 1.12.7 is the oldest exact 1.12 version freely runnable.
      browserVersion: '1.12.7',
      'wdio:obsidianOptions': {
        // Oldest installer compatible with the app version - fastest to grab.
        installerVersion: 'earliest',
        // Built plugin dir: esbuild outputs main.js + manifest.json here.
        plugins: [path.resolve(repoRoot, 'dist')],
        // Vault fixture; copied per run, so tests never touch the original.
        vault: path.resolve(dirname, 'vaults', 'simple'),
      },
    },
  ],

  services: ['obsidian'],
  reporters: ['obsidian'],

  mochaOpts: {
    ui: 'bdd',
    // Real Obsidian launch + first download can be slow.
    timeout: 120_000,
  },
};

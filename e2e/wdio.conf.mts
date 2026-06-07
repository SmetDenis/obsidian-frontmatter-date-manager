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
      // App version of Obsidian to download and run.
      browserVersion: 'latest',
      'wdio:obsidianOptions': {
        // Oldest installer compatible with the app version — fastest to grab.
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

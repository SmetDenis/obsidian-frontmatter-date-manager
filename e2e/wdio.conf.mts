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
      'browserName': 'obsidian',
      // App version of Obsidian to download and run. Pinned to 1.13.4 - the
      // public release of the 1.13 line we type against (the `obsidian` types
      // are pinned ~1.13.1 in package.json) and the version that matches the
      // plugin's minAppVersion 1.13.0 floor. We pin a concrete version (not
      // "latest") for reproducibility; 1.13.4 is the only 1.13.x flagged
      // public in the launcher catalog (1.13.0-1.13.3 and 1.13.5+ are
      // catalyst/insider-only betas), so it is the one freely runnable pick.
      'browserVersion': '1.13.4',
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

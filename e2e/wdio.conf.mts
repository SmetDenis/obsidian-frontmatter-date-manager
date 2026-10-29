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
      // App version of Obsidian to download and run. Pinned to 1.14.5 - the
      // current public release (latest on obsidianmd/obsidian-releases since
      // 2026-10-22), i.e. what users actually run. We pin a concrete version
      // (not "latest") for reproducibility; bump it deliberately, re-running
      // the whole suite. The plugin's minAppVersion 1.13.0 floor is NOT run
      // here: the plugin uses only 1.13 APIs (the `obsidian` types stay
      // pinned ~1.13.1 in package.json), so a behaviour difference specific
      // to Obsidian 1.13 would go unnoticed - an accepted trade-off.
      'browserVersion': '1.14.5',
      'wdio:obsidianOptions': {
        // Oldest installer compatible with the app version - fastest to grab.
        installerVersion: 'earliest',
        // Built plugin dir: esbuild outputs main.js + manifest.json here.
        // The real Excalidraw community plugin is installed alongside but
        // starts DISABLED - only excalidraw.e2e.ts enables it (and disables it
        // again), so every other spec runs exactly as before. Version pinned
        // for reproducibility (it is the version whose sources the write-guard
        // analysis was verified against); bump deliberately, re-running the
        // excalidraw spec. First run downloads the release into the launcher
        // cache (network required).
        plugins: [
          path.resolve(repoRoot, 'dist'),
          { id: 'obsidian-excalidraw-plugin', version: '2.26.4', enabled: false },
        ],
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

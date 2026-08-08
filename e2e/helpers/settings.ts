import { browser } from '@wdio/globals';

const PLUGIN_ID = 'frontmatter-date-manager';

/** Patch the running plugin's settings to a known state for a test. */
export async function setSettings(
  patch: Record<string, unknown>,
): Promise<void> {
  await browser.executeObsidian(
    ({ app }, id, p) => {
      const internal = app as unknown as {
        plugins: {
          plugins: Record<
            string,
            {
              settings?: Record<string, unknown>;
              recompileFilterRules?: () => void;
              settingsTab?: { update(): void } | null;
            }
          >;
        };
      };
      const plugin = internal.plugins.plugins[id];
      if (!plugin?.settings) throw new Error(`plugin ${id} not loaded`);
      Object.assign(plugin.settings, p);
      plugin.recompileFilterRules?.();
      // The declarative settings tree is a snapshot - rebuild it so the tab
      // reflects the patched values (mirrors onExternalSettingsChange).
      plugin.settingsTab?.update();
    },
    PLUGIN_ID,
    patch,
  );
}

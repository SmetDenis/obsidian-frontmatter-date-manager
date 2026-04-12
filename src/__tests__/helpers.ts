import FrontmatterDateManagerPlugin from '../main';
import { DEFAULT_SETTINGS, FrontmatterDateManagerSettings } from '../Settings';

export function createPlugin(
  overrides: Partial<FrontmatterDateManagerSettings> = {},
): FrontmatterDateManagerPlugin {
  const plugin = new FrontmatterDateManagerPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, ...overrides };
  return plugin;
}

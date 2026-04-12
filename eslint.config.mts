import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        __DEV_MODE__: 'readonly',
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.json'],
      },
    },
  },
  ...obsidianmd.configs.recommended,
  {
    files: ['package.json'],
    rules: {
      // builtin-modules and dotenv are dev-only build tools, not bundled with the plugin
      'depend/ban-dependencies': 'off',
    },
  },
  globalIgnores([
    'node_modules',
    'dist',
    'esbuild.config.mjs',
    'version-bump.mjs',
    'versions.json',
    'main.js',
    'src/__tests__/**',
    'src/__mocks__/**',
    'vitest.config.ts',
    'tmp/**',
  ]),
);

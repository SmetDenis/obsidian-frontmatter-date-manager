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
    files: ['**/*.ts'],
    rules: {
      // Catch real bugs
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreVoidOperator: true },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',

      // Promote warn -> error (clean output)
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      'no-self-compare': 'error',
    },
  },
  {
    files: ['package.json'],
    rules: {
      // builtin-modules and dotenv are dev-only build tools, not bundled with the plugin
      'depend/ban-dependencies': 'off',
      // In recommended 0.3.0 this type-aware rule leaks into the global rule set, so it
      // also runs on package.json (parsed by the JSON language, not @typescript-eslint/
      // parser) and crashes in getParserServices(). It only makes sense on TS files.
      'obsidianmd/no-plugin-as-component': 'off',
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

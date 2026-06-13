import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import globals from 'globals';
import { globalIgnores } from 'eslint/config';

// This config is deliberately a STRICT SUPERSET of the Obsidian review bot:
//   1. `...obsidianmd.configs.recommended` is the bot's exact ruleset, so
//      `make lint` flags everything the bot would — including across e2e/,
//      which is intentionally NOT excluded. Only genuinely un-lintable files
//      (build scripts, the .mts runner config, tsconfig-excluded test/mock
//      dirs) are ignored below.
//   2. The `**/*.ts` block then promotes/adds rules the bot does not run, so
//      local linting is at least as strict as the bot — never looser. One of
//      those is `@eslint-community/eslint-comments/require-description`: the
//      Obsidian review runs it (it is NOT part of obsidianmd's published
//      ruleset, so a bare directive comment passed `make lint` locally yet
//      failed review). Mirroring it here closes that gap.
// Keep it that way: never weaken an obsidianmd rule here, and never add a
// global that would hide a bot failure. Mocha's describe/it stay OUT of the
// shared globals: the review lints e2e/ under its OWN config (no describe/it
// globals, `no-undef` ON), so each spec MUST declare them inline with
// `/* global describe, it */` or `no-undef` fails upstream — putting them in
// this config would suppress that locally but not on review. That inline
// directive, in turn, must carry a `-- <reason>` description to satisfy
// require-description (above); a bare `/* global ... */` is now a lint error.
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
    plugins: {
      // Provides require-description below; obsidianmd does not bundle it.
      '@eslint-community/eslint-comments': { rules: eslintComments.rules },
    },
    rules: {
      // Stricter than the obsidianmd bot: every directive comment (e.g. the
      // specs' `/* global describe, it */`) must explain itself via `-- ...`,
      // matching the Obsidian review's own require-description finding.
      '@eslint-community/eslint-comments/require-description': 'error',

      // Stricter than the obsidianmd bot: extra real-bug catchers it omits.
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
    // wdio runner config (TS-typed .mts); the obsidianmd TS parser only covers
    // **/*.ts, so .mts is treated like the other excluded runner/build configs.
    'e2e/wdio.conf.mts',
    'tmp/**',
  ]),
);

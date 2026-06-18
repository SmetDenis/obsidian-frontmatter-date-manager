# Project Overview - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). Primary AI entry point: [`index.md`](./index.md).

## Purpose

Frontmatter Date Manager is an Obsidian community plugin that automatically maintains date properties in note frontmatter:

- **`created`** - stamped once, when a note is first created (sourced from the file's `ctime`).
- **`updated`** - bumped when the note's content actually changes (sourced from `mtime`).
- **`viewed`** - last-opened date, stamped on file open (opt-in, disabled by default).

The core problem it solves: sync services, backup tools, and other plugins frequently rewrite files **without changing their content**, which resets the filesystem dates and makes "when did I last edit this?" unanswerable. The plugin writes dates into each note's own properties and uses **SHA-256 content hashing** to distinguish real edits from sync artifacts.

It also ships **five bulk tools** (opened from the settings tab) to retrofit and maintain dates across an entire vault:

1. Populate timestamps from filesystem dates (`ctime`/`mtime`).
2. Rename a frontmatter property across all notes.
3. Reformat existing date strings into the configured format.
4. Find and fix out-of-order dates (`updated` earlier than `created`).
5. Rebuild the change-detection hash cache.

## Executive summary

| Aspect | Value |
| --- | --- |
| Project type | Obsidian plugin (editor extension) |
| Repository structure | Monolith, single part |
| Primary language | TypeScript (strict) |
| Bundle | esbuild -> `dist/main.js` (CJS, ES2018) |
| Entry point | `src/main.ts` (`FrontmatterDateManagerPlugin extends Plugin`) |
| UI | `PluginSettingTab` + 5 `Modal`-derived bulk wizards |
| Persistence | `data.json` (settings) + `hash-cache.json` (content hashes) |
| Mobile support | Yes (`isDesktopOnly: false`) |
| Min Obsidian version | 1.11.0 (raised from 1.4.11 for `getLanguage()` i18n detection) |
| Current version | 1.1.1 |
| Distribution | Obsidian community plugin store, via GitHub release assets |

## Tech stack summary

| Category | Technology | Version |
| --- | --- | --- |
| Language | TypeScript | 6.0.3 |
| Plugin API | obsidian | ~1.12.3 (pinned, tilde) |
| Dates | date-fns | 4.4.0 |
| Timezones | @date-fns/tz | ^1.5.0 |
| Hashing | js-sha256 | ^0.11.1 |
| Glob filters | picomatch | ^4.0.4 |
| Bundler | esbuild | 0.28.1 |
| CSS | lightningcss | ^1.32.0 |
| Unit tests | vitest | ^4.1.8 |
| E2E | WebdriverIO + wdio-obsidian-service | ^9.27.2 / ^3.0.4 |
| Lint | eslint-plugin-obsidianmd | 0.3.0 |
| Format | prettier | 3.8.3 |

## Architecture type

Event-driven, single-bundle Obsidian plugin. The plugin subscribes to vault events (`create`, `modify`, `rename`, `delete`) plus the workspace `file-open` event, and reacts through a hash-gated, debounced pipeline that only writes when a real change is detected. Bulk operations are a separate, opt-in, dry-run-gated subsystem built on a shared modal/render/scan/execute toolkit. See [`architecture.md`](./architecture.md).

## Key documents

- [Architecture](./architecture.md) - the file-modification pipeline, safety invariant, hash cache, bulk subsystem.
- [Source Tree Analysis](./source-tree-analysis.md) - annotated directory layout.
- [Component Inventory](./component-inventory.md) - modules, modals, pure helpers.
- [Development Guide](./development-guide.md) - setup, build, test commands.
- [Deployment Guide](./deployment-guide.md) - the release pipeline and tag convention.
- [Contribution Guide](./contribution-guide.md) - workflow and review requirements.

## Existing project memory

- `CLAUDE.md` (repo root) - the authoritative, very detailed engineering memory: safety principles, key patterns, Obsidian review requirements, UI/CSS conventions. This generated documentation summarizes and indexes it; `CLAUDE.md` remains the source of truth for day-to-day implementation rules.
- `.bmad/project-context.md` - lean LLM-optimized rule digest.
- `README.md` - user-facing feature documentation and screenshots.

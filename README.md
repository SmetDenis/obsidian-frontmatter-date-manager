# Obsidian - Frontmatter Date Manager

[![CI](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SmetDenis/obsidian-frontmatter-date-manager)](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/releases/latest)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.4.11+-7C3AED)](https://obsidian.md)
[![License: MIT](https://img.shields.io/github/license/SmetDenis/obsidian-frontmatter-date-manager)](LICENSE)

Automatically update `created` and `updated` dates in YAML frontmatter when editing notes in Obsidian.

## Why this plugin?

- **Manual timestamp maintenance is tedious.** Updating `created` and `updated` in frontmatter by hand every time you edit a note is error-prone and breaks your writing flow.
- **Obsidian has no built-in frontmatter date management.** It tracks `ctime`/`mtime` at the filesystem level but doesn't automatically write or maintain date properties inside your notes.
- **Sync tools cause false updates.** Obsidian Sync, iCloud, Syncthing, Dropbox, and Git-based sync modify files without real content changes. Without content hashing, every sync would trigger a timestamp update - creating noise and potentially infinite sync loops.
- **Templates and automation plugins conflict.** Templater, Daily Notes, QuickAdd, and similar plugins create and immediately modify files. Without a configurable delay, timestamps get written before the template is fully applied, resulting in incorrect dates.
- **Existing vaults lack timestamps.** When you adopt the plugin on a vault with hundreds or thousands of notes, you need a way to bulk-populate timestamps from filesystem dates - not update each note one by one.
- **Manual entry leads to inconsistent formats.** Different notes end up with `2024-01-15`, `Jan 15, 2024`, `15.01.2024`, and other variations. The plugin enforces a single configurable format across the entire vault.

## Features

- Auto-update `updated` field on file modification (syncs with `mtime`)
- Auto-set `created` field on new files (syncs with `ctime`)
- Customizable date format (uses [date-fns](https://date-fns.org/v4.1.0/docs/format) syntax)
- Timezone support with IANA timezone autocomplete
- String and number property types (number useful for Unix timestamps)
- Gitignore-style file filter rules with preview and validation
- Configurable minimum interval between updates
- Delay for newly created files (compatibility with Templater, Daily Notes, etc.)
- SHA-256 content hashing to detect real changes (prevents false updates from sync tools)
- Hash tracking mode: body only, frontmatter only, or both
- Frontmatter key exclusion from change detection
- Run a command after timestamps are updated
- Bulk-update all vault files at once
- Bulk-populate timestamps from filesystem dates (ctime/mtime) with dry-run preview
- Toggle auto-update via command palette or status bar
- Pause auto-update for 5 minutes with automatic resume
- Works on desktop and mobile

## Installation

### Manual installation

Download `main.js`, `manifest.json`, and `styles.css` from the
[latest release](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/releases/latest)
into `<vault>/.obsidian/plugins/frontmatter-date-manager/`.

### Community plugins (coming soon)

This plugin has been submitted to the Obsidian community plugin directory.
Once approved, search for **Frontmatter Date Manager** in Settings > Community plugins > Browse.

## Usage

The plugin runs automatically after installation. When you edit a markdown file, it updates the frontmatter `updated` field with the current modification time. If the `created` field is missing, it sets it to the file's creation time.

Configure behavior in **Settings -> Frontmatter Date Manager**.

### Commands

| Command                                | Description                                             |
|----------------------------------------|---------------------------------------------------------|
| **Update timestamps for current file** | Manually trigger a timestamp update for the active note |
| **Toggle auto-update on/off**          | Enable or disable automatic timestamp updates           |
| **Pause auto-update for 5 minutes**    | Temporarily pause updates with automatic resume         |

**Status bar indicator** - shows current state (`Paused` or `Paused (Xm)`); click to toggle auto-update on/off.

## Settings

| Setting                   | Default                 | Description                                                                     |
|---------------------------|-------------------------|---------------------------------------------------------------------------------|
| Enable auto-update        | `true`                  | Automatically update timestamps on file modification                            |
| File filter rules         | `""` (all files)        | Gitignore-style rules: lines exclude, `!` re-includes, `#` comments             |
| Min seconds between saves | `30`                    | Minimum interval between timestamp updates                                      |
| Delay for new files       | `5000` ms               | Wait before processing newly created files                                      |
| Date format               | `yyyy-MM-dd'T'HH:mm:ss` | Date format string ([date-fns syntax](https://date-fns.org/v4.1.0/docs/format)) |
| Timezone                  | `""` (system)           | IANA timezone identifier; empty uses system timezone                            |
| Number properties         | `false`                 | Output numbers instead of strings for numeric formats                           |
| Enable updated            | `true`                  | Write the updated timestamp to frontmatter                                      |
| Updated key               | `updated`               | Frontmatter key name for the updated timestamp                                  |
| Enable created            | `true`                  | Write the created timestamp to frontmatter                                      |
| Created key               | `created`               | Frontmatter key name for the created timestamp                                  |
| Content change detection  | `true`                  | Use SHA-256 hashing to detect actual content changes                            |
| Hash tracking mode        | `body`                  | What triggers updates: `body`, `frontmatter`, or `both`                         |
| Exclude frontmatter keys  | `[]`                    | Frontmatter keys to ignore in change detection                                  |
| Auto-populate cache       | `true`                  | Hash all uncached files when the plugin loads                                   |
| Command after update      | `""` (none)             | Obsidian command to execute after each timestamp update                         |

## Date format examples

| Format string           | Example output            |
|-------------------------|---------------------------|
| `yyyy-MM-dd'T'HH:mm:ss` | 2026-04-12T14:30:00       |
| `yyyy-MM-dd HH:mm:ss`   | 2026-04-12 14:30:00       |
| `dd.MM.yyyy HH:mm`      | 12.04.2026 14:30          |
| `t`                     | 1776268200 (Unix seconds) |
| `T`                     | 1776268200000 (Unix ms)   |

> **Note:** This plugin uses **date-fns**, not Moment.js. Common migration: `YYYY` -> `yyyy`, `DD` -> `dd`.

## License

[MIT](LICENSE)

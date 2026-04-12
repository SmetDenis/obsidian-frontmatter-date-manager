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

## FAQ

### First installation

**Will the plugin modify all my existing notes when I first enable it?**
No. The plugin only processes a file when you edit it. On first load it builds a background hash cache of your existing files to prepare for change detection, but it never writes timestamps during this process. Your vault stays untouched until you actually edit a note.

**How do I add timestamps to notes I wrote before installing?**
Use Settings → Bulk operations → Populate from filesystem. It reads filesystem dates (ctime/mtime) and writes them into frontmatter, with a dry-run preview so you can review before committing. Default mode is "Fill missing only" - existing dates are not overwritten. If your vault syncs via iCloud or Obsidian Sync, filesystem timestamps may have been reset by the sync service - review the preview carefully.

**I use Templater / Daily Notes / QuickAdd. Will the plugin conflict with them?**
No. The plugin waits 5 seconds (configurable: Settings → Behavior → Advanced → New file delay) before processing newly created files, giving template plugins time to finish.

**Do I need to add frontmatter to every note manually first?**
No. If a note has no frontmatter, the plugin creates the `---` block and inserts timestamps on the next edit. If frontmatter already exists, it adds timestamp fields alongside your existing keys.

**What date format works best with Dataview?**
The default `yyyy-MM-dd'T'HH:mm:ss` (ISO 8601) works out of the box. Dataview can parse, sort, and compare it natively.

**The plugin uses date-fns, not Moment.js. Does that affect me?**
Only if you customize the date format. Key difference: use `yyyy` (not `YYYY`) for year, `dd` (not `DD`) for day. The plugin shows a hint in settings if it detects a Moment.js-style format.

### Everyday usage

**I edited tags or aliases, but `updated` didn't change. Is that a bug?**
No. By default, hash tracking mode is "Body only" - only changes below the frontmatter block trigger a timestamp update. To include frontmatter changes, switch Settings → Change detection → Tracking mode to "Both".

**Will syncing (iCloud / Obsidian Sync / Dropbox) cause false timestamps?**
No. The plugin compares file content via SHA-256 hashing. If a sync service rewrites a file without changing its content, the hash matches and no timestamp is updated. Enabled by default.

**I renamed or moved a note. Does the plugin lose track of it?**
No. The hash cache entry is automatically migrated to the new path. Existing timestamps are preserved.

**I changed the date format. Will old timestamps be converted?**
No. Existing values stay as-is. Only new writes use the new format.

**I changed the timezone. Will old timestamps be recalculated?**
No. Same principle - old values are left untouched. New writes use the new timezone.

**What happens if a note has broken YAML frontmatter?**
The plugin skips that file and shows a notice with the file path and error details. It never writes to a file with malformed YAML. Fix the syntax and the plugin will pick it up on the next edit.

**I'm saving rapidly. Will the timestamp update on every save?**
No. There is a minimum 30-second interval between updates (configurable: 5–300 seconds) plus a 2-second debounce, so rapid edits are consolidated into a single timestamp write.

## Sync and version control

The plugin stores a local cache file `hash-cache.json` inside its data directory (`.obsidian/plugins/frontmatter-date-manager/`). This file contains SHA-256 hashes used for content change detection. It rebuilds automatically on startup, so excluding it is safe and recommended.

**Why exclude:** the cache updates on every file edit, so multiple devices modify it independently - causing frequent sync conflicts and unnecessary traffic. Since it rebuilds automatically, syncing provides no benefit.

Add to your `.gitignore`:

```
.obsidian/plugins/frontmatter-date-manager/hash-cache.json
```

For **Obsidian Sync**: the file is already excluded automatically (Sync does not sync plugin data files beyond `data.json`).

For **iCloud, Syncthing, Dropbox, or other file-based sync**: add `hash-cache.json` to your sync tool's ignore/exclusion list for the plugin directory.

## License

[MIT](LICENSE)

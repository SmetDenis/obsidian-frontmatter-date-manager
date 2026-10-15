---
id: 1
type: observation
title: The registry was migrated from format 0.157.0 to 0.176.0, so its settings now live in docs/taski/taski.json
description: 'Settings moved out of .claude/taski.json into the registry and name the project as ["../.."]; no entity changed, and the project CLAUDE.md still names the old path.'
status: verified
date: 2026-10-15
area: [release]
phase: migration
lifespan: durable
kind: chore
---

# K-01. The registry was migrated from format 0.157.0 to 0.176.0, so its settings now live in docs/taski/taski.json

<!-- taski:meta:start -->
- **Type:** 🔬 observation
- **Status:** verified
- **Date:** 2026-10-15
- **Areas:** Release, store review and tests
- **Phase:** migration
- **Lifespan:** durable
- **Kind:** 🔧 chore
<!-- taski:meta:end -->

**Fact.** On 2026-10-15 the registry was upgraded by `taski:migrate` (Route B) from the recorded `taski_version` 0.157.0 to 0.176.0, the version of the plugin doing the migration. One format entry lay in between, 0.176.0. What was transformed: the settings file moved from `.claude/taski.json` to `docs/taski/taski.json` (with `git mv`, so its history follows it); `registry.root` (`docs/taski`) was replaced by `projects: ["../.."]`; `registry` keeps `lang: en`; the vocabularies are unchanged. No task, record or question file was touched, and no link changed, because the base of the links is still the project's repository root. The machine's project list (`~/.config/taski/projects.json`) already named `docs/taski/taski.json` under the alias `fdm` before the move, so it needed no edit; the entry stopped showing as missing once the file stood there. Nothing named the old path through `--project` or `TASKI_PROJECT`. This record is filed under the `release` area because the vocabulary has no area for registry tooling and `release` is the one that covers project infrastructure.

Two exceptions to the migration procedure were sanctioned by the user for this run: the independent check from a clean context was skipped (the user asked for no review), and the project CLAUDE.md was not touched, so its taski section still says the registry is configured by `.claude/taski.json`, a file that no longer exists.

**Checked in.** Before: `taski doctor --level warning --keep-going --config .claude/taski.json` reported only the critical "settings in the form before 0.176.0" finding. After: `taski doctor --level warning --config docs/taski/taski.json` and a plain `taski doctor --level warning` from the project root (found through the machine's list) both exit 0, and `taski projects` lists `fdm` without the missing mark.

**Consequence.** From now on the registry is configured only by `docs/taski/taski.json`, which must stay committed with the registry; commands find it through the machine's project list, so another machine has to list it once with `taski projects --add docs/taski/taski.json`. The CLAUDE.md line naming `.claude/taski.json` is stale and should be corrected to the new path in a separate change.

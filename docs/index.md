# Documentation Index - Frontmatter Date Manager

> Generated: 2026-06-14 - initial scan (deep). This is the primary entry point for AI-assisted development. For a brownfield PRD, point the PRD workflow here.

## Project overview

- **Type:** Obsidian plugin (editor extension) - monolith, single part
- **Primary language:** TypeScript (strict)
- **Architecture:** event-driven plugin with a hash-gated write pipeline + opt-in dry-run-gated bulk subsystem
- **Version:** 1.1.1 - **Min Obsidian:** 1.4.11 - **Mobile:** supported

## Quick reference

- **Entry point:** `src/main.ts` (`FrontmatterDateManagerPlugin extends Plugin`)
- **Settings UI:** `src/Settings.ts` (`FrontmatterDateManagerSettingsTab.display()`)
- **Bulk tools:** five `*Modal.ts` files composing `src/bulk/` blocks
- **Tech stack:** TypeScript 6, date-fns 4 + @date-fns/tz, js-sha256, picomatch 4, esbuild, vitest, WebdriverIO
- **Build:** esbuild -> `dist/main.js` (CJS, ES2018)
- **Persistence:** `data.json` (settings) + `hash-cache.json` (content hashes)
- **Mandatory gate:** `make pre-commit`

## Generated documentation

- [Project Overview](./project-overview.md) - purpose, executive summary, tech stack, doc map
- [Architecture](./architecture.md) - safety invariant, file-modification pipeline, hash cache, bulk subsystem, testing, review compliance
- [Source Tree Analysis](./source-tree-analysis.md) - annotated directory layout, critical dirs, entry points
- [Component Inventory](./component-inventory.md) - modules, modals, pure helpers, commands, selector contract
- [Development Guide](./development-guide.md) - prerequisites, env vars, commands, build, testing, CI
- [Deployment Guide](./deployment-guide.md) - release pipeline, tag convention, version bump checklist
- [Contribution Guide](./contribution-guide.md) - workflow, commit conventions, store constraints, scope

## Existing documentation (repo root)

- [CLAUDE.md](../CLAUDE.md) - **authoritative** engineering memory (safety, key patterns, review requirements, UI/CSS conventions). Source of truth; this generated set summarizes and indexes it.
- [README.md](../README.md) - user-facing features, settings table, screenshots
- [CONTRIBUTING.md](../CONTRIBUTING.md) - full contribution hub
- [SECURITY.md](../SECURITY.md) - security policy / reporting
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- [e2e/README.md](../e2e/README.md) - e2e scenario list
- [.bmad/project-context.md](../.bmad/project-context.md) - lean LLM-optimized rule digest

## Getting started (for an AI agent or new contributor)

1. Read [CLAUDE.md](../CLAUDE.md) first - it carries the non-obvious invariants that gate every change.
2. Skim [Architecture](./architecture.md) to understand the two subsystems (automatic pipeline + bulk tools) and the core safety invariant.
3. Use [Component Inventory](./component-inventory.md) to locate where code belongs.
4. Follow [Development Guide](./development-guide.md) to set up, then always finish with `make pre-commit`.

## How this set was generated

BMad `document-project` workflow, initial scan, **deep** level (read critical `src/` files). Scan state: `docs/project-scan-report.json`. Focus areas: architecture & patterns, data safety, dev workflow & tests. Regenerate or deep-dive a specific area by re-running the `bmad-document-project` skill.

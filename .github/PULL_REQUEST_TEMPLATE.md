## Summary

<!-- What does this change, and why? Link any related issue. -->

## Type

- [ ] Bug fix
- [ ] Feature (opt-in, safe-by-default)
- [ ] Refactor / internal
- [ ] Docs / tests / tooling

## Safety checklist

- [ ] Frontmatter is mutated only through `processFrontMatter()`, and only configured keys are touched.
- [ ] Writes happen only on a real, detected change (no unconditional or no-op writes).
- [ ] Any destructive path is opt-in, defaults to safe, and gates behind a dry-run preview.

## Checklist

- [ ] `make pre-commit` passes (format, lint, typecheck-e2e, test, build).
- [ ] Added or updated unit tests for any logic change.
- [ ] Updated docs where behavior changed (`README.md`, `CLAUDE.md`, `e2e/README.md`).
- [ ] Regenerated screenshots (`make screenshots`) if a captured surface changed.
- [ ] Did not bump `obsidian` past `~1.12.3` or disable any `obsidianmd/*` rule.

---
created: 2020-01-01T00:00:00
---

# Test note

This note starts with a `created` key and no `updated` key. The E2E test runs
the "Update timestamps for current file" command and asserts that the plugin
adds an `updated` key while preserving `created`.

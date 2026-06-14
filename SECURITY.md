# Security Policy

## Supported versions

Only the latest released version is supported. Please reproduce and report issues against the most recent release before filing.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it privately through GitHub:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** (GitHub private vulnerability reporting).
3. Describe the issue, the affected version, and steps to reproduce.

If private reporting is unavailable, open a minimal public issue asking the maintainer to enable a private channel - without disclosing the vulnerability details.

You'll get an acknowledgement as soon as the report is triaged. Since this plugin only reads and writes local vault files, the most relevant reports concern note-data corruption or loss, unintended writes outside the configured keys, or unsafe handling of file contents.

import { describe, it, expect } from 'vitest';
import { createPlugin } from './helpers';
import { FrontmatterDateManagerSettings } from '../Settings';

// Characterization of the frontmatter key filter for FLAT property names.
// The expected strings were captured from the implementation that predates
// nested property paths, so they pin the hash input byte for byte: if the
// output for a flat-only configuration ever changes, every note in a vault
// tracked in "frontmatter"/"both" mode would hash differently and get a
// spurious `updated` re-stamp on its next modify event. Never regenerate
// these snapshots to make a change pass - a mismatch is a regression.

const NESTED =
  '---\ntitle: Test\nmeta:\n  updated: 2024-01-01T00:00:00\n  source: web\n  tags:\n    - a\n    - b\nmeta.updated: 2024-02-02\ncreated: 2023-01-01\nupdated: 2024-03-03\nupdated_count: 4\nedits: 2\n---\nBody';

const ZERO_INDENT_LIST =
  '---\ntags:\n- a\n- b\nupdated: 2024-01-01\naliases:\n  - x\n  - y\nstatus: draft\n---\nBody';

const BLOCK_SCALAR_AND_COMMENTS =
  '---\n# leading comment\ndescription: |\n  Line one\n  Line two\nupdated: 2024-01-01 # trailing comment\nviewed: 2024-01-05\nkeep: yes\n---\nBody';

const CRLF_NESTED =
  '---\r\nmeta:\r\n  updated: 2024-01-01\r\n  source: web\r\ncreated: 2023-01-01\r\ntitle: Test\r\n---\r\nBody';

const LIST_FORM_AND_FLOW =
  '---\nmeta:\n  - updated: 2024-01-01\n  - viewed: 2024-01-02\nparent: {updated: 2024-01-03, x: 1}\ncreated: 2023-01-01\n---\nBody';

const EMPTY_PARENT_AND_UNICODE =
  '---\nmeta:\nparent: черновик\n创建日期: 2024-01-01\napp.version: 1.2.3\nupdated: 2024-01-01\n---\nBody';

const CONFIGS: Record<string, Partial<FrontmatterDateManagerSettings>> = {
  defaultsFrontmatter: { hashTrackingMode: 'frontmatter' },
  bothWithExcludes: {
    hashTrackingMode: 'both',
    headerUpdateCount: 'edits',
    frontmatterHashExcludeKeys: ['tags', 'meta', 'app.version'],
  },
  dottedFlatNames: {
    hashTrackingMode: 'frontmatter',
    headerUpdated: 'meta.updated',
    headerLastViewed: 'meta',
    frontmatterHashExcludeKeys: ['description'],
  },
};

function hashInput(config: string, content: string): string {
  return createPlugin(CONFIGS[config]).getContentForHashing(content);
}

describe('getContentForHashing golden output for flat names', () => {
  describe('defaults, frontmatter mode', () => {
    it('nested group next to a dotted flat key', () => {
      expect(hashInput('defaultsFrontmatter', NESTED)).toMatchInlineSnapshot(`
        "title: Test
        meta:
          updated: 2024-01-01T00:00:00
          source: web
          tags:
            - a
            - b
        meta.updated: 2024-02-02
        edits: 2
        "
      `);
    });
    it('zero-indent list', () => {
      expect(hashInput('defaultsFrontmatter', ZERO_INDENT_LIST))
        .toMatchInlineSnapshot(`
        "tags:
        - a
        - b
        aliases:
          - x
          - y
        status: draft
        "
      `);
    });
    it('block scalar and comments', () => {
      expect(hashInput('defaultsFrontmatter', BLOCK_SCALAR_AND_COMMENTS))
        .toMatchInlineSnapshot(`
        "# leading comment
        description: |
          Line one
          Line two
        keep: yes
        "
      `);
    });
    it('CRLF nested group', () => {
      expect(hashInput('defaultsFrontmatter', CRLF_NESTED))
        .toMatchInlineSnapshot(`
        "meta:
          updated: 2024-01-01
          source: web
        title: Test
        "
      `);
    });
    it('list form and flow mapping', () => {
      expect(hashInput('defaultsFrontmatter', LIST_FORM_AND_FLOW))
        .toMatchInlineSnapshot(`
        "meta:
          - updated: 2024-01-01
          - viewed: 2024-01-02
        parent: {updated: 2024-01-03, x: 1}"
      `);
    });
    it('empty parent and unicode keys', () => {
      expect(hashInput('defaultsFrontmatter', EMPTY_PARENT_AND_UNICODE))
        .toMatchInlineSnapshot(`
        "meta:
        parent: черновик
        创建日期: 2024-01-01
        app.version: 1.2.3"
      `);
    });
  });

  describe('both mode with excludes and a custom counter name', () => {
    it('nested group next to a dotted flat key', () => {
      expect(hashInput('bothWithExcludes', NESTED)).toMatchInlineSnapshot(`
        "title: Test
        meta.updated: 2024-02-02
        updated_count: 4Body"
      `);
    });
    it('zero-indent list', () => {
      expect(hashInput('bothWithExcludes', ZERO_INDENT_LIST))
        .toMatchInlineSnapshot(`
        "- a
        - b
        aliases:
          - x
          - y
        status: draft
        Body"
      `);
    });
    it('block scalar and comments', () => {
      expect(hashInput('bothWithExcludes', BLOCK_SCALAR_AND_COMMENTS))
        .toMatchInlineSnapshot(`
        "# leading comment
        description: |
          Line one
          Line two
        keep: yes
        Body"
      `);
    });
    it('CRLF nested group', () => {
      expect(hashInput('bothWithExcludes', CRLF_NESTED)).toMatchInlineSnapshot(`
        "title: Test
        Body"
      `);
    });
    it('list form and flow mapping', () => {
      expect(
        hashInput('bothWithExcludes', LIST_FORM_AND_FLOW),
      ).toMatchInlineSnapshot(`"parent: {updated: 2024-01-03, x: 1}Body"`);
    });
    it('empty parent and unicode keys', () => {
      expect(hashInput('bothWithExcludes', EMPTY_PARENT_AND_UNICODE))
        .toMatchInlineSnapshot(`
        "parent: черновик
        创建日期: 2024-01-01Body"
      `);
    });
  });

  describe('dotted flat names, frontmatter mode', () => {
    it('nested group next to a dotted flat key', () => {
      expect(hashInput('dottedFlatNames', NESTED)).toMatchInlineSnapshot(`
        "title: Test
        updated: 2024-03-03
        edits: 2
        "
      `);
    });
    it('zero-indent list', () => {
      expect(hashInput('dottedFlatNames', ZERO_INDENT_LIST))
        .toMatchInlineSnapshot(`
        "tags:
        - a
        - b
        updated: 2024-01-01
        aliases:
          - x
          - y
        status: draft
        "
      `);
    });
    it('block scalar and comments', () => {
      expect(hashInput('dottedFlatNames', BLOCK_SCALAR_AND_COMMENTS))
        .toMatchInlineSnapshot(`
        "# leading comment
        updated: 2024-01-01 # trailing comment
        viewed: 2024-01-05
        keep: yes
        "
      `);
    });
    it('CRLF nested group', () => {
      expect(hashInput('dottedFlatNames', CRLF_NESTED)).toMatchInlineSnapshot(`
        "title: Test
        "
      `);
    });
    it('list form and flow mapping', () => {
      expect(
        hashInput('dottedFlatNames', LIST_FORM_AND_FLOW),
      ).toMatchInlineSnapshot(`"parent: {updated: 2024-01-03, x: 1}"`);
    });
    it('empty parent and unicode keys', () => {
      expect(hashInput('dottedFlatNames', EMPTY_PARENT_AND_UNICODE))
        .toMatchInlineSnapshot(`
        "parent: черновик
        创建日期: 2024-01-01
        app.version: 1.2.3
        updated: 2024-01-01
        "
      `);
    });
  });
});

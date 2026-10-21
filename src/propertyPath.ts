// Nested property paths. A configured property name may address a key inside
// a group with `>` between the levels: `meta > updated` is the `updated` key of
// the `meta` group, `parent > meta > viewed` goes deeper. A name without `>` is
// one top-level property exactly as before - including a name with a dot in it
// (`app.version`), because real vaults carry dotted flat keys and reading the
// dot as a separator would silently move their dates. `>` cannot start an
// unquoted YAML key and practically never appears inside one.
//
// Pure functions, no Obsidian dependency.

export const PATH_SEPARATOR = '>';

export type ParsedPropertyPath =
  | { ok: true; segments: string[] }
  | { ok: false; reason: 'empty' | 'empty-segment' };

/**
 * Split a configured property name into its levels. Spaces around each level
 * are trimmed, so a flat name resolves exactly as the old `.trim()` did. An
 * empty level (`meta >> updated`, `> updated`, `meta >`) makes the whole name
 * invalid: such a name can only arrive from a hand-edited settings file or from
 * an older plugin version where `>` was an ordinary character, and it is never
 * guessed into something writable.
 */
export function parsePropertyPath(name: unknown): ParsedPropertyPath {
  if (typeof name !== 'string' || name.trim() === '') {
    return { ok: false, reason: 'empty' };
  }
  const segments = name.split(PATH_SEPARATOR).map((part) => part.trim());
  if (segments.some((part) => part === '')) {
    return { ok: false, reason: 'empty-segment' };
  }
  return { ok: true, segments };
}

/** The display form of a path: levels joined by ` > `. */
export function formatPropertyPath(segments: string[]): string {
  return segments.join(` ${PATH_SEPARATOR} `);
}

/**
 * True for a name the settings field should explain: it has a dot but no `>`,
 * so it stays ONE property with a dot in its name - the common trap for people
 * used to the dot notation of Bases and Dataview.
 */
export function hasDotWithoutNesting(name: unknown): boolean {
  return (
    typeof name === 'string' &&
    name.includes('.') &&
    !name.includes(PATH_SEPARATOR)
  );
}

/**
 * A group is a plain YAML mapping. Lists, scalars, empty strings and empty
 * lists are not groups. A `null` value (`meta:` with nothing after it) is not a
 * group either, but it holds nothing, so writers may turn it into one.
 */
export function isGroup(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** A value the plugin must never replace with a date: a group or a list. */
export function isContainer(value: unknown): boolean {
  return Array.isArray(value) || isGroup(value);
}

// Property access goes through OWN properties only. A configured name is
// outside input (`data.json` is hand-editable and synced), and a plain `[]`
// lookup of `__proto__` or `constructor` reaches the shared Object.prototype:
// reading would mistake an inherited function for a stored value, and writing
// `__proto__ > updated` would put the date on every object in the app instead
// of into the note. `Object.hasOwn` is ES2022; the build targets ES2018.
function getOwn(node: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(node, key)
    ? node[key]
    : undefined;
}

// Creates or replaces an own data property without invoking a setter (a plain
// assignment to `__proto__` would change the object's prototype). Redefining
// an existing property keeps its position, so key order is preserved.
function setOwn(node: Record<string, unknown>, key: string, value: unknown) {
  Object.defineProperty(node, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

// Groups and lists reachable more than once from the frontmatter root. YAML
// anchors and aliases (`base: &shared {...}`, `meta: *shared`) parse into ONE
// shared object, so writing into it would also change every other property
// that refers to it.
function sharedObjects(root: unknown): Set<object> {
  const seen = new Set<object>();
  const shared = new Set<object>();
  const visit = (value: unknown) => {
    if (typeof value !== 'object' || value === null) return;
    if (seen.has(value)) {
      shared.add(value);
      return;
    }
    seen.add(value);
    const children: unknown[] = Array.isArray(value)
      ? value
      : Object.values(value);
    for (const child of children) visit(child);
  };
  visit(root);
  return shared;
}

export type BlockReason = 'parent-not-group' | 'shared-group';

export type PathRead =
  | { kind: 'value'; value: unknown }
  | { kind: 'missing' }
  | { kind: 'blocked'; reason: BlockReason; parent: string };

/**
 * Read the value at a path. `missing` when the key or any parent level is
 * absent or empty (`meta:`); `blocked` when a parent level holds something
 * that is not a group (`meta: draft`), or is a group shared with another
 * property through a YAML reference - with that parent's display path.
 */
export function readPath(
  frontmatter: Record<string, unknown> | undefined | null,
  segments: string[],
): PathRead {
  if (!isGroup(frontmatter)) return { kind: 'missing' };
  const shared = segments.length > 1 ? sharedObjects(frontmatter) : null;
  let node: Record<string, unknown> = frontmatter;
  for (let i = 0; i < segments.length - 1; i++) {
    const child = getOwn(node, segments[i]!);
    if (child === undefined || child === null) return { kind: 'missing' };
    const parent = formatPropertyPath(segments.slice(0, i + 1));
    if (!isGroup(child)) {
      return { kind: 'blocked', reason: 'parent-not-group', parent };
    }
    if (shared?.has(child)) {
      return { kind: 'blocked', reason: 'shared-group', parent };
    }
    node = child;
  }
  const value = getOwn(node, segments[segments.length - 1]!);
  return value === undefined ? { kind: 'missing' } : { kind: 'value', value };
}

export type PathWrite =
  | { kind: 'written' }
  | { kind: 'blocked'; reason: BlockReason; parent: string }
  | { kind: 'holds-container' };

/**
 * Write a value at a path, creating missing groups. A new group is appended at
 * the end of its parent and the new key at the end of its group; an empty
 * parent (`meta:`) becomes a group in place. Nothing else is touched: other
 * keys of the group and their order stay as they are.
 *
 * Refuses (and mutates nothing) when a parent level holds a non-group value or
 * a group shared with another property, or when the target itself holds a
 * group or a list - each would change or destroy data other plugins or the
 * user rely on.
 */
export function writePath(
  frontmatter: Record<string, unknown>,
  segments: string[],
  value: unknown,
): PathWrite {
  // Check the whole path first so a refusal never leaves a half-built group.
  const probe = readPath(frontmatter, segments);
  if (probe.kind === 'blocked') {
    return { kind: 'blocked', reason: probe.reason, parent: probe.parent };
  }
  if (probe.kind === 'value' && isContainer(probe.value)) {
    return { kind: 'holds-container' };
  }

  let node = frontmatter;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i]!;
    let child = getOwn(node, key);
    if (!isGroup(child)) {
      // Absent or empty: the probe above ruled out every other value.
      child = {};
      setOwn(node, key, child);
    }
    node = child as Record<string, unknown>;
  }
  setOwn(node, segments[segments.length - 1]!, value);
  return { kind: 'written' };
}

/**
 * How two paths collide: `equal` (the same key), `prefix` (one is a group the
 * other writes into - `meta` and `meta > updated`), or null.
 */
export function pathConflict(
  a: string[],
  b: string[],
): 'equal' | 'prefix' | null {
  const shared = Math.min(a.length, b.length);
  for (let i = 0; i < shared; i++) {
    if (a[i] !== b[i]) return null;
  }
  return a.length === b.length ? 'equal' : 'prefix';
}

// Where one plugin-managed property is written. `name` is its display form;
// `path` is null when nothing may be written there, and `invalid` says the
// configured name is not a valid path (an empty level, e.g. `meta >`) - kept
// as typed in the settings, where Obsidian shows the field's error.
export interface PropertyTarget {
  name: string;
  path: string[] | null;
  invalid: boolean;
}

// One property a pass left unwritten on purpose, with the reason the user is
// shown: a parent level that is not a group (`meta: draft`), a group shared
// with another property through a YAML reference, a group or list sitting
// where the value goes (never replaced), or an invalid name.
export interface PropertySkip {
  name: string;
  reason: BlockReason | 'holds-container' | 'invalid-name';
  parent?: string;
}

/**
 * The skip a read stands for, or null when the property can be written.
 * Writers that preview from the metadata cache use it before the write; the
 * write itself re-checks against the live frontmatter (`writeTarget`).
 */
export function skipFromRead(
  name: string,
  read: PathRead,
): PropertySkip | null {
  if (read.kind === 'blocked') {
    return { name, reason: read.reason, parent: read.parent };
  }
  if (read.kind === 'value' && isContainer(read.value)) {
    return { name, reason: 'holds-container' };
  }
  return null;
}

/**
 * Read a target's stored value. `value` is undefined when the property is
 * absent, or when it cannot be written - then `skip` says why (an invalid
 * name included).
 */
export function readTarget(
  frontmatter: Record<string, unknown> | undefined | null,
  target: PropertyTarget,
): { value: unknown; skip: PropertySkip | null } {
  if (!target.path) {
    return {
      value: undefined,
      skip: target.invalid
        ? { name: target.name, reason: 'invalid-name' }
        : null,
    };
  }
  const read = readPath(frontmatter, target.path);
  const skip = skipFromRead(target.name, read);
  return {
    value: skip === null && read.kind === 'value' ? read.value : undefined,
    skip,
  };
}

/**
 * Write a target's value into the live frontmatter. `written` is false with no
 * skip when the target has no path (blank or invalid - reported at read time).
 */
export function writeTarget(
  frontmatter: Record<string, unknown>,
  target: PropertyTarget,
  value: unknown,
): { written: boolean; skip: PropertySkip | null } {
  if (!target.path) return { written: false, skip: null };
  const outcome = writePath(frontmatter, target.path, value);
  switch (outcome.kind) {
    case 'written':
      return { written: true, skip: null };
    case 'blocked':
      return {
        written: false,
        skip: {
          name: target.name,
          reason: outcome.reason,
          parent: outcome.parent,
        },
      };
    case 'holds-container':
      return {
        written: false,
        skip: { name: target.name, reason: 'holds-container' },
      };
  }
}

// Marks a list item on the indentation stack, so a key inside a list item
// (`- updated: x`) never resolves to a group path.
const LIST_ITEM = '\u0000list';

const isListItem = (rest: string) => rest === '-' || rest.startsWith('- ');

/**
 * Drop the lines of nested keys from a frontmatter block before hashing, so
 * the plugin's own nested writes never count as an edit. Works line by line
 * on block-style YAML (what Obsidian writes): an indentation stack gives each
 * key line its path, and a line whose path is excluded is dropped together
 * with every deeper line under it and the list items written at its own
 * indent. Other keys of the same group stay, so an edit by another plugin
 * inside the group still counts; a group left with nothing but excluded keys
 * is dropped too, so the plugin's first write - which creates the group - does
 * not change the hash either.
 *
 * Only multi-level paths are handled here; flat keys go through the original
 * line filter, which must stay byte-identical. A key line that carries a value
 * (`meta: draft`, `note: |`, a quoted string spanning lines) has no nested
 * keys: deeper lines continue that value and are kept as they are. Not
 * covered, by design: inline groups (`meta: {updated: x}`) and quoted keys -
 * their lines stay in the hash, exactly as quoted flat keys always have.
 */
export function removeNestedKeyLines(
  frontmatter: string,
  paths: string[][],
): string {
  if (paths.length === 0) return frontmatter;

  interface Entry {
    indent: number;
    key: string;
    // Index of this key's line in `result`.
    line: number;
    // Child lines kept / child keys dropped, to spot a group left empty.
    kept: number;
    dropped: number;
    // A key with no inline value is a group (or an empty value).
    opensGroup: boolean;
  }
  const result: (string | null)[] = [];
  const stack: Entry[] = [];
  // Drop lines deeper than this indent, and list items at it (the excluded
  // key's block).
  let skipDeeperThan: number | null = null;
  // Blank lines, and comments no deeper than the excluded key, met while
  // skipping: they belong to the dropped block only if more of it follows.
  // Otherwise they are kept, so the output does not depend on whether the
  // excluded key is the last one in its block.
  let pendingBlanks: string[] = [];
  // Keep every line deeper than this indent verbatim (the continuation of a
  // value written on its key's line).
  let opaqueDeeperThan: number | null = null;

  // Close the innermost open key. A group whose every child was an excluded
  // key goes with them, and counts as dropped in its own parent.
  const closeTop = () => {
    const entry = stack.pop()!;
    if (entry.opensGroup && entry.dropped > 0 && entry.kept === 0) {
      result[entry.line] = null;
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.kept--;
        parent.dropped++;
      }
    }
  };

  for (const line of frontmatter.split(/\r?\n/)) {
    const blank = line.trim() === '';
    const indent = line.length - line.trimStart().length;
    const rest = line.slice(indent);

    if (skipDeeperThan !== null) {
      if (blank || (rest.startsWith('#') && indent <= skipDeeperThan)) {
        pendingBlanks.push(line);
        continue;
      }
      if (
        indent > skipDeeperThan ||
        (indent === skipDeeperThan && isListItem(rest))
      ) {
        pendingBlanks = [];
        continue;
      }
      skipDeeperThan = null;
      result.push(...pendingBlanks);
      pendingBlanks = [];
    }
    if (opaqueDeeperThan !== null) {
      if (blank || indent > opaqueDeeperThan) {
        result.push(line);
        continue;
      }
      opaqueDeeperThan = null;
    }
    // Blank lines and comments are neutral: kept, never counted as content.
    if (blank || rest.startsWith('#')) {
      result.push(line);
      continue;
    }

    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      closeTop();
    }
    const top = stack[stack.length - 1];

    if (isListItem(rest)) {
      if (top) top.kept++;
      stack.push({
        indent,
        key: LIST_ITEM,
        line: result.length,
        kept: 0,
        dropped: 0,
        opensGroup: false,
      });
      result.push(line);
      continue;
    }

    const keyMatch = rest.match(/^([^\s:#][^:]*?)\s*:(\s+(.*))?$/);
    if (!keyMatch) {
      if (top) top.kept++;
      result.push(line);
      continue;
    }
    const key = keyMatch[1]!;
    const path = [...stack.map((entry) => entry.key), key];
    if (paths.some((excluded) => pathConflict(excluded, path) === 'equal')) {
      if (top) top.dropped++;
      skipDeeperThan = indent;
      continue;
    }
    // The value after the colon, without a trailing comment. An anchor, a tag,
    // or both (`meta: &dates`, `meta: !!map &dates`) still open a group.
    const value = (keyMatch[3] ?? '').replace(/(^|\s+)#.*$/, '').trim();
    const opensGroup = value === '' || /^[&!]\S*(\s+[&!]\S*)?$/.test(value);
    if (top) top.kept++;
    stack.push({
      indent,
      key,
      line: result.length,
      kept: 0,
      dropped: 0,
      opensGroup,
    });
    result.push(line);
    if (!opensGroup) opaqueDeeperThan = indent;
  }
  while (stack.length > 0) closeTop();
  result.push(...pendingBlanks);

  return result.filter((line): line is string => line !== null).join('\n');
}

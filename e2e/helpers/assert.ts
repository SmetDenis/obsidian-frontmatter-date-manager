// Dependency-free assertions for e2e specs.
//
// e2e is Node-based test code, but the Obsidian community review linter runs
// `import/no-nodejs-modules` (meant for the shipped plugin, which must avoid
// Node builtins for mobile compatibility) across the whole repo. These tiny
// helpers replace `node:assert/strict` so that rule stays satisfied without a
// Node builtin import - equality is strict (===), matching `assert/strict`.

function fail(message: string | undefined, fallback: string): never {
  throw new Error(message ?? fallback);
}

// Structural equality via JSON - sufficient and exact for the JSON-serializable
// test values compared here (arrays of strings); order-sensitive, as intended.
function isDeepEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export const assert = {
  /** Strict (===) equality. */
  equal(actual: unknown, expected: unknown, message?: string): void {
    if (actual !== expected) {
      fail(message, `expected ${String(actual)} to equal ${String(expected)}`);
    }
  },

  /** Strict (!==) inequality. */
  notEqual(actual: unknown, expected: unknown, message?: string): void {
    if (actual === expected) {
      fail(
        message,
        `expected ${String(actual)} not to equal ${String(expected)}`,
      );
    }
  },

  /** Assert the value is truthy. */
  ok(value: unknown, message?: string): void {
    if (!value) {
      fail(message, `expected a truthy value, got ${String(value)}`);
    }
  },

  /** Assert the string matches the pattern. */
  match(value: string, pattern: RegExp, message?: string): void {
    if (!pattern.test(value)) {
      fail(
        message,
        `expected ${JSON.stringify(value)} to match ${String(pattern)}`,
      );
    }
  },

  /** Assert the string does NOT match the pattern. */
  doesNotMatch(value: string, pattern: RegExp, message?: string): void {
    if (pattern.test(value)) {
      fail(
        message,
        `expected ${JSON.stringify(value)} not to match ${String(pattern)}`,
      );
    }
  },

  /** Structural (deep) equality for JSON-serializable values. */
  deepEqual(actual: unknown, expected: unknown, message?: string): void {
    if (!isDeepEqual(actual, expected)) {
      fail(
        message,
        `expected ${JSON.stringify(actual)} to deep-equal ${JSON.stringify(expected)}`,
      );
    }
  },
};

// Obsidian plugins run in a browser context where `window` is available.
// Provide it in the Node.js test environment so that `window.setTimeout`
// and `window.setInterval` resolve correctly with vitest fake timers.
if (typeof globalThis.window === 'undefined') {
  (globalThis as Record<string, unknown>).window = globalThis;
}

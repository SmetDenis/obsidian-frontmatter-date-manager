/**
 * Replaces every {key} token in `template` with String(params[key]).
 * Unknown / missing tokens are left as the literal {key}. Pure, no Obsidian dependency.
 */
export function format(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : match,
  );
}

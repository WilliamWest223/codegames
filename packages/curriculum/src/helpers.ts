import type { LangCode } from '@codegames/shared';

/** Remove the common leading indentation and surrounding blank lines from a template string. */
export function dedent(text: string): string {
  const lines = text.replace(/^\n+|\s+$/g, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n') + '\n';
}

/** Python and JavaScript versions of the same code, dedented. */
export function code(python: string, javascript: string): LangCode {
  return { python: dedent(python), javascript: dedent(javascript) };
}

/** Same text for both languages (e.g. an empty starter). */
export function same(text: string): LangCode {
  return { python: text, javascript: text };
}

/** Grid rows written as a template string, one row per line. */
export function grid(rows: string): { rows: string[] } {
  return { rows: dedent(rows).trimEnd().split('\n') };
}

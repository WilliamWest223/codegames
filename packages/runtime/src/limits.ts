/** Caps on what a run is fed or hands back. The UI enforces the same numbers; the runners enforce them again. */
export const STDIN_LIMITS = {
  /** Longest single input line. */
  maxLine: 500,
  /** Most input lines. */
  maxLines: 200,
  /** Most characters in all the input together. */
  maxTotal: 10_000,
} as const;

/** The most an error message or a stderr stream may carry back to the app. */
export const MAX_ERROR_MESSAGE = 2000;

/**
 * Split stdin into lines for `input()` / `prompt()`: each line is cut to 500 characters, at
 * most 200 lines are kept, and the total is cut to 10 KB. Anything beyond is dropped.
 */
export function clampStdin(stdin: unknown): string[] {
  if (typeof stdin !== 'string' || stdin === '') return [];
  const lines = stdin.slice(0, STDIN_LIMITS.maxTotal + STDIN_LIMITS.maxLines).replace(/\r\n?/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  const out: string[] = [];
  let total = 0;
  for (const line of lines) {
    if (out.length >= STDIN_LIMITS.maxLines || total >= STDIN_LIMITS.maxTotal) break;
    const kept = line.slice(0, Math.min(STDIN_LIMITS.maxLine, STDIN_LIMITS.maxTotal - total));
    out.push(kept);
    total += kept.length;
  }
  return out;
}

/** Cut `text` to `max` characters, marking the cut. */
export function clipText(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}… (cut)` : text;
}

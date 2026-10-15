import type { DomEvent } from '@codegames/runtime';

/**
 * Caps on what a learner can feed a program. The runners (`runJavaScript` / `runPython`) clamp
 * stdin again with the same numbers, so these are the friendly first line, not the only one.
 */
export const INPUT_LIMITS = {
  maxLine: 500,
  maxLines: 200,
  maxTotal: 10_000,
  /** Page interactions (clicks, keystrokes) kept for one Play session. */
  maxEvents: 500,
  /** Longest value an `input` / `change` page event may carry. */
  maxEventValue: 1000,
} as const;

/** Cut a page event's value to its cap. */
export function clampEventValue(event: DomEvent): DomEvent {
  return typeof event.value === 'string' && event.value.length > INPUT_LIMITS.maxEventValue
    ? { ...event, value: event.value.slice(0, INPUT_LIMITS.maxEventValue) }
    : event;
}

/** Clamp a block of input text (one value per line). `clamped` says whether anything was cut. */
export function clampInputText(text: string): { text: string; clamped: boolean } {
  const lines = text.split('\n');
  const kept: string[] = [];
  let total = 0;
  for (const raw of lines) {
    if (kept.length >= INPUT_LIMITS.maxLines || total >= INPUT_LIMITS.maxTotal) break;
    const line = raw.slice(0, Math.min(INPUT_LIMITS.maxLine, INPUT_LIMITS.maxTotal - total));
    kept.push(line);
    total += line.length + 1;
  }
  const out = kept.join('\n');
  return { text: out, clamped: out.length !== text.length };
}

/** Why one more typed answer would be refused, or null if it fits. */
export function whyRefuse(answers: readonly string[], next: string): string | null {
  if (next.length > INPUT_LIMITS.maxLine) return `One answer can be at most ${INPUT_LIMITS.maxLine} characters.`;
  if (answers.length >= INPUT_LIMITS.maxLines) return `That is the most answers a program can be given (${INPUT_LIMITS.maxLines}). Press Restart to begin again.`;
  const total = answers.reduce((n, a) => n + a.length + 1, 0) + next.length + 1;
  if (total > INPUT_LIMITS.maxTotal) return 'That is all the input a program can be given. Press Restart to begin again.';
  return null;
}

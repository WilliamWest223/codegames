import type { Language } from '@codegames/shared';

export interface BracketProblem {
  line: number;
  message: string;
}

const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

/**
 * Find the first unbalanced bracket, skipping strings and comments. JavaScript's own
 * syntax errors often point at the end of the file for a missing `}`; this points at
 * the bracket that was opened and never closed.
 */
export function findBracketProblem(code: string, language: Language): BracketProblem | undefined {
  const stack: { ch: string; line: number }[] = [];
  let line = 1;
  let quote: string | null = null;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i]!;
    if (ch === '\n') {
      // A " or ' string can't span lines: an open one here is the real problem,
      // not the bracket it leaves unclosed.
      if (quote && quote !== '`') return { line, message: `The string on line ${line} is missing its closing \`${quote}\`.` };
      line++;
      continue;
    }
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || (ch === '`' && language === 'javascript')) {
      quote = ch;
      continue;
    }
    const comment = language === 'python' ? ch === '#' : code.startsWith('//', i);
    if (comment) {
      while (i < code.length && code[i] !== '\n') i++;
      i--;
      continue;
    }
    if (ch in PAIRS) stack.push({ ch, line });
    else if (ch in CLOSERS) {
      const open = stack.pop();
      if (!open) return { line, message: `This \`${ch}\` on line ${line} has no matching \`${CLOSERS[ch]}\` before it.` };
      if (open.ch !== CLOSERS[ch]) {
        return { line: open.line, message: `The \`${open.ch}\` on line ${open.line} is closed by a \`${ch}\` on line ${line}; it needs a \`${PAIRS[open.ch]}\`.` };
      }
    }
  }
  if (quote && quote !== '`') return { line, message: `The string on line ${line} is missing its closing \`${quote}\`.` };
  const open = stack.pop();
  if (open) return { line: open.line, message: `The \`${open.ch}\` on line ${open.line} is never closed. Add a \`${PAIRS[open.ch]}\` where it should end.` };
  return undefined;
}

/** Edit distance, for "did you mean" suggestions. */
export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1]!.toLowerCase() === b[j - 1]!.toLowerCase() ? 0 : 1));
  return dp[a.length]![b.length]!;
}

/** Closest candidate within a small distance (case differences are free). */
export function closest(name: string, candidates: Iterable<string>): string | undefined {
  if (name.length < 3) return undefined; // too short to guess what was meant
  let best: string | undefined;
  let bestD = Infinity;
  for (const c of candidates) {
    if (c === name) continue;
    const d = editDistance(name, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best && (bestD <= Math.max(1, Math.floor(name.length / 4)) || best.toLowerCase() === name.toLowerCase()) ? best : undefined;
}

/** Identifiers that appear in the code (variables, functions). */
export function identifiersIn(code: string): Set<string> {
  return new Set(code.match(/[A-Za-z_$][\w$]*/g) ?? []);
}

/** Common JS names learners call, for suggestions. */
export const JS_KNOWN = [
  'console', 'log', 'prompt', 'Number', 'String', 'Math', 'floor', 'trunc', 'round', 'toFixed', 'length',
  'toUpperCase', 'toLowerCase', 'repeat', 'includes', 'let', 'const', 'move', 'turnLeft', 'collect',
  'isBlocked', 'onGem', 'atFlag',
];

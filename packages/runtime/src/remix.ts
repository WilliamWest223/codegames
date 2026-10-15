import type { Language } from '@codegames/shared';

/** Deterministic small PRNG so a remix is stable for a given seed. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

/**
 * Change the integer literals in a program (outside strings and comments) to nearby values,
 * producing a fresh predict-the-output puzzle that grades itself, because predict levels
 * compare against the program's real output. 0 and 1 are left alone: they are usually
 * structural (start values, step sizes) rather than "the numbers in the puzzle".
 */
export function remixNumbers(code: string, seed: number, language: Language): string {
  const next = rng(seed);
  const comment = language === 'python' ? '#' : '//';
  let out = '';
  let quote: string | null = null;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i]!;
    if (quote) {
      out += ch;
      if (ch === '\\') out += code[++i] ?? '';
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      out += ch;
      continue;
    }
    if (code.startsWith(comment, i)) {
      const end = code.indexOf('\n', i);
      const stop = end === -1 ? code.length : end;
      out += code.slice(i, stop);
      i = stop - 1;
      continue;
    }
    const prev = code[i - 1] ?? '';
    if (/\d/.test(ch) && !/[\w.$]/.test(prev)) {
      let j = i;
      while (j < code.length && /\d/.test(code[j]!)) j++;
      const after = code[j] ?? '';
      const n = Number(code.slice(i, j));
      if (after !== '.' && !/[\w$]/.test(after) && n > 1) {
        out += String(n + 1 + Math.floor(next() * 3));
      } else {
        out += code.slice(i, j);
      }
      i = j - 1;
      continue;
    }
    out += ch;
  }
  return out;
}

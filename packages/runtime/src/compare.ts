/** Normalize program output for comparison: unify newlines, drop trailing spaces and blank lines. */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n+$/, '');
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

/**
 * Predictions only: ignore spacing inside brackets and after commas/colons, and quote style,
 * so `[1,2]`, `[1, 2]` and JavaScript's `[ 1, 2 ]` all count. JavaScript object keys may be
 * typed with or without quotes; Python keys are strings, so `{apple: 4}` stays wrong there.
 * (Tests stay exact: programs must print precisely.)
 */
export function looseContainers(text: string, language?: 'python' | 'javascript' | string): string {
  return text
    .split('\n')
    .map((line) => {
      if (!/[[{]/.test(line)) return line; // only lines that print containers
      const out = line
        .replace(/"((?:[^"'\\]|\\.)*)"/g, "'$1'") // "x" and 'x' are the same string
        .replace(/([[{(])[ \t]+/g, '$1')
        .replace(/[ \t]+([\]})])/g, '$1')
        .replace(/[ \t]*,[ \t]*/g, ', ')
        .replace(/[ \t]*:[ \t]*/g, ': ');
      return language === 'javascript' ? out.replace(/'([A-Za-z_$][\w$]*)':/g, '$1:') : out;
    })
    .join('\n');
}

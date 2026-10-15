import { lang } from '../../localize';

/** Helpers shared by this region's level files. */
export const PRINT = lang('`print()`', '`console.log()`');
export const INPUT = lang('`input()`', '`prompt()`');
/** Receipt text plus the free-shipping line, which prints True/False or true/false. */
export function receipt(lines: string, freeShipping: boolean) {
  const word = (b: boolean, py: boolean) => (py ? (b ? 'True' : 'False') : String(b));
  return { python: `${lines}\nFree shipping: ${word(freeShipping, true)}`, javascript: `${lines}\nFree shipping: ${word(freeShipping, false)}` };
}

export const NO_LITERAL_PRINT = {
  python: [{ pattern: 'print\\(\\s*["\'\\d]', forbid: true, message: 'Print the variables, not typed-in values.' }],
  javascript: [{ pattern: 'console\\.log\\(\\s*["\'`\\d]', forbid: true, message: 'Log the variables, not typed-in values.' }],
};

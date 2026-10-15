import type { Language } from '@codegames/shared';

/**
 * Explain surprising output that isn't an error: values printed by mistake (objects,
 * methods) and JavaScript's silent failures (`undefined`, `NaN`). Used beside failed tests.
 */
export function explainOutput(actual: string, expected: string, language: Language): string[] {
  const notes: string[] = [];
  const surprising = (pattern: RegExp) => pattern.test(actual) && !pattern.test(expected);
  const lazy = surprising(/<(map|filter) object at|<generator object/);
  if (lazy) notes.push('You printed the lazy object itself. Wrap it in `list(...)` (or use `[... for ...]`).');
  if (language === 'python' && !lazy && surprising(/<function <lambda>/)) {
    notes.push('You printed a function itself (a `lambda`). Call it with `()` to get its result.');
  } else if (!lazy && surprising(/object at 0x|<bound method|<function /)) {
    notes.push('You printed the object (or method) itself. Print one of its fields, or call the method with `()`.');
  }
  if (language === 'javascript' && surprising(/\[Function[: ]|\[class /)) {
    notes.push('You printed a function itself. Call it with `()` to get its result.');
  }
  // Characters outside printable ASCII (tabs and newlines are fine) that the expected output
  // doesn't have: an emoji, accent or curly quote the level itself uses is not strange (round-8 P2).
  const expectedChars = new Set(expected);
  const strange = [...actual].some((ch) => /[^\x20-\x7e\t\n\r]/.test(ch) && !expectedChars.has(ch));
  if (language === 'javascript' && strange) {
    notes.push('Strange characters? A character code went out of range. Check `% 26`, and that JavaScript\'s `%` keeps the minus sign: `-3 % 26` is `-3`.');
  }
  if (language === 'javascript' && surprising(/\[object Object\]/)) {
    notes.push('`[object Object]` means an object was turned into text. Print one of its properties (like `item.name`), or give the class a method that returns a description.');
  }
  if (language === 'javascript' && surprising(/\bundefined\b|\bNaN\b/)) {
    notes.push(
      'JavaScript fails quietly: a missing key, a past-the-end position or a function with no `return` gives `undefined`, and maths with `undefined` gives `NaN`. Check the key exists (`key in obj`) or that the function returns.',
    );
  }
  if (language === 'python' && surprising(/\bNone\b/)) {
    notes.push('`None` usually means a function printed its answer instead of returning it, or you used the result of a method like `.sort()` that changes things in place.');
  }
  return notes;
}

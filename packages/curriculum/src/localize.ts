import type { Language } from '@codegames/shared';

/**
 * Prompts, hints, and takeaways are shared across languages. Language-specific bits are
 * written as `{{py:turn_left()|js:turnLeft()}}` and resolved for the learner's language.
 */
const TOKEN = /\{\{py:((?:[^|}]|\}(?!\}))*)\|js:((?:[^}]|\}(?!\}))*)\}\}/g;

export function localize(text: string, language: Language): string {
  return text.replace(TOKEN, (_m, py: string, js: string) => (language === 'python' ? py : js));
}

/** Build a `{{py:..|js:..}}` token. */
export function lang(py: string, js: string): string {
  return `{{py:${py}|js:${js}}}`;
}

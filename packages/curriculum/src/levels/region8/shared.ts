import type { LangCode } from '@codegames/shared';
import { dedent } from '../../helpers';

/** Web Pages levels exist in JavaScript only, so their code has a single language. */
export function js(code: string): LangCode {
  return { javascript: dedent(code) };
}

/** A level's starting page (body HTML), dedented. */
export function html(markup: string): string {
  return dedent(markup);
}

/** Harness that drives the page (clicks, typing) and then prints its outline for grading. */
export function page(script: string): LangCode {
  return js(`${dedent(script)}console.log(render());`);
}

/** The simplest harness: print the page as the program left it. */
export const SHOW_PAGE = page('');

export const EVENT_RULE = { pattern: 'addEventListener\\(', message: 'React to the user with addEventListener("click", ...) (or "input" / "submit").' };
export const CREATE_RULE = { pattern: 'createElement\\(', message: 'Make new elements with document.createElement, then add them to the page.' };
export const PREVENT_RULE = { pattern: 'preventDefault\\(\\)', message: 'Call event.preventDefault() in the submit handler, or a real browser reloads the page and wipes everything.' };
export const NO_HTML_STRINGS = {
  pattern: 'innerHTML\\s*(\\+=|=\\s*(?!["\'`]["\'`]))',
  forbid: true,
  message: 'Build elements with createElement and textContent, not by gluing HTML strings into innerHTML (that is how pages get hijacked by user text). innerHTML = "" is fine for clearing.',
};

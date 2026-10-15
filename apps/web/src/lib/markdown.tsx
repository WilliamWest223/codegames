import { Marked } from 'marked';
import { useMemo } from 'react';
import { localize } from '@codegames/curriculum';
import type { Language } from '@codegames/shared';

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Link targets curriculum text may use. Everything else (javascript:, data:, vbscript:, ...) is dropped. */
const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

/**
 * Curriculum text we ship (the `trusted` path). Still defensive: raw HTML is shown as text,
 * images become plain text, and links keep only http, https and mailto targets. Its own
 * `Marked` instance, so nothing here touches marked's global options.
 */
const trustedMarked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html: ({ text }) => escapeHtml(text),
    image: ({ text }) => escapeHtml(text),
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      if (!SAFE_HREF.test(href.trim())) return inner;
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(href)}"${t} rel="noopener noreferrer">${inner}</a>`;
    },
  },
});

/**
 * The DEFAULT path, for text that can contain the learner's own code or data (error
 * explanations): raw HTML is shown as text, and links and images become plain text, so
 * nothing can be injected (round-8 P2).
 */
const untrustedMarked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html: ({ text }) => escapeHtml(text),
    link({ tokens }) {
      return this.parser.parseInline(tokens);
    },
    image: ({ text }) => escapeHtml(text),
  },
});

/** Markdown to HTML. Untrusted unless `trusted`; both paths escape raw HTML. */
export function markdownToHtml(text: string, language: Language, inline: boolean, trusted = false): string {
  const source = localize(text, language);
  const md = trusted ? trustedMarked : untrustedMarked;
  return inline ? (md.parseInline(source) as string) : (md.parse(source) as string);
}

/**
 * Render Markdown for the learner's language. UNTRUSTED by default: pass `trusted` only for
 * curriculum strings that ship with the app, never for anything built from learner code,
 * output or data.
 */
export function Markdown({ text, language, inline = false, trusted = false }: { text: string; language: Language; inline?: boolean; trusted?: boolean }) {
  const html = useMemo(() => markdownToHtml(text, language, inline, trusted), [text, language, inline, trusted]);
  return inline ? (
    <span className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

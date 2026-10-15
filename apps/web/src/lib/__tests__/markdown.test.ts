import { describe, expect, it } from 'vitest';
import { marked } from 'marked';
import { markdownToHtml } from '../markdown';

/** Round-8 P2: error explanations can contain learner text; it must never become HTML. */
describe('markdownToHtml (untrusted, the default)', () => {
  it('shows raw HTML as text', () => {
    const html = markdownToHtml('Bad key <img src=x onerror=alert(1)> here', 'python', true);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('turns links and images into plain text', () => {
    const html = markdownToHtml('[click](javascript:alert(1)) ![x](http://example.com/a.png)', 'python', true);
    expect(html).not.toContain('<a');
    expect(html).not.toContain('<img');
    expect(html).toContain('click');
  });

  it('still renders code spans and emphasis', () => {
    expect(markdownToHtml('Use `x < y` and **bold**', 'python', true)).toBe('Use <code>x &lt; y</code> and <strong>bold</strong>');
  });
});

describe('markdownToHtml (trusted)', () => {
  it('escapes raw HTML even for curriculum text', () => {
    const html = markdownToHtml('A <kbd>key</kbd>', 'python', true, true);
    expect(html).not.toContain('<kbd>');
    expect(html).toContain('&lt;kbd&gt;');
  });

  it('keeps http, https and mailto links', () => {
    expect(markdownToHtml('[a](https://example.com/x)', 'python', true, true)).toContain('<a href="https://example.com/x"');
    expect(markdownToHtml('[a](http://example.com)', 'python', true, true)).toContain('<a href="http://example.com"');
    expect(markdownToHtml('[a](mailto:x@y.z)', 'python', true, true)).toContain('<a href="mailto:x@y.z"');
  });

  it('does not touch the global marked options', () => {
    markdownToHtml('x', 'python', true, true);
    expect(marked.parse('<b>x</b>', { async: false })).toContain('<b>');
  });
});

const PAYLOADS: [string, string][] = [
  ['javascript link', '[x](javascript:alert(1))'],
  ['JAVASCRIPT mixed case', '[x](JaVaScRiPt:alert(1))'],
  ['javascript entity-encoded', '[x](&#106;avascript:alert(1))'],
  ['javascript with tab', '[x](java\tscript:alert(1))'],
  ['reference link', '[x][r]\n\n[r]: javascript:alert(1)'],
  ['autolink javascript', '<javascript:alert(1)>'],
  ['autolink data', '<data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==>'],
  ['data url link', '[x](data:text/html,<script>alert(1)</script>)'],
  ['vbscript link', '[x](vbscript:msgbox(1))'],
  ['img onerror', '<img src=x onerror=alert(1)>'],
  ['md image javascript', '![x](javascript:alert(1))'],
  ['md image quote breakout', '![x" onerror="alert(1)](http://a/b.png)'],
  ['script tag', '<script>alert(1)</script>'],
  ['script block', 'text\n\n<script>\nalert(1)\n</script>\n'],
  ['details ontoggle', '<details open ontoggle=alert(1)>x</details>'],
  ['html comment', '<!-- --><img src=x onerror=alert(1)>'],
  ['iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
  ['svg onload', '<svg onload=alert(1)>'],
  ['body onload', '<body onload=alert(1)>'],
  ['a href html', '<a href="javascript:alert(1)">x</a>'],
  ['link title breakout', '[x](http://a.com "t\\" onmouseover=\\"alert(1)")'],
  ['link title entity quote', '[x](http://a.com "a&quot; onmouseover=&quot;alert(1)")'],
  ['style tag', '<style>*{background:url(javascript:alert(1))}</style>'],
  ['code fence html', '```html\n<img src=x onerror=alert(1)>\n```'],
  ['form action', '<form action="javascript:alert(1)"><button>x</button></form>'],
];

describe.each([
  ['untrusted', false],
  ['trusted', true],
] as const)('XSS payload suite (%s path)', (_name, trusted) => {
  it('has 25 payloads', () => expect(PAYLOADS).toHaveLength(25));
  for (const [name, payload] of PAYLOADS) {
    for (const inline of [false, true]) {
      it(`neutralises: ${name} (${inline ? 'inline' : 'block'})`, () => {
        const html = markdownToHtml(payload, 'python', inline, trusted);
        // Only harmless formatting tags may appear.
        const tags = [...html.matchAll(/<\/?([a-z][a-z0-9]*)/gi)].map((m) => m[1]!.toLowerCase());
        for (const tag of tags) expect(['p', 'code', 'pre', 'em', 'strong', 'a', 'br']).toContain(tag);
        // No event handler or script URL inside a real tag.
        for (const m of html.matchAll(/<[a-z][^>]*>/gi)) {
          const bare = m[0].replace(/"[^"]*"/g, "\"\"");
          expect(bare).not.toMatch(/\son[a-z]+\s*=/i);
          expect(m[0]).not.toMatch(/(javascript|vbscript|data):/i);
        }
        if (!trusted) expect(html).not.toContain('<a');
      });
    }
  }
});

import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PageNode } from '@codegames/runtime';
import { PagePreview, safeInputType } from '../PagePreview';
import { stylePropsFrom } from '../pageStyle';

const el = (tag: string, attrs: Record<string, string> = {}, children: (PageNode | string)[] = [], path = '@0'): PageNode => ({ tag, attrs, children, path });
const draw = (...children: PageNode[]) => renderToStaticMarkup(<PagePreview node={el('body', {}, children, '@')} />);

describe('PagePreview input types', () => {
  it.each(['text', 'number', 'checkbox', 'radio', 'button', 'submit', 'reset', 'email', 'password', 'search', 'date'])('keeps %s', (t) => {
    expect(safeInputType(t)).toBe(t);
  });
  it.each(['file', 'image', 'hidden', 'color', 'range', 'url', 'tel', 'javascript:1', '', 'x" onfocus="y'])('turns %j into text', (t) => {
    expect(safeInputType(t)).toBe('text');
  });
  it('is case-insensitive for the allowed list', () => {
    expect(safeInputType('EMAIL')).toBe('email');
  });
  it('draws a file input as a text input', () => {
    const html = draw(el('input', { type: 'file' }));
    expect(html).toContain('type="text"');
    expect(html).not.toContain('type="file"');
  });
  it('does not pass type through on other tags', () => {
    expect(draw(el('div', { type: 'file' }))).not.toContain('type=');
  });
});

describe('PagePreview attributes', () => {
  it('keeps well-formed data-* attributes and drops the rest', () => {
    const html = draw(el('div', { 'data-ok-1': 'yes', 'data-Bad': 'no', 'data-': 'no', 'data-a_b': 'no', 'data-x"y': 'no' }));
    expect(html).toContain('data-ok-1="yes"');
    expect(html).not.toContain('data-Bad');
    expect(html).not.toContain('data-a_b');
    expect(html).not.toMatch(/data-=|data-x/);
  });
  it('caps attribute value lengths', () => {
    const html = draw(el('div', { title: 't'.repeat(5000), 'data-big': 'd'.repeat(5000), class: 'c'.repeat(5000), id: 'i'.repeat(5000) }));
    expect(html).not.toContain('t'.repeat(501));
    expect(html).not.toContain('d'.repeat(501));
    expect(html).not.toContain('c'.repeat(502));
    expect(html).not.toContain('i'.repeat(501));
  });
  it('caps an input value and its typing length at 1000', () => {
    const html = draw(el('input', { value: 'v'.repeat(5000) }));
    expect(html).not.toContain('v'.repeat(1001));
    expect(html).toContain('maxLength="1000"');
  });
  it('never emits an event handler attribute from the snapshot', () => {
    const html = draw(el('div', { onclick: 'alert(1)', onload: 'x' }), el('img', { src: 'http://evil/x.png', onerror: 'x' }));
    expect(html).not.toMatch(/onclick|onload|onerror|http:\/\/evil/i);
  });
});

describe('stylePropsFrom', () => {
  it('keeps ordinary declarations', () => {
    expect(stylePropsFrom('color: red; font-size: 12px; --accent: #fff')).toEqual({ color: 'red', fontSize: '12px', '--accent': '#fff' });
  });
  it.each([
    'background: url(http://evil/x.png)',
    'background: URL (x)',
    'background: \\75rl(x)',
    'background: u\\72l(x)',
    'color: red/**/',
    'background: /* c */ blue',
    'background: image-set("x.png" 1x)',
    'background: -webkit-image-set(url(x) 1x)',
    'content: src(x)',
    'background: cross-fade(url(a), url(b), 50%)',
    'background: element(#id)',
    'background-image: paint(worklet)',
    'width: expression(alert(1))',
    'background: url(javascript:alert(1))',
    '-moz-binding: url(x)',
    'position: fixed',
    'behavior: x',
  ])('drops %s', (decl) => {
    expect(stylePropsFrom(`color: blue; ${decl}`)).toEqual({ color: 'blue' });
  });
  it('caps the style string at 2000 characters', () => {
    const style = `${'color: red; '.repeat(10)}${' '.repeat(2000)}width: 5px`;
    expect(stylePropsFrom(style)).toEqual({ color: 'red' });
    const many = Array.from({ length: 1000 }, (_, i) => `--v${i}: 1`).join(';');
    expect(Object.keys(stylePropsFrom(many)).length).toBeLessThan(400);
  });
});

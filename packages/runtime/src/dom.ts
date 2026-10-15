/**
 * A small in-memory DOM for the Web Pages side quest. Learner JavaScript runs in a worker
 * (no real `document`), so levels get this model instead: a page parsed from the level's
 * HTML, the everyday element API, events with bubbling, and two ways out: `render()` (a
 * readable outline the tests compare) and a `PageNode` snapshot the app draws in Play it.
 *
 * It is deliberately a subset. Whitespace between tags is dropped, selectors cover
 * `tag`, `#id`, `.class`, `[attr]`, `[attr=value]`, descendant and child combinators,
 * and there is no layout, no CSS cascade and no navigation. Nothing here ever touches
 * the real DOM: the app renders the snapshot through React with an allow-list of tags.
 */
import { PREVIEW } from './format';

/** An interaction replayed after the program runs (Play it) or fired by a test harness. */
export interface DomEvent {
  type: 'click' | 'input' | 'change' | 'submit';
  /** `#id`, or `@0/2/1`: child indexes from `body`. */
  target: string;
  /** For `input` / `change`: the new value. */
  value?: string;
}

/** A serialisable picture of the page after the program (and any events) ran. */
export interface PageNode {
  tag: string;
  /** Attributes plus live state (`value`, `checked`, `hidden`, `disabled`, `style`). */
  attrs: Record<string, string>;
  children: (PageNode | string)[];
  /** `@`-path from `body`, so the app can address this element in a `DomEvent`. */
  path: string;
}

/** Limits that keep a page (and the snapshot sent to the app) small, whatever the program does. */
export const DOM_LIMITS = {
  /** Elements and text nodes under `body`. */
  maxNodes: 2000,
  /** Nesting levels under `body`. */
  maxDepth: 50,
  maxAttrValue: 1000,
  maxTextNode: 10_000,
  /** Longest `style` string a snapshot carries. */
  maxStyle: 2000,
  /** Longest HTML string `innerHTML` will parse. */
  maxHtml: 100_000,
  /** Nodes one run may create in total, kept or not (a loop that makes and drops nodes is still work). */
  maxCreated: 50_000,
  maxEvents: 500,
  maxEventValue: 1000,
  maxEventTarget: 200,
} as const;
const ATTR_NAME = /^[a-z][a-z0-9-]*$/i;

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr']);
const FORM_FIELDS = new Set(['input', 'textarea', 'select']);
/** Attributes that are either present or absent, not key="value". */
const BOOLEAN_ATTRS = new Set(['hidden', 'disabled', 'checked', 'readonly', 'required', 'selected', 'open']);
/** Most elements a page can hold, so a typo like `createElement("buton")` is caught early. */
const KNOWN_TAGS = new Set([
  'a', 'article', 'aside', 'b', 'body', 'br', 'button', 'code', 'dd', 'div', 'dl', 'dt', 'em', 'fieldset', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'input', 'label', 'legend', 'li', 'main', 'nav', 'ol',
  'option', 'p', 'pre', 'progress', 'section', 'select', 'small', 'span', 'strong', 'table', 'tbody', 'td', 'textarea',
  'th', 'thead', 'tr', 'u', 'ul',
]);

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' })[name]!);
}

/** `id`, then `class`, then the rest alphabetically: the outline must not depend on the order a learner set attributes. */
function sortAttrs(attrs: Iterable<[string, string]>): [string, string][] {
  const rank = (name: string) => (name === 'id' ? 0 : name === 'class' ? 1 : 2);
  return [...attrs].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

class DomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomError';
  }
}

function checkText(data: string): string {
  if (data.length > DOM_LIMITS.maxTextNode) {
    throw new DomError(`That text is ${data.length} characters long. A text node can hold at most ${DOM_LIMITS.maxTextNode}.`);
  }
  return data;
}

class MiniText {
  private text: string;
  constructor(data: string) {
    this.text = checkText(data);
  }
  get data(): string {
    return this.text;
  }
  set data(value: string) {
    this.text = checkText(String(value));
  }
}

/** The number of nodes in a subtree (the node itself included) and how many levels it has. */
function measure(node: MiniElement | MiniText): { count: number; height: number } {
  if (!(node instanceof MiniElement)) return { count: 1, height: 1 };
  let count = 1;
  let height = 1;
  for (const child of node.childNodes) {
    const m = measure(child);
    count += m.count;
    height = Math.max(height, m.height + 1);
  }
  return { count, height };
}

export class MiniEvent {
  target: MiniElement | null = null;
  currentTarget: MiniElement | null = null;
  defaultPrevented = false;
  propagationStopped = false;
  constructor(public readonly type: string) {}
  preventDefault() {
    this.defaultPrevented = true;
  }
  stopPropagation() {
    this.propagationStopped = true;
  }
}

type Listener = (event: MiniEvent) => unknown;

class ClassList {
  constructor(private readonly el: MiniElement) {}
  private get list(): string[] {
    return (this.el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  }
  private set list(classes: string[]) {
    if (classes.length) this.el.setAttribute('class', classes.join(' '));
    else this.el.removeAttribute('class');
  }
  add(...names: string[]) {
    this.list = [...new Set([...this.list, ...names.map(String)])];
  }
  remove(...names: string[]) {
    const gone = new Set(names.map(String));
    this.list = this.list.filter((c) => !gone.has(c));
  }
  toggle(name: string, force?: boolean): boolean {
    const has = this.contains(name);
    const want = force === undefined ? !has : force;
    if (want && !has) this.add(name);
    if (!want && has) this.remove(name);
    return want;
  }
  contains(name: string): boolean {
    return this.list.includes(String(name));
  }
  get length(): number {
    return this.list.length;
  }
  toString(): string {
    return this.list.join(' ');
  }
}

export class MiniElement {
  readonly tagName: string;
  private readonly attrs = new Map<string, string>();
  childNodes: (MiniElement | MiniText)[] = [];
  parentElement: MiniElement | null = null;
  private readonly listeners = new Map<string, Listener[]>();
  private liveValue: string | undefined;
  private liveChecked: boolean | undefined;
  readonly classList = new ClassList(this);
  /** `el.style.color = "red"`: a plain object the outline shows as a style attribute. */
  readonly style: Record<string, string> = {};

  constructor(private readonly doc: MiniDocument, tag: string) {
    doc.noteCreated();
    this.tagName = tag.toUpperCase();
  }

  private connected(): boolean {
    for (let node: MiniElement | null = this; node; node = node.parentElement) if (node === this.doc.body) return true;
    return false;
  }

  /** Refuse a node that would make the page too deep or too big. */
  private checkRoom(node: MiniElement | MiniText) {
    const { count, height } = measure(node);
    let level = 0;
    for (let p = this.parentElement; p; p = p.parentElement) level++;
    if (level + height > DOM_LIMITS.maxDepth) {
      throw new DomError(`This page is nested more than ${DOM_LIMITS.maxDepth} levels deep. Put fewer elements inside each other.`);
    }
    const alreadyCounted = node instanceof MiniElement && node.connected();
    if (this.connected() && !alreadyCounted && measure(this.doc.body).count - 1 + count > DOM_LIMITS.maxNodes) {
      throw new DomError(`This page has more than ${DOM_LIMITS.maxNodes} elements. Remove some before adding more (a loop that never ends can cause this).`);
    }
  }

  private get tag(): string {
    return this.tagName.toLowerCase();
  }

  // ── attributes and state ──

  getAttribute(name: string): string | null {
    return this.attrs.get(String(name).toLowerCase()) ?? null;
  }
  setAttribute(name: string, value: unknown) {
    const key = String(name);
    if (!ATTR_NAME.test(key)) throw new DomError(`"${key.slice(0, 40)}" is not a valid attribute name (use letters, digits and dashes, starting with a letter).`);
    const text = String(value);
    if (text.length > DOM_LIMITS.maxAttrValue) {
      throw new DomError(`The "${key}" attribute is ${text.length} characters long. The most an attribute can hold is ${DOM_LIMITS.maxAttrValue}.`);
    }
    this.attrs.set(key.toLowerCase(), text);
  }
  hasAttribute(name: string): boolean {
    return this.attrs.has(String(name).toLowerCase());
  }
  removeAttribute(name: string) {
    this.attrs.delete(String(name).toLowerCase());
  }
  get id(): string {
    return this.getAttribute('id') ?? '';
  }
  set id(value: string) {
    this.setAttribute('id', value);
  }
  get className(): string {
    return this.getAttribute('class') ?? '';
  }
  set className(value: string) {
    this.setAttribute('class', value);
  }
  get dataset(): Record<string, string> {
    const data: Record<string, string> = {};
    for (const [name, value] of this.attrs) {
      if (name.startsWith('data-')) data[name.slice(5).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
    }
    return data;
  }
  get hidden(): boolean {
    return this.hasAttribute('hidden');
  }
  set hidden(value: boolean) {
    if (value) this.setAttribute('hidden', '');
    else this.removeAttribute('hidden');
  }
  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(value: boolean) {
    if (value) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');
  }
  get checked(): boolean {
    return this.liveChecked ?? this.hasAttribute('checked');
  }
  set checked(value: boolean) {
    this.liveChecked = !!value;
  }
  get type(): string {
    return this.getAttribute('type') ?? (this.tag === 'button' ? 'submit' : this.tag === 'input' ? 'text' : '');
  }
  set type(value: string) {
    this.setAttribute('type', value);
  }
  get value(): string {
    if (this.liveValue !== undefined) return this.liveValue;
    if (this.tag === 'textarea') return this.textContent;
    if (this.tag === 'select') {
      const picked = this.children.find((o) => o.hasAttribute('selected')) ?? this.children[0];
      return picked ? (picked.getAttribute('value') ?? picked.textContent) : '';
    }
    return this.getAttribute('value') ?? '';
  }
  set value(value: unknown) {
    this.liveValue = checkText(String(value));
  }
  get href(): string {
    return this.getAttribute('href') ?? '';
  }
  set href(value: string) {
    this.setAttribute('href', value);
  }
  get src(): string {
    return this.getAttribute('src') ?? '';
  }
  set src(value: string) {
    this.setAttribute('src', value);
  }

  // ── tree ──

  get children(): MiniElement[] {
    return this.childNodes.filter((n): n is MiniElement => n instanceof MiniElement);
  }
  get childElementCount(): number {
    return this.children.length;
  }
  get firstElementChild(): MiniElement | null {
    return this.children[0] ?? null;
  }
  get lastElementChild(): MiniElement | null {
    return this.children.at(-1) ?? null;
  }
  get nextElementSibling(): MiniElement | null {
    const siblings = this.parentElement?.children ?? [];
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }
  get previousElementSibling(): MiniElement | null {
    const siblings = this.parentElement?.children ?? [];
    const at = siblings.indexOf(this);
    return at > 0 ? siblings[at - 1]! : null;
  }
  get parentNode(): MiniElement | null {
    return this.parentElement;
  }

  /** `append`/`prepend` take strings too; `appendChild` and friends want a node, as in the browser. */
  private adopt(node: unknown, method = 'append'): MiniElement | MiniText {
    const nodeLike = node instanceof MiniElement || node instanceof MiniText;
    if (!nodeLike && method === 'append' && (typeof node === 'string' || typeof node === 'number')) {
      const text = new MiniText(String(node));
      this.checkRoom(text);
      return text;
    }
    if (!nodeLike) {
      throw new DomError(`${method} needs an element made with document.createElement, not ${typeof node === 'string' ? 'a string' : typeof node}.`);
    }
    if (node instanceof MiniElement) {
      if (node === this || node.contains(this)) throw new DomError('An element cannot be put inside itself.');
      this.checkRoom(node);
      node.remove();
      node.parentElement = this;
    } else {
      this.checkRoom(node);
    }
    return node;
  }
  appendChild<T extends MiniElement | MiniText>(node: T): T {
    this.childNodes.push(this.adopt(node, 'appendChild'));
    return node;
  }
  append(...nodes: (MiniElement | string)[]) {
    for (const node of nodes) this.childNodes.push(this.adopt(node));
  }
  prepend(...nodes: (MiniElement | string)[]) {
    this.childNodes.unshift(...nodes.map((n) => this.adopt(n)));
  }
  insertBefore<T extends MiniElement | MiniText>(node: T, ref: MiniElement | MiniText | null): T {
    const adopted = this.adopt(node, 'insertBefore');
    const at = ref ? this.childNodes.indexOf(ref) : -1;
    if (at === -1) this.childNodes.push(adopted);
    else this.childNodes.splice(at, 0, adopted);
    return node;
  }
  removeChild<T extends MiniElement | MiniText>(node: T): T {
    const at = this.childNodes.indexOf(node);
    if (at === -1) throw new DomError('removeChild: that element is not a child of this one.');
    this.childNodes.splice(at, 1);
    if (node instanceof MiniElement) node.parentElement = null;
    return node;
  }
  replaceChildren(...nodes: (MiniElement | string)[]) {
    for (const child of this.children) child.parentElement = null;
    this.childNodes = [];
    this.append(...nodes);
  }
  remove() {
    this.parentElement?.removeChild(this);
  }
  contains(other: MiniElement | null): boolean {
    for (let node: MiniElement | null = other; node; node = node.parentElement) if (node === this) return true;
    return false;
  }
  closest(selector: string): MiniElement | null {
    const matchers = parseSelectorList(selector);
    for (let node: MiniElement | null = this; node; node = node.parentElement) {
      if (matchers.some((m) => matchesSelector(node!, m))) return node;
    }
    return null;
  }
  matches(selector: string): boolean {
    return parseSelectorList(selector).some((m) => matchesSelector(this, m));
  }
  querySelector(selector: string): MiniElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
  querySelectorAll(selector: string): MiniElement[] {
    const matchers = parseSelectorList(selector);
    const found: MiniElement[] = [];
    const walk = (el: MiniElement) => {
      for (const child of el.children) {
        if (matchers.some((m) => matchesSelector(child, m))) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }
  getElementsByTagName(tag: string): MiniElement[] {
    return this.querySelectorAll(String(tag));
  }
  getElementsByClassName(name: string): MiniElement[] {
    return this.querySelectorAll(`.${String(name)}`);
  }

  // ── content ──

  get textContent(): string {
    return this.childNodes.map((n) => (n instanceof MiniText ? n.data : n.textContent)).join('');
  }
  set textContent(value: unknown) {
    this.replaceChildren();
    const text = String(value);
    if (text !== '') this.childNodes.push(new MiniText(text));
  }
  get innerText(): string {
    return this.textContent;
  }
  set innerText(value: unknown) {
    this.textContent = value;
  }
  get innerHTML(): string {
    return this.childNodes.map((n) => (n instanceof MiniText ? escapeText(n.data) : n.outerHTML)).join('');
  }
  set innerHTML(html: unknown) {
    const source = String(html);
    if (source.length > DOM_LIMITS.maxHtml) throw new DomError(`That HTML is ${source.length} characters long. innerHTML takes at most ${DOM_LIMITS.maxHtml}.`);
    const nodes = parseHtml(this.doc, source);
    this.replaceChildren();
    for (const node of nodes) this.childNodes.push(this.adopt(node));
  }
  get outerHTML(): string {
    const attrs = sortAttrs(this.attrs).map(([k, v]) => (BOOLEAN_ATTRS.has(k) && v === '' ? ` ${k}` : ` ${k}="${escapeAttr(v)}"`)).join('');
    if (VOID_TAGS.has(this.tag)) return `<${this.tag}${attrs}>`;
    return `<${this.tag}${attrs}>${this.innerHTML}</${this.tag}>`;
  }

  // ── events ──

  addEventListener(type: string, listener: Listener) {
    if (typeof listener !== 'function') throw new DomError(`addEventListener("${type}", ...) needs a function as its second argument.`);
    const list = this.listeners.get(String(type)) ?? [];
    if (!list.includes(listener)) list.push(listener);
    this.listeners.set(String(type), list);
  }
  removeEventListener(type: string, listener: Listener) {
    const list = this.listeners.get(String(type));
    if (list) this.listeners.set(String(type), list.filter((l) => l !== listener));
  }
  /** `on<type>` properties, e.g. `button.onclick = () => ...`. */
  set onclick(listener: Listener | null) {
    this.setHandler('click', listener);
  }
  set oninput(listener: Listener | null) {
    this.setHandler('input', listener);
  }
  set onchange(listener: Listener | null) {
    this.setHandler('change', listener);
  }
  set onsubmit(listener: Listener | null) {
    this.setHandler('submit', listener);
  }
  private handlers = new Map<string, Listener>();
  private setHandler(type: string, listener: Listener | null) {
    const old = this.handlers.get(type);
    if (old) this.removeEventListener(type, old);
    if (listener) {
      this.handlers.set(type, listener);
      this.addEventListener(type, listener);
    }
  }
  /** Fire at this element, then bubble to its ancestors and the document. */
  dispatchEvent(event: MiniEvent): boolean {
    if (!(event instanceof MiniEvent)) throw new DomError('dispatchEvent needs an Event, e.g. new Event("input").');
    event.target = this;
    for (let node: MiniElement | null = this; node && !event.propagationStopped; node = node.parentElement) {
      event.currentTarget = node;
      for (const listener of [...(node.listeners.get(event.type) ?? [])]) listener.call(node, event);
    }
    if (!event.propagationStopped) this.doc.fire(event);
    if (!event.defaultPrevented) this.defaultAction(event);
    return !event.defaultPrevented;
  }
  private defaultAction(event: MiniEvent) {
    if (event.type === 'click') {
      if (this.tag === 'input' && this.type === 'checkbox') {
        this.checked = !this.checked;
        this.dispatchEvent(new MiniEvent('change'));
      }
      const form = this.closest('form');
      const submits = (this.tag === 'button' && this.type === 'submit') || (this.tag === 'input' && this.type === 'submit');
      if (form && submits && !this.disabled) form.dispatchEvent(new MiniEvent('submit'));
    }
  }
  click() {
    if (this.disabled) return;
    this.dispatchEvent(new MiniEvent('click'));
  }
  focus() {}
  blur() {}
  requestSubmit() {
    this.dispatchEvent(new MiniEvent('submit'));
  }
  /** A form's `reset()` clears what was typed into its fields. */
  reset() {
    for (const field of this.querySelectorAll('input, textarea, select')) {
      field.liveValue = undefined;
      field.liveChecked = undefined;
    }
  }

  // ── output ──

  /** Attributes plus live state, as shown in the outline and the Play it snapshot. */
  private shownAttrs(): [string, string][] {
    const shown = new Map(this.attrs);
    if (FORM_FIELDS.has(this.tag) && this.liveValue !== undefined && this.tag !== 'select') shown.set('value', this.liveValue);
    if (this.liveChecked !== undefined) {
      if (this.liveChecked) shown.set('checked', '');
      else shown.delete('checked');
    }
    const style = Object.entries(this.style)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => `${kebab(k)}: ${String(v)}`)
      .join('; ');
    if (style) shown.set('style', style.slice(0, DOM_LIMITS.maxStyle));
    return sortAttrs(shown);
  }
  /** One element per line, children indented, text inline when that is all there is. */
  outline(depth = 0): string[] {
    const pad = '  '.repeat(depth);
    const attrs = this.shownAttrs()
      .map(([k, v]) => (BOOLEAN_ATTRS.has(k) && v === '' ? ` ${k}` : ` ${k}="${escapeAttr(v)}"`))
      .join('');
    const open = `${pad}<${this.tag}${attrs}>`;
    if (VOID_TAGS.has(this.tag)) return [open];
    if (this.childNodes.every((n) => n instanceof MiniText)) return [`${open}${escapeText(this.textContent)}</${this.tag}>`];
    const lines = [open];
    for (const node of this.childNodes) {
      if (node instanceof MiniText) lines.push(`${pad}  ${escapeText(node.data)}`);
      else lines.push(...node.outline(depth + 1));
    }
    lines.push(`${pad}</${this.tag}>`);
    return lines;
  }
  snapshot(path: string): PageNode {
    let index = 0;
    return {
      tag: this.tag,
      attrs: Object.fromEntries(this.shownAttrs()),
      children: this.childNodes.map((n) => (n instanceof MiniText ? n.data : n.snapshot(path === '@' ? `@${index++}` : `${path}/${index++}`))),
      path,
    };
  }
  toString(): string {
    return `[object HTML${this.tag === 'body' ? 'Body' : ''}Element]`;
  }
  /** `console.log(el)` and the step-through show the opening tag, not the object's internals. */
  [PREVIEW](): string {
    return this.outline().at(0) ?? `<${this.tag}>`;
  }
}

// ── selectors ──

interface Compound {
  tag?: string;
  id?: string;
  classes: string[];
  attrs: [string, string | undefined][];
}
interface Selector {
  /** Rightmost compound first, each with how it relates to the next one up the tree. */
  parts: { compound: Compound; combinator: ' ' | '>' | null }[];
}

function parseCompound(text: string): Compound {
  const compound: Compound = { classes: [], attrs: [] };
  const re = /([a-zA-Z][\w-]*)|#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:=["']?([^\]"']*)["']?)?\]|(\*)/gy;
  let at = 0;
  let m: RegExpExecArray | null;
  while (at < text.length && (m = re.exec(text))) {
    if (m[1]) compound.tag = m[1].toLowerCase();
    else if (m[2]) compound.id = m[2];
    else if (m[3]) compound.classes.push(m[3]);
    else if (m[4]) compound.attrs.push([m[4].toLowerCase(), m[5]]);
    at = re.lastIndex;
  }
  if (at !== text.length) throw new DomError(`"${text}" is not a selector this page understands (use tag, #id, .class or [attr]).`);
  return compound;
}

function parseSelectorList(selector: string): Selector[] {
  const text = String(selector).trim();
  if (!text) throw new DomError('The selector is empty.');
  return text.split(',').map((one) => {
    const tokens = one.trim().split(/\s*(>)\s*|\s+/).filter((t) => t !== undefined && t !== '');
    const parts: Selector['parts'] = [];
    let combinator: ' ' | '>' | null = null;
    // Walk from the right so matching can start at the candidate element.
    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i]!;
      if (token === '>') {
        if (parts.length) parts[parts.length - 1]!.combinator = '>';
        continue;
      }
      parts.push({ compound: parseCompound(token), combinator });
      combinator = ' ';
    }
    // Each part's combinator says how it relates to the *next* part (its ancestor side).
    for (let i = 0; i < parts.length - 1; i++) if (parts[i]!.combinator === null) parts[i]!.combinator = ' ';
    return { parts };
  });
}

function matchesCompound(el: MiniElement, c: Compound): boolean {
  if (c.tag && c.tag !== '*' && el.tagName.toLowerCase() !== c.tag) return false;
  if (c.id !== undefined && el.id !== c.id) return false;
  if (!c.classes.every((cls) => el.classList.contains(cls))) return false;
  return c.attrs.every(([name, value]) => (value === undefined ? el.hasAttribute(name) : el.getAttribute(name) === value));
}

function matchesSelector(el: MiniElement, selector: Selector): boolean {
  const parts = selector.parts;
  if (!parts.length || !matchesCompound(el, parts[0]!.compound)) return false;
  const rest = (node: MiniElement | null, index: number): boolean => {
    if (index >= parts.length) return true;
    const how = parts[index - 1]!.combinator;
    if (how === '>') return !!node && matchesCompound(node, parts[index]!.compound) && rest(node.parentElement, index + 1);
    for (let up = node; up; up = up.parentElement) {
      if (matchesCompound(up, parts[index]!.compound) && rest(up.parentElement, index + 1)) return true;
    }
    return false;
  };
  return rest(el.parentElement, 1);
}

// ── parsing ──

const tooBig = () => new DomError(`That HTML has more than ${DOM_LIMITS.maxNodes} elements. Use less of it.`);

/** Parse a fragment of HTML into nodes. Whitespace-only text between tags is dropped. */
function parseHtml(doc: MiniDocument, html: string): (MiniElement | MiniText)[] {
  const root = new MiniElement(doc, 'root');
  const stack: MiniElement[] = [root];
  let made = 0;
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>|([^<]+)|(<)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [whole, close, open, attrText, text, stray] = m;
    const top = stack[stack.length - 1]!;
    if (whole.startsWith('<!--')) continue;
    if (close) {
      const tag = close.toLowerCase();
      for (let at = stack.length - 1; at > 0; at--) {
        if (stack[at]!.tagName.toLowerCase() === tag) {
          stack.length = at;
          break;
        }
      }
    } else if (open) {
      if (++made > DOM_LIMITS.maxNodes) throw tooBig();
      // A tag this page does not know becomes a plain `span`, so `<script>`, `<iframe>` and
      // the like can never reach the snapshot as themselves.
      const name = open.toLowerCase();
      const known = KNOWN_TAGS.has(name);
      const el = new MiniElement(doc, known ? name : 'span');
      const attrRe = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
      let a: RegExpExecArray | null;
      while ((a = attrRe.exec(attrText ?? ''))) {
        // Names the page cannot hold (`_x`, `9a`) and over-long values are skipped, not fatal.
        const value = decodeEntities(a[2] ?? a[3] ?? a[4] ?? '');
        if (ATTR_NAME.test(a[1]!) && value.length <= DOM_LIMITS.maxAttrValue) el.setAttribute(a[1]!, value);
      }
      top.appendChild(el);
      if (!VOID_TAGS.has(name) && !whole.endsWith('/>')) stack.push(el);
    } else if (text !== undefined) {
      const data = decodeEntities(text.replace(/\s+/g, ' '));
      if (data.trim() !== '') {
        if (++made > DOM_LIMITS.maxNodes) throw tooBig();
        top.appendChild(new MiniText(data.trim().slice(0, DOM_LIMITS.maxTextNode)));
      }
    } else if (stray) {
      if (++made > DOM_LIMITS.maxNodes) throw tooBig();
      top.appendChild(new MiniText('<'));
    }
  }
  const nodes = root.childNodes;
  for (const node of nodes) if (node instanceof MiniElement) node.parentElement = null;
  return nodes;
}

// ── document ──

export class MiniDocument {
  readonly body: MiniElement;
  private readonly listeners = new Map<string, Listener[]>();

  private created = 0;
  /** Counts every node a run makes, so a loop of `createElement` can't run away. */
  noteCreated() {
    if (++this.created > DOM_LIMITS.maxCreated) {
      throw new DomError(`This program has made more than ${DOM_LIMITS.maxCreated} elements. Is a loop creating them forever?`);
    }
  }

  constructor(html: string) {
    this.body = new MiniElement(this, 'body');
    this.body.innerHTML = html;
  }
  get documentElement(): MiniElement {
    return this.body;
  }
  createElement(tag: string): MiniElement {
    const name = String(tag).toLowerCase();
    if (!KNOWN_TAGS.has(name)) throw new DomError(`"${tag}" is not an HTML element this page knows (try div, p, li, button, input...).`);
    return new MiniElement(this, name);
  }
  createTextNode(text: unknown): MiniText {
    this.noteCreated();
    return new MiniText(String(text));
  }
  getElementById(id: string): MiniElement | null {
    const wanted = String(id);
    const find = (el: MiniElement): MiniElement | null => {
      for (const child of el.children) {
        if (child.id === wanted) return child;
        const hit = find(child);
        if (hit) return hit;
      }
      return null;
    };
    return find(this.body);
  }
  querySelector(selector: string): MiniElement | null {
    if (String(selector).trim() === 'body') return this.body;
    return this.body.querySelector(selector);
  }
  querySelectorAll(selector: string): MiniElement[] {
    return this.body.querySelectorAll(selector);
  }
  getElementsByTagName(tag: string): MiniElement[] {
    return this.body.getElementsByTagName(tag);
  }
  getElementsByClassName(name: string): MiniElement[] {
    return this.body.getElementsByClassName(name);
  }
  addEventListener(type: string, listener: Listener) {
    const list = this.listeners.get(String(type)) ?? [];
    list.push(listener);
    this.listeners.set(String(type), list);
  }
  removeEventListener(type: string, listener: Listener) {
    const list = this.listeners.get(String(type));
    if (list) this.listeners.set(String(type), list.filter((l) => l !== listener));
  }
  /** Document-level listeners, reached after an event has bubbled past `body`. */
  fire(event: MiniEvent) {
    for (const listener of [...(this.listeners.get(event.type) ?? [])]) listener.call(this, event);
  }

  /** The page as a readable outline: what the tests compare. */
  render(): string {
    return this.body.childNodes.flatMap((n) => (n instanceof MiniText ? [escapeText(n.data)] : n.outline())).join('\n');
  }
  snapshot(): PageNode {
    return this.body.snapshot('@');
  }
  toString(): string {
    return '[object HTMLDocument]';
  }
  [PREVIEW](): string {
    return '[object HTMLDocument]';
  }
  /** Resolve a `DomEvent` target: `#id` or `@` child-index path. */
  resolve(target: string): MiniElement | null {
    if (target.startsWith('#')) return this.getElementById(target.slice(1));
    if (target === '@') return this.body;
    if (!target.startsWith('@')) return this.querySelector(target);
    let node: MiniElement = this.body;
    for (const step of target.slice(1).split('/')) {
      const next = node.children[Number(step)];
      if (!next) return null;
      node = next;
    }
    return node;
  }
  /** Replay interactions after the program has set up its handlers. */
  replay(events: DomEvent[]) {
    for (const event of Array.isArray(events) ? events.slice(0, DOM_LIMITS.maxEvents) : []) {
      if (!event || typeof event.target !== 'string' || event.target.length > DOM_LIMITS.maxEventTarget) continue;
      const value = typeof event.value === 'string' ? event.value.slice(0, DOM_LIMITS.maxEventValue) : undefined;
      let el: MiniElement | null;
      try {
        el = this.resolve(event.target);
      } catch {
        continue; // a target that is not a selector this page understands
      }
      if (!el) continue;
      if (event.type === 'click') {
        el.click();
      } else if (event.type === 'input' || event.type === 'change') {
        el.value = value ?? '';
        el.dispatchEvent(new MiniEvent('input'));
        el.dispatchEvent(new MiniEvent('change'));
      } else if (event.type === 'submit') {
        el.dispatchEvent(new MiniEvent('submit'));
      }
      // Any other type is ignored: events come from the app, not from the program.
    }
  }
}

/** The globals a DOM level sees: `document`, `Event`, `render()`, `alert` and a tiny `window`. */
export function domBindings(doc: MiniDocument, log: (text: string) => void): Record<string, unknown> {
  // Pages have no dialogs here: `alert` prints its message so the program keeps running.
  const alert = (message: unknown) => log(`[alert] ${String(message)}`);
  return {
    document: doc,
    Event: MiniEvent,
    HTMLElement: MiniElement,
    Element: MiniElement,
    render: () => doc.render(),
    alert,
    window: { document: doc, alert },
  };
}

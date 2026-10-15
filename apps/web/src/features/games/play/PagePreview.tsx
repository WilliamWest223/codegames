import { createElement, useEffect, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import type { DomEvent, PageNode } from '@codegames/runtime';
import { stylePropsFrom } from './pageStyle';
import './PagePreview.css';

/**
 * Draws a Web Pages level's page (the runtime's `PageNode` snapshot) as real React elements
 * inside a small "browser frame". Interactions become `DomEvent`s for the program to handle on
 * its next run (`onEvent`); without `onEvent` the page is read-only.
 *
 * Safety: nothing from the snapshot reaches the DOM as HTML. Tags outside the allow-list
 * render as plain spans, attributes outside ATTRS are dropped, `<img>` never loads its
 * `src`, links never navigate, and learner classes and ids are prefixed (`pg-`) or moved to
 * `data-id` so they can't collide with the app's own styles or anchors.
 */

const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'button', 'input', 'select', 'option',
  'form', 'label', 'fieldset', 'legend', 'strong', 'em', 'b', 'i', 'u', 'small', 'code', 'pre', 'a', 'section', 'header', 'footer',
  'nav', 'main', 'article', 'aside', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br', 'textarea', 'progress', 'img',
]);
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input']);
/** Plain attributes that pass through, and the React prop each becomes. */
const TEXT_ATTRS: Record<string, string> = { title: 'title', alt: 'alt', placeholder: 'placeholder', min: 'min', max: 'max', step: 'step' };
/** `<input type>` values the preview honours; anything else (`file`, `image`, ...) is a text box. */
export const ALLOWED_INPUT_TYPES: ReadonlySet<string> = new Set(['text', 'number', 'checkbox', 'radio', 'button', 'submit', 'reset', 'email', 'password', 'search', 'date']);
const DATA_ATTR = /^data-[a-z0-9-]+$/;
/** Longest value drawn for an attribute, by kind. */
const MAX_ATTR = 500;
const MAX_VALUE = 1000;

export function safeInputType(type: string | undefined): string {
  const t = (type ?? 'text').toLowerCase();
  return ALLOWED_INPUT_TYPES.has(t) ? t : 'text';
}
const NUMBER_ATTRS: Record<string, string> = { rows: 'rows', cols: 'cols', maxlength: 'maxLength', colspan: 'colSpan', rowspan: 'rowSpan' };

/** What the user typed or ticked, shown until the program has re-run with that event. */
type Drafts = Record<string, string | boolean>;

interface Props {
  /** The page's `body` snapshot. */
  node: PageNode;
  /** Receives clicks, typing, select changes and form submits. Omit for a read-only page. */
  onEvent?: (event: DomEvent) => void;
  /** True when `node` reflects every event sent so far, so drafts can be dropped. */
  settled?: boolean;
}

function ownText(node: PageNode): string {
  return node.children.filter((c): c is string => typeof c === 'string').join('');
}

export function PagePreview({ node, onEvent, settled = true }: Props) {
  const [drafts, setDrafts] = useState<Drafts>({});
  // A select's choice stays local: the snapshot does not carry a select's live value.
  const [picks, setPicks] = useState<Record<string, string>>({});
  useEffect(() => {
    if (settled) setDrafts({});
  }, [settled, node]);

  const live = !!onEvent;
  const emit = (event: DomEvent) => onEvent?.(event);

  const render = (item: PageNode | string, key: number): ReactNode => {
    if (typeof item === 'string') return item;
    const { tag, attrs, path } = item;
    const children = item.children.map((child, i) => render(child, i));
    if (!ALLOWED_TAGS.has(tag)) {
      return (
        <span key={key} className="pg-unknown" data-tag={tag}>
          {children}
        </span>
      );
    }
    if (tag === 'img') {
      return (
        <span key={key} className="pg-img" data-path={path} role="img" aria-label={(attrs.alt ?? 'image').slice(0, MAX_ATTR)}>
          🖼 {(attrs.alt ?? 'image').slice(0, MAX_ATTR)}
        </span>
      );
    }

    const props: Record<string, unknown> = { key, 'data-path': path };
    if (attrs.class) props.className = attrs.class.slice(0, MAX_ATTR).split(/\s+/).filter(Boolean).map((c) => `pg-${c}`).join(' ');
    if (attrs.id !== undefined) props['data-id'] = attrs.id.slice(0, MAX_ATTR);
    if (attrs.hidden !== undefined) props.hidden = true;
    if (attrs.disabled !== undefined) props.disabled = true;
    if (attrs.style) props.style = stylePropsFrom(attrs.style);
    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith('data-')) {
        if (DATA_ATTR.test(name)) props[name] = value.slice(0, MAX_ATTR);
      } else if (TEXT_ATTRS[name]) props[TEXT_ATTRS[name]] = value.slice(0, MAX_ATTR);
      else if (NUMBER_ATTRS[name] && !Number.isNaN(Number(value))) props[NUMBER_ATTRS[name]] = Number(value);
    }

    const isField = tag === 'input' || tag === 'textarea' || tag === 'select';
    const inputType = safeInputType(attrs.type);
    const checkbox = tag === 'input' && (inputType === 'checkbox' || inputType === 'radio');
    // Bubbling is the mini DOM's job: stop it here so a click reaches the program once.
    // Clicking into a field is typing or ticking, not a "click" the program should see.
    props.onClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (tag === 'a') e.preventDefault();
      if (isField) return;
      // A submit button's click reaches its form through the mini DOM's default action, not the browser's.
      if (tag === 'button' && attrs.type !== 'button' && attrs.type !== 'reset') e.preventDefault();
      if (live) emit({ type: 'click', target: path });
    };

    if (tag === 'a') props.href = '#';
    if (tag === 'button') props.type = attrs.type === 'button' || attrs.type === 'reset' ? attrs.type : 'submit';
    if (tag === 'form') {
      // Reached by pressing Enter in a field (button clicks are handled above).
      props.onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (live) emit({ type: 'submit', target: path });
      };
    }
    if (checkbox) {
      const draft = drafts[path];
      const checked = typeof draft === 'boolean' ? draft : attrs.checked !== undefined;
      props.checked = checked;
      props.onChange = () => {
        if (!live) return;
        setDrafts((d) => ({ ...d, [path]: !checked }));
        emit({ type: 'click', target: path });
      };
    } else if (tag === 'input' || tag === 'textarea') {
      const draft = drafts[path];
      props.value = (typeof draft === 'string' ? draft : (attrs.value ?? (tag === 'textarea' ? ownText(item) : ''))).slice(0, MAX_VALUE);
      // Typing is capped too, so an event never carries more than the runtime will accept.
      props.maxLength = typeof props.maxLength === 'number' ? Math.min(props.maxLength, MAX_VALUE) : MAX_VALUE;
      props.onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!live) return;
        setDrafts((d) => ({ ...d, [path]: e.target.value }));
        emit({ type: 'input', target: path, value: e.target.value });
      };
      props.readOnly = !live || attrs.readonly !== undefined;
      if (tag === 'input') props.type = inputType;
      if (tag === 'textarea') return createElement('textarea', props);
    } else if (tag === 'select') {
      const options = item.children.filter((c): c is PageNode => typeof c !== 'string' && c.tag === 'option');
      const optionValue = (o: PageNode) => o.attrs.value ?? ownText(o);
      const chosen = options.find((o) => o.attrs.selected !== undefined) ?? options[0];
      props.value = (picks[path] ?? (chosen ? optionValue(chosen) : '')).slice(0, MAX_VALUE);
      props.onChange = (e: ChangeEvent<HTMLSelectElement>) => {
        if (!live) return;
        setPicks((p) => ({ ...p, [path]: e.target.value }));
        emit({ type: 'change', target: path, value: e.target.value });
      };
    } else if (tag === 'option') {
      props.value = (attrs.value ?? ownText(item)).slice(0, MAX_VALUE);
    } else if (tag === 'progress') {
      if (attrs.value !== undefined) props.value = Number(attrs.value);
    }

    if (VOID_TAGS.has(tag)) return createElement(tag, props);
    return createElement(tag, props, ...children);
  };

  return (
    <section className={`page-preview${live ? ' is-live' : ''}`} aria-label="Your page">
      <div className="page-preview-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <span className="page-preview-url">your page</span>
      </div>
      <div className="page-preview-body" data-path={node.path} onClick={() => live && emit({ type: 'click', target: node.path })}>
        {node.children.map((child, i) => render(child, i))}
      </div>
    </section>
  );
}

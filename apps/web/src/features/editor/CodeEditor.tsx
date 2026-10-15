import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { EditorState, StateEffect, StateField, type Extension } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import type { PlayableLanguage } from '@codegames/shared';
import { editorHighlight, editorTheme } from './theme';
import { playClick } from '../../lib/soundFx';
import './CodeEditor.css';

/** The most the editor will hold (about 50 KB of code). Real programs here are a few hundred characters. */
export const MAX_EDITOR_CHARS = 50_000;

/**
 * Refuse any change that would grow the document past `MAX_EDITOR_CHARS` (a huge paste, or
 * typing forever). Changes that keep or shrink it always pass, so a long draft can still be
 * cut down. `onRefuse` lets the UI explain what happened.
 */
export function sizeLimit(onRefuse: () => void): Extension {
  return EditorState.transactionFilter.of((tr) => {
    if (tr.docChanged && tr.newDoc.length > MAX_EDITOR_CHARS && tr.newDoc.length > tr.startState.doc.length) {
      onRefuse();
      return [];
    }
    return tr;
  });
}

/** Highlight `___` blanks so fill-in-the-blank levels are obvious. */
const blankMatcher = new MatchDecorator({ regexp: /___/g, decoration: Decoration.mark({ class: 'cm-blank' }) });
const blanks = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = blankMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.decorations = blankMatcher.updateDeco(update, this.decorations);
    }
  },
  { decorations: (v) => v.decorations },
);

/** A single highlighted line (error line, or the line the robot is running), cleared on edit. */
function lineHighlighter(className: string) {
  const set = StateEffect.define<number | null>();
  const field = StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(deco, tr) {
      for (const effect of tr.effects) {
        if (effect.is(set)) {
          const line = effect.value;
          if (line === null || line < 1 || line > tr.state.doc.lines) return Decoration.none;
          return Decoration.set([Decoration.line({ class: className }).range(tr.state.doc.line(line).from)]);
        }
      }
      return tr.docChanged ? Decoration.none : deco.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
  return { set, field };
}
const errorLine = lineHighlighter('cm-error-line');
const runLine = lineHighlighter('cm-run-line');

export interface CodeEditorHandle {
  /** Insert text at the cursor (replacing any selection) and focus the editor. */
  insert: (text: string) => void;
  /**
   * Insert a whole command on its own line: below the cursor's line if that line has
   * code, keeping its indentation; at the end of the program if the editor was never used.
   */
  insertLine: (text: string) => void;
  /** Select the next `___` blank after the cursor (wrapping around). */
  nextBlank: () => void;
}

interface Props {
  value: string;
  onChange?: (value: string) => void;
  language: PlayableLanguage;
  readOnly?: boolean;
  errorLine?: number | null;
  /** Line currently executing (robot replay). */
  activeLine?: number | null;
  /** Change this (e.g. a run counter) to re-apply `errorLine` even if the line number is unchanged. */
  highlightKey?: number;
  /** Accessible name for the editor. */
  label: string;
  /** Imperative handle, e.g. to insert a command from a toolbar chip. */
  handle?: Ref<CodeEditorHandle>;
  minHeight?: number;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  errorLine: errorAt = null,
  activeLine = null,
  highlightKey = 0,
  label,
  minHeight = 220,
  handle,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  /** Has the learner placed the cursor yet (click, tap, typing)? */
  const touched = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [tooLong, setTooLong] = useState(false);
  const refuse = useRef<() => void>(() => undefined);
  refuse.current = () => {
    // Deferred: the filter runs in the middle of a transaction, and React state shouldn't change there.
    queueMicrotask(() => setTooLong(true));
  };

  useEffect(() => {
    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      history(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion({ activateOnTyping: false }),
      highlightActiveLine(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      language === 'python' ? python() : javascript(),
      indentUnit.of(language === 'python' ? '    ' : '  '),
      EditorState.tabSize.of(language === 'python' ? 4 : 2),
      editorTheme,
      editorHighlight,
      blanks,
      errorLine.field,
      runLine.field,
      // Wrap long lines (e.g. route lists) instead of scrolling sideways, which hides line starts.
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': label }),
      sizeLimit(() => refuse.current()),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          playClick();
          onChangeRef.current?.(update.state.doc.toString());
          if (update.state.doc.length <= MAX_EDITOR_CHARS - 1000) setTooLong(false);
        }
        if (update.focusChanged && update.view.hasFocus) touched.current = true;
      }),
    ];
    const v = new EditorView({ state: EditorState.create({ doc: value.slice(0, MAX_EDITOR_CHARS), extensions }), parent: host.current! });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // Recreate only when the language or editability changes; value syncs below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly, label]);

  useImperativeHandle(handle, () => ({
    insert(text: string) {
      const v = view.current;
      if (!v || readOnly) return;
      const { from, to } = v.state.selection.main;
      v.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
      v.focus();
    },
    insertLine(text: string) {
      const v = view.current;
      if (!v || readOnly) return;
      const doc = v.state.doc;
      // Never focused yet: the cursor is at the very start, so append to the end instead.
      const pos = touched.current ? v.state.selection.main.head : doc.length;
      const line = doc.lineAt(pos);
      const indent = line.text.match(/^\s*/)![0];
      let insert: string;
      let from: number;
      if (line.text.trim() === '') {
        from = line.from;
        insert = indent + text;
        v.dispatch({ changes: { from, to: line.to, insert }, selection: { anchor: from + insert.length } });
      } else {
        from = line.to;
        insert = '\n' + indent + text;
        v.dispatch({ changes: { from, insert }, selection: { anchor: from + insert.length } });
      }
      touched.current = true;
      v.focus();
    },
    nextBlank() {
      const v = view.current;
      if (!v || readOnly) return;
      const text = v.state.doc.toString();
      const start = v.state.selection.main.to;
      let at = text.indexOf('___', start);
      if (at === -1) at = text.indexOf('___');
      if (at === -1) return;
      v.dispatch({ selection: { anchor: at, head: at + 3 }, scrollIntoView: true });
      touched.current = true;
      v.focus();
    },
  }));

  // Sync external value changes (reset, level change) without clobbering typing.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: errorLine.set.of(errorAt) });
  }, [errorAt, highlightKey]);

  useEffect(() => {
    view.current?.dispatch({ effects: runLine.set.of(activeLine) });
  }, [activeLine]);

  return (
    <>
      <div className="code-editor" ref={host} style={{ minHeight }} />
      {tooLong && (
        <p role="status" style={{ margin: '6px 2px 0', fontSize: '0.85rem', color: 'var(--danger)' }}>
          That is more than the editor can hold ({MAX_EDITOR_CHARS.toLocaleString()} characters), so it was not added. Programs here are much shorter: try a smaller piece.
        </p>
      )}
    </>
  );
}

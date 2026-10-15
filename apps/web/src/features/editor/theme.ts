import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/** Editor chrome matched to the app's design tokens. */
export const editorTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--text)',
      backgroundColor: '#070a11',
      fontSize: '14px',
      height: '100%',
    },
    // No ligatures: learners must see (and type) `>=` as two characters, not `≥`.
    '.cm-scroller': { fontFamily: 'var(--font-code)', lineHeight: '1.65', fontVariantLigatures: 'none' },
    '.cm-content': { caretColor: 'var(--signal)', padding: '12px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--signal)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(94, 242, 184, 0.18) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#070a11',
      color: 'var(--text-faint)',
      border: 'none',
      paddingRight: '4px',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(148, 170, 214, 0.05)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text-muted)' },
    '.cm-matchingBracket': { backgroundColor: 'rgba(94, 242, 184, 0.15)', outline: 'none' },
    '.cm-blank': {
      backgroundColor: 'var(--amber-soft)',
      color: 'var(--amber)',
      borderRadius: '4px',
      outline: '1px dashed rgba(255, 181, 71, 0.6)',
    },
    '.cm-error-line': { backgroundColor: 'var(--danger-soft)', boxShadow: 'inset 3px 0 0 var(--danger)' },
    '.cm-run-line': { backgroundColor: 'var(--signal-soft)', boxShadow: 'inset 3px 0 0 var(--signal)' },
    '&.cm-focused': { outline: 'none' },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword], color: '#c792ff' },
  { tag: [t.string, t.special(t.string)], color: '#5ef2b8' },
  { tag: [t.number, t.bool, t.null], color: '#ffb547' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#5d6984', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#7cc4ff' },
  { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName))], color: '#e9eef7', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#ff9fb0' },
  { tag: [t.propertyName], color: '#a8d8ff' },
  { tag: [t.variableName], color: '#e9eef7' },
  { tag: [t.bracket, t.paren, t.brace, t.punctuation], color: '#8d9ab3' },
]);

export const editorHighlight = syntaxHighlighting(highlight);

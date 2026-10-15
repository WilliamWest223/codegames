import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

/** Editor chrome matched to the app's precision matte chassis design tokens. */
export const editorTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--text)',
      backgroundColor: '#080A0F',
      fontSize: '14px',
      height: '100%',
    },
    // No ligatures: learners must see (and type) `>=` as two characters, not `≥`.
    '.cm-scroller': { fontFamily: 'var(--font-code)', lineHeight: '1.7', fontVariantLigatures: 'none' },
    '.cm-content': { caretColor: 'var(--signal)', padding: '14px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--signal)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(59, 130, 246, 0.25) !important',
    },
    '.cm-gutters': {
      backgroundColor: '#080A0F',
      color: 'var(--text-faint)',
      borderRight: '1px solid var(--border-subtle)',
      paddingRight: '6px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.025)',
      boxShadow: 'inset 2px 0 0 var(--border-contrast)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--text)',
      fontWeight: '600',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      outline: 'none',
    },
    '.cm-blank': {
      backgroundColor: 'var(--bezel)',
      color: 'var(--amber)',
      borderRadius: '3px',
      padding: '0 4px',
      border: '1px dashed var(--amber)',
    },
    '.cm-error-line': {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      boxShadow: 'inset 3px 0 0 var(--danger)',
    },
    '.cm-run-line': {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      boxShadow: 'inset 3px 0 0 var(--signal)',
    },
    '&.cm-focused': { outline: 'none' },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword], color: '#A78BFA' },
  { tag: [t.string, t.special(t.string)], color: '#10B981' },
  { tag: [t.number, t.bool, t.null], color: '#F59E0B' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#5C6680', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#3B82F6' },
  { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName))], color: '#E8ECF4', fontWeight: '600' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: '#EF4444' },
  { tag: [t.propertyName], color: '#6B7FD4' },
  { tag: [t.variableName], color: '#E8ECF4' },
  { tag: [t.bracket, t.paren, t.brace, t.punctuation], color: '#8892AA' },
]);

export const editorHighlight = syntaxHighlighting(highlight);

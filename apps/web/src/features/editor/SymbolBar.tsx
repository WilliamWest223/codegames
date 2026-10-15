import type { RefObject } from 'react';
import type { PlayableLanguage } from '@codegames/shared';
import type { CodeEditorHandle } from './CodeEditor';
import './SymbolBar.css';

const SYMBOLS: Record<PlayableLanguage, string[]> = {
  python: [':', '(', ')', '"', '=', '==', '+', '<', '>', '#', '[', ']', '_'],
  javascript: [';', '(', ')', '{', '}', '"', '`', '=', '===', '+', '<', '>', '//'],
  cybersecurity: [':', '(', ')', '"', '=', '==', '+', '%', '^', '#', '[', ']', '_'],
};

/**
 * Typing symbols on a phone keyboard is painful, so touch devices get a row of the
 * symbols code needs most, an indent key, and "next blank" for fill-in-the-blank levels.
 * Shown only for coarse pointers (CSS), plus the blank jump whenever blanks exist.
 */
export function SymbolBar({ editor, language, hasBlanks }: { editor: RefObject<CodeEditorHandle | null>; language: PlayableLanguage; hasBlanks: boolean }) {
  const indent = language === 'javascript' ? '  ' : '    ';
  return (
    <div className="symbol-bar" role="toolbar" aria-label="Insert symbols">
      {hasBlanks && (
        <button type="button" className="symbol-key symbol-key-wide" onClick={() => editor.current?.nextBlank()}>
          ⏭ Next blank
        </button>
      )}
      <div className="symbol-keys">
        <button type="button" className="symbol-key symbol-key-wide" onClick={() => editor.current?.insert(indent)} aria-label="Indent">
          ⇥ Tab
        </button>
        {SYMBOLS[language].map((s) => (
          <button key={s} type="button" className="symbol-key" onClick={() => editor.current?.insert(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

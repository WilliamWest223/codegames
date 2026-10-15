import { useState } from 'react';
import type { Language } from '@codegames/shared';
import { Markdown } from '../../lib/markdown';
import { playSwitch } from '../../lib/soundFx';

interface Props {
  hints: string[];
  language: Language;
  /** Draw attention to hints after repeated failures. */
  nudge: boolean;
  onReveal: (count: number) => void;
  /** Hints already opened (e.g. before a reload). */
  initialShown?: number;
  /** Failed checks still needed before the first hint opens (bosses: try it yourself first). */
  lockedFor?: number;
}

/** Progressive hints: each click reveals the next, gentle first, specific last. */
export function HintBox({ hints, language, nudge, onReveal, initialShown = 0, lockedFor = 0 }: Props) {
  const [shown, setShown] = useState(() => Math.min(initialShown, hints.length));
  const reveal = () => {
    playSwitch();
    const next = Math.min(shown + 1, hints.length);
    setShown(next);
    onReveal(next);
  };
  return (
    <div className="hints">
      {hints.slice(0, shown).map((hint, i) => (
        <div key={i} className="hint">
          <span className="hint-index">Hint {i + 1}</span>
          <Markdown text={hint} language={language} inline trusted />
        </div>
      ))}
      {shown < hints.length && shown === 0 && lockedFor > 0 && (
        <p className="hint-locked">
          💡 Boss hints open after {lockedFor} more {lockedFor === 1 ? 'check' : 'checks'}. Give it your own try first.
        </p>
      )}
      {shown < hints.length && !(shown === 0 && lockedFor > 0) && (
        <button className={`btn btn-sm ${nudge ? 'hint-nudge' : 'btn-ghost'}`} onClick={reveal}>
          💡 {shown === 0 ? (nudge ? 'Stuck? Get a hint' : 'Get a hint') : 'Another hint'}
          <span className="hint-count">
            {shown}/{hints.length}
          </span>
        </button>
      )}
    </div>
  );
}

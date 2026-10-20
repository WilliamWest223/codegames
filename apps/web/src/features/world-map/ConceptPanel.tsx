import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { concepts, levels, type MasteryLevel } from '@codegames/curriculum';
import type { Concept, PlayableLanguage } from '@codegames/shared';
import { useProgress } from '../progress/store';
import { GAME_ICONS, GAME_LABELS, MASTERY_LABELS, ROLE_LABELS } from '../../lib/labels';

interface Props {
  concept: Concept;
  language: PlayableLanguage;
  mastery: Record<string, MasteryLevel>;
  onClose: () => void;
}

/** Side panel listing a concept's levels, or what's needed to unlock it. */
export function ConceptPanel({ concept, language, mastery, onClose }: Props) {
  const completed = useProgress((s) => s.completed[language]);
  const conceptLevels = levels.filter((l) => l.conceptId === concept.id);
  const state = mastery[concept.id]!;
  const locked = state === 'locked';
  const missing = concept.requires.filter((id) => !['practiced', 'proficient'].includes(mastery[id] ?? 'locked'));
  const closeRef = useRef<HTMLButtonElement>(null);

  // onClose is a new function every parent render: keep it in a ref so the effect (and its
  // focus grab) runs only on mount / concept change.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [concept.id]);

  return (
    <aside className="concept-panel panel" aria-label={`${concept.title} levels`}>
      <div className="concept-panel-head">
        <span className={`chip ${concept.boss ? 'chip-amber' : 'chip-signal'}`}>{concept.boss ? 'Boss' : MASTERY_LABELS[state]}</span>
        <button ref={closeRef} className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <h2>{concept.title}</h2>
      <p className="concept-panel-summary">{concept.summary}</p>

      {locked ? (
        <div className="concept-panel-locked">
          <p>🔒 Unlock this by practicing:</p>
          <ul>
            {missing.map((id) => (
              <li key={id}>{concepts.find((c) => c.id === id)?.title}</li>
            ))}
          </ul>
          <p className="concept-panel-hint">A concept counts as practiced once its Intro, Combine, and Integrate levels are done.</p>
        </div>
      ) : (
        <ol className="concept-levels">
          {conceptLevels.map((level, i) => {
            const done = !!completed[level.id];
            return (
              <li key={level.id}>
                <Link to={`/play/${level.id}`} className={`concept-level${done ? ' is-done' : ''}`}>
                  <span className="concept-level-status" aria-hidden="true">
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="concept-level-body">
                    <span className="concept-level-title">{level.title}</span>
                    <span className="concept-level-meta">
                      {GAME_ICONS[level.game]} {GAME_LABELS[level.game]} · {ROLE_LABELS[level.role]}
                      {done && (
                        <span className="concept-level-stars" aria-label={`${completed[level.id]!.stars ?? 1} of 3 stars`}>
                          {' '}
                          {'★'.repeat(completed[level.id]!.stars ?? 1)}
                          <span className="is-off">{'★'.repeat(3 - (completed[level.id]!.stars ?? 1))}</span>
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="concept-level-go" aria-hidden="true">
                    {done ? '↻' : '▶'}
                  </span>
                  <span className="visually-hidden">{done ? '(completed, replay)' : '(play)'}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

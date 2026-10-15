import { Link } from 'react-router-dom';
import type { Concept, Level } from '@codegames/shared';
import type { MasteryLevel } from '@codegames/curriculum';
import { MASTERY_HELP, MASTERY_LABELS, ROLE_LABELS } from '../../lib/labels';

const R = 26;
const CIRC = 2 * Math.PI * R;

interface Props {
  concept: Concept;
  mastery: MasteryLevel;
  /** Fraction of core levels finished, 0–1. */
  progress: number;
  selected: boolean;
  /** Due for a warm-up review. */
  due?: boolean;
  levels?: Level[];
  completed?: Record<string, { stars?: number } | undefined>;
  onSelect: () => void;
}

/** An arcade station card on the world map with direct level launch. */
export function ConceptNode({
  concept,
  mastery,
  progress,
  selected,
  due = false,
  levels = [],
  completed = {},
  onSelect,
}: Props) {
  const locked = mastery === 'locked';

  return (
    <div
      className={`station-card station-card-${mastery}${concept.boss ? ' station-card-boss' : ''}${selected ? ' is-selected' : ''}`}
      role="listitem"
    >
      <div className="station-card-top">
        <button
          className={`station station-${mastery}${concept.boss ? ' station-boss' : ''}`}
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${concept.title}: ${MASTERY_LABELS[mastery]}${due ? ', due for review' : ''}`}
          title={`${MASTERY_LABELS[mastery]}: ${MASTERY_HELP[mastery]}`}
        >
          <svg viewBox="0 0 64 64" className="station-ring" aria-hidden="true">
            <circle cx="32" cy="32" r={R} className="station-ring-track" />
            <circle
              cx="32"
              cy="32"
              r={R}
              className="station-ring-fill"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
            />
          </svg>
          <span className="station-core" aria-hidden="true">
            {locked ? '🔒' : concept.boss ? '★' : mastery === 'proficient' ? '◆' : progress === 1 ? '✓' : ''}
          </span>
        </button>

        <div className="station-card-meta">
          <div className="station-card-title-row">
            <h3 className="station-title" onClick={onSelect} title="Click for concept details">
              {concept.title}
            </h3>
            {due && (
              <span className="chip chip-amber" title="Due for warm-up review">
                ↻ Due
              </span>
            )}
            <span className={`chip ${concept.boss ? 'chip-amber' : mastery === 'proficient' ? 'chip-signal' : ''}`}>
              {concept.boss ? 'Boss' : MASTERY_LABELS[mastery]}
            </span>
          </div>
          {concept.summary && <p className="station-summary">{concept.summary}</p>}
        </div>
      </div>

      {!locked && levels.length > 0 && (
        <div className="station-levels" aria-label={`${concept.title} levels`}>
          {levels.map((level, i) => {
            const done = !!completed[level.id];
            const stars = completed[level.id]?.stars ?? 1;
            return (
              <Link
                key={level.id}
                to={`/play/${level.id}`}
                className={`station-level-btn${done ? ' is-done' : ''}`}
                title={`Play ${level.title} (${ROLE_LABELS[level.role]})`}
              >
                <span className="station-level-num" aria-hidden="true">
                  {done ? '✓' : level.role === 'boss' ? '★' : i + 1}
                </span>
                <span className="station-level-name">{level.title}</span>
                {done && (
                  <span className="station-level-stars" aria-label={`${stars} stars`}>
                    {'★'.repeat(stars)}
                  </span>
                )}
                <span className="station-level-go" aria-hidden="true">
                  ▶
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {locked && (
        <div className="station-locked-hint">
          <span>🔒 Prerequisite required</span>
          <button className="btn btn-ghost btn-sm" onClick={onSelect} style={{ fontSize: '12px', padding: '2px 8px' }}>
            View details
          </button>
        </div>
      )}
    </div>
  );
}


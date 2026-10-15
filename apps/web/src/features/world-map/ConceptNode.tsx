import type { Concept } from '@codegames/shared';
import type { MasteryLevel } from '@codegames/curriculum';
import { MASTERY_HELP, MASTERY_LABELS } from '../../lib/labels';

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
  onSelect: () => void;
}

/** A station on the world map. The ring fills as core levels are completed. */
export function ConceptNode({ concept, mastery, progress, selected, due = false, onSelect }: Props) {
  const locked = mastery === 'locked';
  return (
    <div className="map-station" role="listitem">
      <button
        className={`station station-${mastery}${concept.boss ? ' station-boss' : ''}${selected ? ' is-selected' : ''}`}
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
      {due && (
        <span className="station-due" title="Due for review: play a warm-up to keep it fresh">
          ↻
        </span>
      )}
      <span className="station-label">{concept.title}</span>
      <span className="station-state">{MASTERY_LABELS[mastery]}</span>
    </div>
  );
}

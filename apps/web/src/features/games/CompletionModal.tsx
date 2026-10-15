import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useModalFocus } from '../../components/useModalFocus';
import { Link } from 'react-router-dom';
import { beltProgress, BELTS, concepts as allConcepts, REGION_STORY, SECURITY_PATCH, type MasteryLevel } from '@codegames/curriculum';
import { useProgress } from '../progress/store';
import type { Concept, Level, PlayableLanguage } from '@codegames/shared';
import { Markdown } from '../../lib/markdown';
import { MASTERY_LABELS } from '../../lib/labels';
import type { ParResult } from './types';
import { workshopForBoss } from './creatorWorkshops';

export interface CompletionInfo {
  level: Level;
  xp: number;
  stars: number;
  /** A replay beat the previous best stars. */
  improved: boolean;
  hintsUsed: number;
  /** The last hint (the answer) was opened. */
  usedAnswerHint: boolean;
  /** Best stars ever for this level (after this run). */
  best: number;
  par?: ParResult;
  changes: { concept: Concept; from: MasteryLevel; to: MasteryLevel }[];
  next?: Level;
}

interface Props {
  info: CompletionInfo;
  language: PlayableLanguage;
  takeaway?: string;
  onClose: () => void;
  /** Replay this level with hints, reveal and draft cleared, to earn it unassisted. */
  onRetry?: () => void;
}

const SPARKS = Array.from({ length: 14 }, (_, i) => i);

function starNote(stars: number, usedAnswerHint: boolean): string {
  if (stars === 3) return 'Solved on your own. Brilliant!';
  if (stars === 2) return usedAnswerHint ? 'Solved with the answer hint. Try it on your own later for 3 stars.' : 'Solved after a few tries. Try again later for 3 stars.';
  return 'You got there! Come back to this one later to lock it in.';
}

export function CompletionModal({ info, language, takeaway, onClose, onRetry }: Props) {
  const primary = useRef<HTMLAnchorElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useModalFocus(dialog, onClose, primary);

  const boss = info.level.role === 'boss';
  const unlocked = info.changes.filter((c) => c.from === 'locked');
  const grown = info.changes.filter((c) => c.from !== 'locked');
  const conceptId = info.level.conceptId;
  const workshop = workshopForBoss(info.level.id);

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal panel" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="complete-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sparks" aria-hidden="true">
          {SPARKS.map((i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
        <p className="eyebrow">{boss ? 'Region cleared' : 'Level complete'}</p>
        <h2 id="complete-title">{boss ? `You beat ${info.level.title}!` : 'Nice work!'}</h2>
        <p className="modal-stars" aria-label={`${info.stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= info.stars ? 'is-on' : ''} style={{ animationDelay: `${200 + n * 140}ms` }}>
              ★
            </span>
          ))}
        </p>
        {boss && <BossRewards levelId={info.level.id} language={language} />}
        <p className="modal-stars-note">
          {starNote(info.stars, info.usedAnswerHint)}
          {info.best > info.stars && ` (Your best is ${'★'.repeat(info.best)}.)`}
        </p>
        {info.par && (
          <p className={`modal-par${info.par.lines <= info.par.target ? ' is-under' : ''}`}>
            {info.par.lines <= info.par.target
              ? `⚡ ${info.par.lines < info.par.target ? 'Under par' : 'On par'}! ${info.par.lines} lines (par ${info.par.target}).`
              : `${info.par.lines} lines. Par is ${info.par.target}: can you make it shorter?`}
          </p>
        )}
        {info.xp > 0 ? (
          <p className="modal-xp">+{info.xp} XP</p>
        ) : (
          <p className="modal-replay">{info.improved ? 'New best! ' : ''}Replays don't award XP again, but can improve your stars.</p>
        )}

        {takeaway && (
          <div className="modal-takeaway">
            <span className="eyebrow">Remember</span>
            <Markdown text={takeaway} language={language} trusted />
          </div>
        )}

        {(grown.length > 0 || unlocked.length > 0) && (
          <ul className="modal-changes">
            {grown.map((c) => (
              <li key={c.concept.id}>
                <strong>{c.concept.title}</strong> is now <span className={`mastery-${c.to}`}>{MASTERY_LABELS[c.to]}</span>
              </li>
            ))}
            {unlocked.map((c) => (
              <li key={c.concept.id}>
                🔓 Unlocked <strong>{c.concept.title}</strong>
              </li>
            ))}
          </ul>
        )}

        {['build-it', 'bug-hunt', 'grid-quest'].includes(info.level.game) && <Reflection levelId={info.level.id} language={language} />}

        <div className="modal-actions">
          {workshop ? (
            <Link ref={primary} to={`/play/${info.level.id}?mode=${workshop.mode}`} className="btn btn-primary" onClick={onClose}>
              {workshop.title} →
            </Link>
          ) : info.next ? (
            <Link ref={primary} to={`/play/${info.next.id}`} className="btn btn-primary" onClick={onClose}>
              Next: {info.next.title} →
            </Link>
          ) : (
            <Link ref={primary} to={`/?concept=${unlocked[0]?.concept.id ?? conceptId}`} className="btn btn-primary">
              Back to the map →
            </Link>
          )}
          {workshop && (
            <Link to={`/?concept=${unlocked[0]?.concept.id ?? conceptId}`} className="btn btn-ghost">
              Back to the map →
            </Link>
          )}
          {onRetry && info.stars < 3 && info.level.game !== 'predict-output' && (
            <button className="btn btn-ghost" onClick={onRetry}>
              ↺ Try it again from scratch
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>
            Stay here
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Boss victories restore a ship system and earn a belt stripe (or a whole belt). */
function BossRewards({ levelId, language }: { levelId: string; language: PlayableLanguage }) {
  const completed = useProgress((s) => s.completed[language]);
  const region = allConcepts.find((c) => c.id === levelId)?.region;
  const story = region === undefined ? undefined : REGION_STORY[region];
  const belt = BELTS.find((b) => b.bosses.includes(levelId));
  const bestBelt = useProgress((s) => s.bestBelt[language]);
  const progress = beltProgress(new Set(Object.keys(completed)), bestBelt);
  const earnedNow = belt && progress.earned && BELTS.indexOf(progress.earned) >= BELTS.indexOf(belt);
  const stripes = belt ? belt.bosses.filter((b) => completed[b]).length : 0;
  return (
    <div className="modal-boss-rewards">
      {story && (
        <p>
          🚀 Ship system restored: <strong>{story.system}</strong>
        </p>
      )}
      {belt &&
        (earnedNow ? (
          <p className={`modal-belt belt-${belt.id}`}>
            <span className="modal-belt-swatch" aria-hidden="true" /> <strong>{belt.name} earned!</strong> {belt.canDo}
          </p>
        ) : (
          <p>
            Stripe {stripes} of {belt.bosses.length} on the way to your <strong>{belt.name}</strong>.
          </p>
        ))}
      {levelId === SECURITY_PATCH.boss && (
        <p>
          🛡 <strong>{SECURITY_PATCH.name} earned!</strong> {SECURITY_PATCH.canDo}
        </p>
      )}
    </div>
  );
}

/**
 * "Explain what you built in one sentence" (PRIMM reflect step, docs/PEDAGOGY_PLAN.md).
 * Optional; kept in the journal. Saved when the field loses focus or the dialog closes.
 */
function Reflection({ levelId, language }: { levelId: string; language: PlayableLanguage }) {
  const save = useProgress((s) => s.saveReflection);
  const existing = useProgress((s) => s.reflections[`${language}:${levelId}`]?.text ?? '');
  const [text, setText] = useState(existing);
  const latest = useRef(text);
  latest.current = text;
  useEffect(() => () => {
    if (latest.current !== existing) save(language, levelId, latest.current);
  }, [existing, language, levelId, save]);
  return (
    <label className="modal-reflect">
      <span>In one sentence, what does your program do? <em>(optional, saved to your journal)</em></span>
      <input value={text} onChange={(e) => setText(e.target.value)} onBlur={() => save(language, levelId, text)} maxLength={300} placeholder="It reads… and prints…" />
    </label>
  );
}

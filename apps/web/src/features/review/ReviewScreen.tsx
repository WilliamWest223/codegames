import { useCallback, useRef, useState } from 'react';
import { levels } from '@codegames/curriculum';
import { remixNumbers } from '@codegames/runtime';
import type { Level } from '@codegames/shared';
import { Link } from 'react-router-dom';
import { LANGUAGE_LABELS, type PlayableLanguage } from '@codegames/shared';
import { Markdown } from '../../lib/markdown';
import { GAME_LABELS } from '../../lib/labels';
import { gameFor } from '../games/registry';
import { useProgress } from '../progress/store';
import { useReviewPicks } from '../progress/useMastery';
import '../games/Level.css';
import './Review.css';

export const REVIEW_XP = 5;

/**
 * Warm-up: a few quick puzzles from the concepts touched least recently.
 * Retrieval practice keeps old skills fresh, and each review counts toward Proficient.
 */
export function ReviewScreen({ language }: { language: PlayableLanguage }) {
  const livePicks = useReviewPicks(language);
  // Freeze the set when the warm-up starts, so recording a review doesn't reshuffle it.
  // Remixable predict puzzles get fresh numbers, so a warm-up isn't a memory test.
  const [picks] = useState(() =>
    livePicks.map((p, i) => {
      // Warm-ups are free recall: no Investigate step, and no multiple choice (remixed numbers
      // would make the stored options wrong, and recall without options is the point).
      const level = p.level.game === 'predict-output' ? { ...p.level, investigate: undefined, choices: undefined } : p.level;
      if (level.game !== 'predict-output' || !level.remix) return { ...p, level, remixed: false };
      const seed = Date.now() + i;
      const remixed: Level = { ...level, modify: undefined, code: { ...level.code, [language]: remixNumbers(level.code[language] ?? '', seed, language) } };
      return { ...p, level: remixed, remixed: true };
    }),
  );
  const [step, setStep] = useState(0);
  const [passed, setPassed] = useState<boolean[]>([]);
  const [earned, setEarned] = useState<number[]>([]);
  const recordReview = useProgress((s) => s.recordReview);
  const completed = useProgress((s) => s.completed[language]);
  const reviews = useProgress((s) => s.reviews[language]);
  const revealed = useRef(false);
  const fails = useRef(0);
  const graduateLevel = useProgress((s) => s.graduateLevel);
  const [runKey] = useState(() => `review-${Date.now()}:`);

  const current = picks[step];
  const onPass = useCallback(
    (options: { deferCelebration?: boolean } = {}) => {
      if (!current || passed[step]) return () => undefined;
      const id = current.concept.id;
      const lastTouched = Math.max(
        reviews[id]?.at ?? 0,
        ...levels.filter((l) => l.conceptId === id).map((l) => completed[l.id]?.at ?? 0),
      );
      // A puzzle solved after "Show me the answer" moves the schedule on but earns no credit.
      // A recall that needed retries is a lapse: it earns XP but no spacing credit toward
      // Proficient. A clean recall of a level finished with help graduates it from "weak".
      const xp = revealed.current ? 0 : REVIEW_XP;
      const clean = !revealed.current && fails.current === 0;
      recordReview(language, id, xp, clean ? lastTouched : Date.now());
      if (clean) graduateLevel(language, current.level.id);
      setEarned((e) => { const next = [...e]; next[step] = xp; return next; });
      revealed.current = false;
      fails.current = 0;
      const celebrate = () => setPassed((p) => { const next = [...p]; next[step] = true; return next; });
      if (!options.deferCelebration) celebrate();
      return celebrate;
    },
    [current, language, recordReview, graduateLevel, step, passed, reviews, completed],
  );
  const onFail = useCallback(() => {
    fails.current += 1;
  }, []);

  if (picks.length === 0) {
    return (
      <div className="level-missing">
        <h1>No warm-up yet</h1>
        <p>Warm-ups unlock once you've practiced a couple of concepts.</p>
        <Link to="/" className="btn">← Back to the map</Link>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="review-done">
        <p className="eyebrow">Warm-up complete</p>
        <h1>Brain warmed up! 🔥</h1>
        <p>
          You recalled {picks.map((p) => p.concept.title).join(', ')} in {LANGUAGE_LABELS[language]}. Recalling old skills is what makes them
          stick: spaced warm-ups like this one keep your skills sharp and count toward <strong>Proficient</strong>.
        </p>
        <Link to="/" className="btn btn-primary">Back to the map →</Link>
      </div>
    );
  }

  const Game = gameFor(current.level);
  const done = passed[step];
  return (
    <div className="level review">
      <header className="level-head">
        <nav className="level-crumbs" aria-label="Breadcrumb">
          <Link to="/">← World map</Link>
          <span aria-hidden="true">/</span>
          <span>Warm-up</span>
        </nav>
        <div className="review-progress" aria-label={`Puzzle ${step + 1} of ${picks.length}`}>
          {picks.map((p, i) => (
            <span key={p.level.id} className={i < step || passed[i] ? 'is-done' : i === step ? 'is-current' : ''} />
          ))}
        </div>
        <div className="level-title-row">
          <h1>{current.concept.title}</h1>
          <span className="chip chip-amber">Review · +{REVIEW_XP} XP</span>
          <span className="chip">{GAME_LABELS[current.level.game]}</span>
          {current.remixed && <span className="chip chip-info" title="Same puzzle, new numbers">🔀 Remixed</span>}
        </div>
      </header>
      <div className="level-body">
        <aside className="level-brief panel">
          <p className="review-why">
            From your earlier level <strong>{current.level.title}</strong>.{' '}
            {current.remixed ? 'Same idea, new numbers. Can you still work it out?' : 'Can you still do it?'}
          </p>
          <Markdown text={current.level.prompt} language={language} trusted />
        </aside>
        <section className="level-work" aria-label="Workspace">
          {Game && (
            <Game
              key={`${runKey}${current.level.id}`}
              level={current.level}
              language={language}
              onPass={onPass}
              onFail={onFail}
              onReveal={() => (revealed.current = true)}
              draftScope={runKey}
            />
          )}
          {done && (
            <div className="review-next" role="status">
              <span>{earned[step] ? `✓ Recalled! +${earned[step]} XP` : '✓ Done. No XP after "Show me", but it still counts as practice.'}</span>
              <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)} autoFocus>
                {step + 1 < picks.length ? 'Next puzzle →' : 'Finish warm-up →'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { computeMastery, concepts, levels, localize, type MasteryLevel } from '@codegames/curriculum';
import { LANGUAGE_LABELS, PLAYABLE_LANGUAGES, ROLE_XP, levelLanguages, type PlayableLanguage } from '@codegames/shared';
import { useEngineStatus } from '../../engine/useEngineStatus';
import { Markdown } from '../../lib/markdown';
import { GAME_ICONS, GAME_LABELS, MODE_HELP, MODE_LABELS, ROLE_HELP, ROLE_LABELS } from '../../lib/labels';
import { draftKey, useProgress } from '../progress/store';
import { reviewCounts, useMastery, useTransfer, weakLevels } from '../progress/useMastery';
import { CompletionModal, type CompletionInfo } from './CompletionModal';
import { HintBox } from './HintBox';
import { workshopForRoute } from './creatorWorkshops';
import type { ParResult } from './types';
import { gameFor } from './registry';
import './Level.css';

const NUDGE_AFTER = 2;
/** Boss hints open only after this many failed checks: a belt should mean "did it yourself". */
const BOSS_HINTS_AFTER = 2;

export function LevelScreen({ language }: { language: PlayableLanguage }) {
  const execLang: 'python' | 'javascript' = language === 'cybersecurity' ? 'python' : language;
  const { levelId } = useParams();
  const [searchParams] = useSearchParams();
  const level = levels.find((l) => l.id === levelId);
  const mastery = useMastery(language);
  const completedMap = useProgress((s) => s.completed[language]);
  const reviews = useProgress((s) => s.reviews[language]);
  const transfer = useTransfer(language);
  const attempts = useProgress((s) => (level ? (s.attempts[draftKey(language, level.id)] ?? 0) : 0));
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const completeLevel = useProgress((s) => s.completeLevel);
  const recordHints = useProgress((s) => s.recordHints);
  const recordReveal = useProgress((s) => s.recordReveal);
  const resetLevelHelp = useProgress((s) => s.resetLevelHelp);
  // Hints opened before a reload stay open (and still count against stars).
  const savedHints = useProgress((s) => (level ? (s.hints[draftKey(language, level.id)] ?? 0) : 0));
  const { status: engine, retry: retryEngine } = useEngineStatus(execLang);
  const [completion, setCompletion] = useState<CompletionInfo | null>(null);
  // Bumped by "Try it again from scratch" to remount the game and hints fresh.
  const [retry, setRetry] = useState(0);
  const hintsUsed = useRef(0);
  const revealed = useRef(false);
  const active = useRef(0);

  useEffect(() => {
    setCompletion(null);
    hintsUsed.current = 0;
    revealed.current = false;
    window.scrollTo(0, 0);
    // A celebration deferred on the previous level must never show on this one.
    active.current += 1;
  }, [levelId, language]);

  const concept = level && concepts.find((c) => c.id === level.conceptId);
  const conceptLevels = useMemo(() => (level ? levels.filter((l) => l.conceptId === level.conceptId) : []), [level]);
  const index = level ? conceptLevels.indexOf(level) : -1;

  const onPass = useCallback(
    (options: { deferCelebration?: boolean; par?: ParResult } = {}) => {
      if (!level || !concept) return () => undefined;
      const before = computeMastery(concepts, levels, new Set(Object.keys(completedMap)), reviewCounts(reviews), transfer, weakLevels(completedMap));
      // Save right away, so closing the tab mid-animation never loses a completion.
      const result = completeLevel(language, level.id, ROLE_XP[level.role], {
        used: hintsUsed.current,
        total: level.hints.length,
        revealed: revealed.current,
        // Robot levels invite experimenting: the first few runs are free.
        freeAttempts: level.game === 'grid-quest' || (level.game === 'parsons' && !!level.grid) ? 3 : 0,
      }, options.par ? options.par.lines <= options.par.target : undefined);
      const best = Math.max(result.stars, completedMap[level.id]?.stars ?? 0);
      const assistedAfter = weakLevels({ ...completedMap, [level.id]: { stars: best } });
      const after = computeMastery(concepts, levels, new Set([...Object.keys(completedMap), level.id]), reviewCounts(reviews), transfer, assistedAfter);
      const changes = concepts
        .filter((c) => before[c.id] !== after[c.id])
        .map((c) => ({ concept: c, from: before[c.id]!, to: after[c.id]! }));
      const nextInConcept = conceptLevels.slice(index + 1).find((l) => !completedMap[l.id]) ?? conceptLevels[index + 1];
      const info: CompletionInfo = {
        level,
        xp: result.firstTime ? ROLE_XP[level.role] : 0,
        stars: result.stars,
        improved: result.improved,
        hintsUsed: hintsUsed.current,
        usedAnswerHint: level.hints.length > 0 && hintsUsed.current >= level.hints.length,
        best,
        par: options.par,
        changes,
        next: nextInConcept,
      };
      const token = active.current;
      const celebrate = () => {
        if (active.current === token) setCompletion(info);
      };
      if (!options.deferCelebration) celebrate();
      return celebrate;
    },
    [level, concept, completedMap, reviews, transfer, completeLevel, language, conceptLevels, index],
  );

  const onFail = useCallback(() => {
    if (level) recordAttempt(language, level.id);
  }, [level, language, recordAttempt]);


  const onScaffold = useCallback(() => {
    if (!level) return;
    hintsUsed.current = Math.max(hintsUsed.current, level.hints.length);
    recordHints(language, level.id, level.hints.length);
  }, [level, language, recordHints]);

  const onReveal = useCallback(() => {
    revealed.current = true;
    if (level) recordReveal(language, level.id);
  }, [level, language, recordReveal]);

  const onRetry = useCallback(() => {
    if (!level) return;
    resetLevelHelp(language, level.id);
    hintsUsed.current = 0;
    revealed.current = false;
    active.current += 1;
    setCompletion(null);
    setRetry((n) => n + 1);
  }, [level, language, resetLevelHelp]);

  if (!level || !concept) {
    return (
      <div className="level-missing">
        <h1>Level not found</h1>
        <Link to="/" className="btn">← Back to the map</Link>
      </div>
    );
  }

  if (!levelLanguages(level).includes(execLang)) {
    return (
      <div className="level-missing">
        <h1>Not available in {LANGUAGE_LABELS[language]} yet</h1>
        <Link to="/" className="btn">← Back to the map</Link>
      </div>
    );
  }
  const state: MasteryLevel = mastery[concept.id] ?? 'locked';
  if (state === 'locked') {
    return (
      <div className="level-missing">
        <h1>🔒 {level.title} is locked</h1>
        <p>Practice the earlier concepts on the map first.</p>
        <Link to={`/?concept=${concept.id}`} className="btn">← See what's needed</Link>
      </div>
    );
  }

  const workshop = workshopForRoute(level.id, searchParams.get('mode'));
  if (workshop) {
    if (!completedMap[workshop.boss]) {
      return (
        <div className="level-missing">
          <h1>🔒 {workshop.title} is locked</h1>
          <p>Complete the {workshop.bossTitle} boss first, then return here to {workshop.goal}.</p>
          <Link to={`/play/${workshop.boss}`} className="btn">← Back to {workshop.bossTitle}</Link>
        </div>
      );
    }
    const Screen = workshop.Screen;
    return <Screen key={language} language={language} />;
  }

  const Game = gameFor(level);
  const requirements = 'requirements' in level ? (level.requirements?.[execLang] ?? []).filter((r) => !r.forbid) : [];
  const done = !!completedMap[level.id];
  const allCompleted = useProgress.getState().completed;
  const drafts = useProgress.getState().drafts;
  // Translation help: your own solution from another language, if you solved it there.
  const otherSolution = PLAYABLE_LANGUAGES.filter((l) => l !== language)
    .map((l) => ({ language: l, code: allCompleted[l][level.id] ? drafts[draftKey(l, level.id)] : undefined }))
    .find((s) => s.code?.trim());

  return (
    <div className="level" key={`${level.id}-${language}`}>
      <header className="level-head">
        <nav className="level-crumbs" aria-label="Breadcrumb">
          <Link to={`/?concept=${concept.id}`}>← {concept.title}</Link>
          <span aria-hidden="true">/</span>
          <span>
            Level {index + 1} of {conceptLevels.length}
          </span>
        </nav>
        <div className="level-title-row">
          <h1>{level.title}</h1>
          {done && (
            <span className="chip chip-signal">
              ✓ Completed {'★'.repeat(completedMap[level.id]?.stars ?? 0)}
              {completedMap[level.id]?.par ? ' ⚡' : ''}
            </span>
          )}
        </div>
        <div className="level-chips">
          <span className={`chip ${level.role === 'boss' ? 'chip-amber' : 'chip-info'}`} title={ROLE_HELP[level.role]}>
            {ROLE_LABELS[level.role]}
          </span>
          <span className="chip">
            {GAME_ICONS[level.game]} {GAME_LABELS[level.game]}
          </span>
          <span className="chip" title={MODE_HELP[level.mode]}>
            {MODE_LABELS[level.mode]}
          </span>
          <span className="chip chip-amber">+{ROLE_XP[level.role]} XP</span>
          {engine === 'loading' && (
            <span className="chip level-engine" role="status">
              ⏳ Loading {LANGUAGE_LABELS[language]}…
            </span>
          )}
          {engine === 'error' && (
            <span className="chip level-engine-error" role="alert">
              ⚠ {LANGUAGE_LABELS[language]} failed to load
              <button className="btn btn-sm" onClick={retryEngine}>
                Retry
              </button>
            </span>
          )}
        </div>
      </header>

      <div className="level-body">
        <aside className="level-brief panel">
          <Markdown text={level.prompt} language={execLang} trusted />
          {requirements.length > 0 && (
            <div className="level-reqs">
              <span className="eyebrow">Must</span>
              <ul>
                {requirements.map((r) => (
                  <li key={r.message}>{r.message}</li>
                ))}
              </ul>
            </div>
          )}
          {level.reinforces.length > 0 && (
            <div className="level-uses">
              <span className="eyebrow">Practices</span>
              <div>
                {level.reinforces.map((id) => (
                  <span key={id} className="chip">
                    {concepts.find((c) => c.id === id)?.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {otherSolution && !done && (
            <details className="level-translate">
              <summary>
                🔁 Your {LANGUAGE_LABELS[otherSolution.language]} solution
              </summary>
              <p>You solved this in {LANGUAGE_LABELS[otherSolution.language]}. Same idea, new syntax:</p>
              <pre>{otherSolution.code}</pre>
            </details>
          )}
          <HintBox
            key={`${level.id}-${language}-${retry}`}
            hints={level.hints}
            language={execLang}
            nudge={attempts >= NUDGE_AFTER}
            initialShown={savedHints}
            lockedFor={level.role === 'boss' ? Math.max(0, BOSS_HINTS_AFTER - attempts) : 0}
            onReveal={(n) => {
              hintsUsed.current = Math.max(hintsUsed.current, n);
              recordHints(language, level.id, n);
            }}
          />
        </aside>
        <section className="level-work" aria-label="Workspace">
          {Game ? (
            <Game key={`${level.id}-${language}-${retry}`} level={level} language={execLang} onPass={onPass} onFail={onFail} onReveal={onReveal} onScaffold={onScaffold} />
          ) : (
            <p>This game type isn't built yet.</p>
          )}
        </section>
      </div>

      {completion && (
        <CompletionModal
          info={completion}
          language={language}
          takeaway={level.takeaway ? localize(level.takeaway, execLang) : undefined}
          onClose={() => setCompletion(null)}
          onRetry={onRetry}
        />
      )}
    </div>
  );
}

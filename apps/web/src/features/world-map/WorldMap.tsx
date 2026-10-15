import { Fragment, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { engines } from '../../engine';
import { concepts, conceptsFor, levelsFor, REGION_NAMES, REGION_STORY, coreLevels, atLeast } from '@codegames/curriculum';
import { LANGUAGE_LABELS, type PlayableLanguage } from '@codegames/shared';
import { useProgress } from '../progress/store';
import { useDueConcepts, useMastery, useNextLevel, useReviewPicks } from '../progress/useMastery';
import { GAME_LABELS, MASTERY_HELP, MASTERY_LABELS, ROLE_LABELS } from '../../lib/labels';
import { ConceptNode } from './ConceptNode';
import { ConceptPanel } from './ConceptPanel';
import { CircuitBusCanvas } from './CircuitBusCanvas';
import { playSwitch } from '../../lib/soundFx';
import './WorldMap.css';

export function WorldMap({ language }: { language: PlayableLanguage }) {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('concept');
  const selected = concepts.find((c) => c.id === selectedId);
  const mastery = useMastery(language);
  const completed = useProgress((s) => s.completed[language]);
  const next = useNextLevel(language);
  const reviewPicks = useReviewPicks(language);
  const due = useDueConcepts(language);

  const playable = conceptsFor(language).filter((c) => !c.comingSoon);
  const levels = levelsFor(language);
  const practicedCount = playable.filter((c) => atLeast(mastery[c.id]!, 'practiced')).length;
  const levelsDone = levels.filter((l) => completed[l.id]).length;
  const starsEarned = levels.reduce((sum, l) => sum + (completed[l.id] ? (completed[l.id]!.stars ?? 1) : 0), 0);
  const isSec = language === 'cybersecurity';
  const regions = [...new Set(playable.filter((c) => isSec ? c.region === 10 : !c.sideQuest).map((c) => c.region))].sort((a, b) => a - b);
  // A side quest appears once any of its concepts opens, right after the region that gates it.
  const sideQuests = isSec ? [] : [...new Set(playable.filter((c) => c.sideQuest).map((c) => c.region))]
    .filter((region) => playable.some((c) => c.region === region && mastery[c.id] !== 'locked'))
    .map((region) => ({ region, after: sideQuestGate(region) }));

  const select = (id: string | null) => {
    if (id) playSwitch();
    setParams(id ? { concept: id } : {}, { replace: true });
  };

  // Python takes seconds to start: begin loading it once the map has settled, so the
  // first level doesn't wait (round-5 developer audit).
  useEffect(() => {
    if (language !== 'python') return;
    const timer = setTimeout(() => void engines.python.warmUp().catch(() => undefined), 1500);
    return () => clearTimeout(timer);
  }, [language]);

  return (
    <div className="map">
      <CircuitBusCanvas language={language} />
      <section className="map-hero">
        <div>
          <p className="eyebrow">Your journey in {LANGUAGE_LABELS[language]}</p>
          <h1>World Map</h1>
          <div className="map-stats">
            <span>
              <strong>{practicedCount}</strong> / {playable.length} concepts practiced
            </span>
            <span>
              <strong>{levelsDone}</strong> / {levels.length} levels
            </span>
            <span className="map-stars" title="Stars: 3 for solving on your own. Replay levels to improve them.">
              <strong>★ {starsEarned}</strong> / {levels.length * 3}
            </span>
          </div>
        </div>
        <div className="map-cards">
        {reviewPicks.length > 0 && (
          <Link to="/review" className="map-warmup">
            <span className="eyebrow">Warm-up · {reviewPicks.length} quick puzzles</span>
            <span className="map-continue-title">Keep skills fresh</span>
            <span className="map-continue-meta">{reviewPicks.map((p) => p.concept.title).join(' · ')}</span>
          </Link>
        )}
        {next ? (
          <Link to={`/play/${next.id}`} className="map-continue">
            <span className="eyebrow">{levelsDone === 0 ? 'Start here' : 'Continue'}</span>
            <span className="map-continue-title">{next.title}</span>
            <span className="map-continue-meta">
              {concepts.find((c) => c.id === next.conceptId)?.title} · {ROLE_LABELS[next.role]} · {GAME_LABELS[next.game]}
            </span>
            <span className="map-continue-go" aria-hidden="true">
              ▶
            </span>
          </Link>
        ) : (
          <div className="map-continue map-continue-done">
            <span className="eyebrow">All caught up</span>
            <span className="map-continue-title">Every level up to Region {regions.at(-1)} complete!</span>
            <span className="map-continue-meta">Replay levels for more stars, or try the other language.</span>
          </div>
        )}
        </div>
      </section>

      <details className="map-legend">
        <summary>How the map works</summary>
        <ul>
          {(['learned', 'practiced', 'proficient'] as const).map((m) => (
            <li key={m}>
              <span className={`map-legend-dot mastery-dot-${m}`} aria-hidden="true" />
              <strong>{MASTERY_LABELS[m]}:</strong> {MASTERY_HELP[m]}
            </li>
          ))}
          <li>
            <span className="map-legend-dot mastery-dot-boss" aria-hidden="true" />
            <strong>★ Boss:</strong> beat it to unlock the next region.
          </li>
          <li>
            <span className="map-legend-dot mastery-dot-warmup" aria-hidden="true" />
            <strong>Warm-ups</strong> bring back older concepts so you don't forget them.
          </li>
        </ul>
        <p>Each concept has a few levels: <strong>Intro</strong> (meet the idea), <strong>Combine</strong> (mix it with something you know), <strong>Integrate</strong> (use it with several earlier skills). The ring around a station fills as you finish them.</p>
      </details>

      {language === 'cybersecurity' && (
        <aside className="map-range-rules" aria-label="Rules of the range" style={{ margin: '-12px 0 24px' }}>
          <strong>Rules of the Cyber Range:</strong> Build secure code, test systems responsibly, and protect users. All challenges focus on hands-on defensive programming and applied cryptography.
        </aside>
      )}

      {regions.map((region, ri) => (
        <Fragment key={region}>
          {renderRegion(region, ri)}
          {sideQuests
            .filter((s) => s.after === region)
            .map((s) => (
              <div key={s.region} className="map-side-quest" role="group" aria-label="Side quests">
                <p className="eyebrow map-side-quest-label">Side quests · optional</p>
                {s.region === SECURITY_REGION && language !== 'cybersecurity' && (
                  <aside className="map-range-rules" aria-label="Rules of the range">
                    <strong>Rules of the range.</strong> Only test code and systems you own or have permission to test.
                    Everything here is a fictional ship, and the toy tools you build are never real security.
                  </aside>
                )}
                {renderRegion(s.region, ri, true)}
              </div>
            ))}
        </Fragment>
      ))}

      {selected && <ConceptPanel concept={selected} language={language} mastery={mastery} onClose={() => select(null)} />}
    </div>
  );

  function renderRegion(region: number, ri: number, sideQuest = false) {
    const regionConcepts = playable.filter((c) => c.region === region);
    const done = regionConcepts.filter((c) => atLeast(mastery[c.id]!, 'practiced')).length;
    return (
      <section className={`map-region${sideQuest ? ' is-side-quest' : ''}`} style={{ animationDelay: `${ri * 80}ms` }}>
        <header className="map-region-head">
          <span className="map-region-number">{sideQuest ? '◇' : String(region).padStart(2, '0')}</span>
          <h2>{REGION_NAMES[region]}</h2>
          <div className="map-region-progress" aria-label={`${done} of ${regionConcepts.length} concepts practiced`}>
            <div style={{ width: `${(done / regionConcepts.length) * 100}%` }} />
          </div>
          <span className="map-region-count">
            {done}/{regionConcepts.length}
          </span>
        </header>
        {REGION_STORY[region] && (
          <p className={`map-region-story${done === regionConcepts.length ? ' is-restored' : ''}`}>
            <span aria-hidden="true">{done === regionConcepts.length ? '✓' : '🛠'}</span>{' '}
            <strong>{REGION_STORY[region]!.system}</strong>
            {done === regionConcepts.length ? ' restored.' : `: ${REGION_STORY[region]!.beat}`}
          </p>
        )}
        <div className="map-grid" role="list">
          {regionConcepts.map((c) => {
            const core = coreLevels(c.id, levels);
            return (
              <ConceptNode
                key={c.id}
                concept={c}
                mastery={mastery[c.id]!}
                progress={core.length ? core.filter((l) => completed[l.id]).length / core.length : 0}
                selected={c.id === selectedId}
                due={due.has(c.id)}
                levels={levels.filter((l) => l.conceptId === c.id)}
                completed={completed}
                onSelect={() => select(c.id === selectedId ? null : c.id)}
              />
            );
          })}
        </div>
      </section>
    );
  }
}

/** The Security side quest: the only one that needs the "rules of the range" reminder. */
const SECURITY_REGION = 10;

/** The core region a side quest hangs after: the latest core region its concepts require. */
function sideQuestGate(region: number): number {
  if (region === SECURITY_REGION) return 3;
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const gates = concepts
    .filter((c) => c.region === region)
    .flatMap((c) => c.requires.map((id) => byId.get(id)))
    .filter((c) => c && !c.sideQuest)
    .map((c) => c!.region);
  return gates.length ? Math.max(...gates) : 3;
}

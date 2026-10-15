import { Link } from 'react-router-dom';
import { BELTS, beltProgress, conceptsFor, levelsFor, REFRESHERS, REGION_NAMES, SECURITY_PATCH, atLeast } from '@codegames/curriculum';
import { LANGUAGE_LABELS, type PlayableLanguage } from '@codegames/shared';
import { useActivity } from '../progress/activity';
import { useMastery } from '../progress/useMastery';
import { useProgress } from '../progress/store';
import { rankFor } from '../workshop/rewards';
import './Journal.css';

/**
 * The learner's journal (docs/PEDAGOGY_PLAN.md): competence made visible. Belts and what they
 * mean, what you can do now, your own words and your own boss programs, and honest stats.
 */
export function JournalScreen({ language }: { language: PlayableLanguage }) {
  const completed = useProgress((s) => s.completed[language]);
  const reflections = useProgress((s) => s.reflections);
  const drafts = useProgress((s) => s.drafts);
  const errorCounts = useProgress((s) => s.errorCounts);
  const xp = useProgress((s) => s.xp);
  const mastery = useMastery(language);
  const activity = useActivity();
  const bestBelt = useProgress((s) => s.bestBelt[language]);
  const belts = beltProgress(new Set(Object.keys(completed)), bestBelt);

  const concepts = conceptsFor(language);
  const levels = levelsFor(language);
  const done = Object.entries(completed).filter(([id]) => levels.some((l) => l.id === id));
  const onOwn = done.filter(([, c]) => (c.stars ?? 3) === 3).length;
  const byTime = [...done].sort((a, b) => a[1].at - b[1].at).map(([, c]) => c.stars ?? 3);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const recent = byTime.slice(-10);
  const before = byTime.slice(-20, -10);
  const trend = before.length >= 5 ? avg(recent) - avg(before) : 0;

  const practiced = concepts.filter((c) => !c.comingSoon && !c.boss && atLeast(mastery[c.id] ?? 'locked', 'practiced'));
  const regions = [...new Set(practiced.map((c) => c.region))].sort((a, b) => a - b);
  const notes = Object.entries(reflections)
    .filter(([key]) => key.startsWith(`${language}:`))
    .map(([key, r]) => ({ level: levels.find((l) => l.id === key.slice(language.length + 1)), ...r }))
    .filter((n) => n.level)
    .sort((a, b) => b.at - a.at);
  const bosses = concepts.filter((c) => c.boss && completed[c.id]);
  const errors = Object.entries(errorCounts)
    .filter(([key]) => key.startsWith(`${language}:`))
    .map(([key, n]) => ({ name: key.slice(language.length + 1), n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);

  return (
    <div className="journal">
      <header className="journal-head">
        <p className="eyebrow">Your journal · {LANGUAGE_LABELS[language]}</p>
        <h1>What you can do</h1>
      </header>

      <section className="journal-card journal-belts" aria-label="Belts">
        <h2>Belts</h2>
        <p className="journal-muted">Belts are earned only by beating bosses: programs you write on your own, start to finish.</p>
        <ol>
          {BELTS.map((belt) => {
            const earned = belts.earned && BELTS.indexOf(belts.earned) >= BELTS.indexOf(belt);
            const working = belts.working === belt;
            return (
              <li key={belt.id} className={`belt-${belt.id}${earned ? ' is-earned' : ''}${working ? ' is-working' : ''}`}>
                <span className="journal-belt-swatch" aria-hidden="true" />
                <div>
                  <strong>{belt.name}</strong>
                  {earned ? ' ✓' : working ? ` · ${belts.stripes} of ${belt.bosses.length} ${belt.bosses.length === 1 ? 'stripe' : 'stripes'}` : ''}
                  <p>{belt.canDo}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {completed[SECURITY_PATCH.boss] && (
          <p className="journal-patch">
            <strong>🛡 {SECURITY_PATCH.name} ✓</strong> {SECURITY_PATCH.canDo}
          </p>
        )}
      </section>

      <section className="journal-card journal-stats" aria-label="Your numbers">
        <h2>Your numbers</h2>
        <dl>
          <div>
            <dt>Levels finished</dt>
            <dd>
              {done.length} <span>/ {levels.length}</span>
            </dd>
          </div>
          <div>
            <dt>Solved on your own</dt>
            <dd>{done.length ? `${Math.round((onOwn / done.length) * 100)}%` : '–'}</dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>
              {activity.streak} <span>day{activity.streak === 1 ? '' : 's'} · ❄ {activity.freezes}</span>
            </dd>
          </div>
          <div>
            <dt>XP</dt>
            <dd>
              {xp} <span>{rankFor(xp).rank.title}</span>
            </dd>
          </div>
        </dl>
        {trend > 0.2 && <p className="journal-good">↑ You've needed less help in your last 10 levels than the 10 before. That's real progress.</p>}
        {trend < -0.4 && <p className="journal-muted">Recent levels took more help: that's normal when the material gets harder. Warm-ups will bring them back.</p>}
      </section>

      <section className="journal-card" aria-label="Concepts you have practiced">
        <h2>Skills you've practiced</h2>
        {regions.length ? (
          regions.map((r) => (
            <div key={r} className="journal-region">
              <h3>{REGION_NAMES[r]}</h3>
              <ul>
                {practiced
                  .filter((c) => c.region === r)
                  .map((c) => (
                    <li key={c.id}>
                      <strong>{c.title}</strong> <span>{c.canDo ?? c.summary}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="journal-muted">Finish a concept's core levels and it will show up here.</p>
        )}
      </section>

      {bosses.length > 0 && (
        <section className="journal-card" aria-label="Programs you built">
          <h2>Programs you built</h2>
          {bosses.map((b) => {
            const draft = drafts[`${language}:${b.id}`];
            return (
              <details key={b.id}>
                <summary>
                  {b.title.replace(/^Boss: /, '')} <Link to={`/play/${b.id}`}>open</Link>
                </summary>
                {draft ? <pre>{draft}</pre> : <p className="journal-muted">Your code isn't saved for this one.</p>}
              </details>
            );
          })}
        </section>
      )}

      <section className="journal-card" aria-label="Your reflections">
        <h2>In your own words</h2>
        {notes.length ? (
          <ul className="journal-notes">
            {notes.map((n) => (
              <li key={n.level!.id}>
                <Link to={`/play/${n.level!.id}`}>{n.level!.title}</Link>
                <q>{n.text}</q>
              </li>
            ))}
          </ul>
        ) : (
          <p className="journal-muted">After a level, write one sentence about what your program does. Explaining code is one of the best ways to learn it.</p>
        )}
      </section>

      {errors.length > 0 && (
        <section className="journal-card" aria-label="Errors you meet most">
          <h2>Errors you meet most</h2>
          <ul className="journal-errors">
            {errors.map((e) => (
              <li key={e.name}>
                <code>{e.name}</code> × {e.n}
                {REFRESHERS[e.name] && <span> · {REFRESHERS[e.name]!.title}</span>}
              </li>
            ))}
          </ul>
          <p className="journal-muted">Every programmer meets these. Noticing your usual ones is how you start fixing them faster.</p>
        </section>
      )}
    </div>
  );
}

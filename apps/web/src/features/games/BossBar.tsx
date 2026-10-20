import type { TestResult } from '@codegames/runtime';
import type { TestCase } from '@codegames/shared';

/**
 * Boss HP bar: each phase is a group of tests. Passing tests deals damage; the boss is
 * defeated when every phase is cleared. Purely presentational over the real test results.
 */
export function BossBar({ tests, results }: { tests: TestCase[]; results?: TestResult[] }) {
  const phases = [...new Set(tests.map((t) => t.phase ?? 'Fight'))];
  const passed = (name: string) => results?.find((r) => r.name === name)?.passed ?? false;
  const total = tests.length;
  const dealt = tests.filter((t) => passed(t.name)).length;
  const hp = Math.round(100 * (1 - dealt / total));
  const defeated = dealt === total;
  return (
    <div
      className={`boss-bar${defeated ? ' is-defeated' : ''}`}
      role="progressbar"
      aria-label="Boss health"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={hp}
      aria-valuetext={`${hp}%`}
    >
      <div className="boss-bar-head">
        <span className="eyebrow">{defeated ? 'Boss defeated!' : 'Boss health'}</span>
        <span className="boss-bar-hp">{hp}%</span>
      </div>
      <div className="boss-bar-track">
        <div className="boss-bar-fill" style={{ width: `${hp}%` }} />
      </div>
      <ol className="boss-phases">
        {phases.map((phase) => {
          const inPhase = tests.filter((t) => (t.phase ?? 'Fight') === phase);
          const cleared = inPhase.every((t) => passed(t.name));
          return (
            <li key={phase} className={cleared ? 'is-cleared' : ''}>
              <span aria-hidden="true">{cleared ? '✓' : '⚔'}</span> {phase}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

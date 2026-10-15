import { useEffect, useState } from 'react';
import type { ExecResult, TraceFrame } from '@codegames/runtime';
import { ErrorBox } from './Output';
import './StepThrough.css';

/** How a frame is named: `fact()`, `class Pet`, or the top level. */
function frameLabel(name: string): string {
  if (!name) return 'Top level';
  return name.startsWith('class ') ? name : `${name}()`;
}

function emptyMessage(result: ExecResult): string {
  if (result.error?.kind === 'syntax') return 'Nothing to step through: the code has a syntax error, so no line ran. Fix it and try again.';
  if (result.error?.kind === 'timeout') return 'Nothing to step through: the program ran too long to record any steps.';
  if (result.error) return 'Nothing to step through: the program stopped before its first line ran.';
  return 'Nothing to step through: no line of your program ran.';
}

function VarsTable({ caption, vars, before }: { caption: string; vars: TraceFrame['vars']; before?: Map<string, string> }) {
  return (
    <table className="steps-vars">
      <caption>{caption}</caption>
      <tbody>
        {vars.length ? (
          vars.map(([name, value]) => (
            <tr key={name} className={before && before.get(name) !== value ? 'is-changed' : ''}>
              <th scope="row">{name}</th>
              <td>{value}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2} className="steps-none">no variables yet</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/**
 * Step-through visualizer (docs/PEDAGOGY_PLAN.md): replay a traced run one line at a time
 * with the call stack at each step (one frame per active call, newest on top, each with its
 * own variables), so tracing (reading code) becomes visible. The parent highlights `onLine`.
 */
export function StepThrough({ result, onLine }: { result: ExecResult; onLine: (line: number | null) => void }) {
  const steps = result.trace ?? [];
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = steps.length - 1;

  useEffect(() => {
    onLine(step && step.line > 0 ? step.line : null);
  }, [step, onLine]);
  useEffect(() => () => onLine(null), [onLine]);

  if (!step) {
    return (
      <div className="steps">
        <p className="steps-empty">{emptyMessage(result)}</p>
        {result.error && <ErrorBox error={result.error} />}
      </div>
    );
  }

  // Compare with the last step in the same call (frame id), so returning from a call or
  // recursing into a new one doesn't mark everything as changed.
  const current = step.stack[0]!;
  const prior = steps.slice(0, index).reverse().find((s) => s.stack[0]?.id === current.id);
  const before = prior ? new Map(prior.stack[0]!.vars) : undefined;
  const callers = step.stack.slice(1);
  const hidden = step.depth - step.stack.length;
  const go = (i: number) => setIndex(Math.max(0, Math.min(last, i)));
  const done = step.line === -1;
  const where = current.name.startsWith('class ') ? ` · in ${current.name}` : current.name ? ` · inside ${current.name}()` : '';

  return (
    <div
      className="steps"
      tabIndex={0}
      aria-label="Step through your program. Use the left and right arrow keys."
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <div className="steps-head">
        <span className="eyebrow">👣 Step through</span>
        <span className="steps-where" aria-live="polite">
          Step {index + 1} of {steps.length}
          {done ? ' · finished' : ` · line ${step.line} runs next`}
          {where}
        </span>
      </div>
      <div className="steps-controls">
        <button className="btn btn-ghost btn-sm" onClick={() => go(0)} disabled={index === 0} aria-label="First step">⏮</button>
        <button className="btn btn-sm" onClick={() => go(index - 1)} disabled={index === 0}>◀ Back</button>
        <input type="range" min={0} max={last} value={index} onChange={(e) => go(Number(e.target.value))} aria-label="Step" />
        <button className="btn btn-primary btn-sm" onClick={() => go(index + 1)} disabled={index === last}>Next ▶</button>
        <button className="btn btn-ghost btn-sm" onClick={() => go(last)} disabled={index === last} aria-label="Last step">⏭</button>
      </div>
      <div className="steps-body">
        {callers.length ? (
          <div className="steps-stack" aria-label={`Call stack: ${step.depth} active calls, newest first`}>
            <span className="eyebrow">Call stack · newest on top</span>
            <ol className="steps-frames">
              <li className="steps-frame is-current">
                <VarsTable caption={`${frameLabel(current.name)} · running`} vars={current.vars} before={before} />
              </li>
              {callers.map((frame, i) => (
                <li key={`${frame.id}-${i}`} className="steps-frame">
                  <VarsTable caption={`${frameLabel(frame.name)} · waiting`} vars={frame.vars} />
                </li>
              ))}
            </ol>
            {hidden > 0 && <p className="steps-more">+{hidden} more call{hidden === 1 ? '' : 's'} below</p>}
          </div>
        ) : (
          <VarsTable caption={`Variables${current.name ? ` in ${frameLabel(current.name)}` : ''}`} vars={current.vars} before={before} />
        )}
        <div className="steps-out">
          <span className="eyebrow">Output so far</span>
          <pre>{result.stdout.slice(0, step.out) || ' '}</pre>
        </div>
      </div>
      {result.traceTruncated && index === last && (
        <p className="steps-note">Stopped after {steps.length} steps. A loop that never ends looks like this: watch which variable is not changing.</p>
      )}
      {index === last && result.error && <ErrorBox error={result.error} />}
    </div>
  );
}

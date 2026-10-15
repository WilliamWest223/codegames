import { useCallback, useMemo, useRef, useState } from 'react';
import { assembleParsons, gradeSubmission, parsonsLines, type GradeResult } from '@codegames/runtime';
import type { ParsonsLevel } from '@codegames/shared';
import { executorFor } from '../../engine';
import { GridBoard } from './GridBoard';
import { Blocked, Warnings, ErrorBox, TestResults } from './Output';
import type { GameProps } from './types';

interface Piece {
  id: number;
  text: string;
}

/** Deterministic shuffle so a level always presents the same puzzle. */
function shuffle<T>(items: T[], seed: string): T[] {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  // Never present the puzzle already solved.
  return out.every((v, i) => v === items[i]) && out.length > 1 ? [...out.slice(1), out[0]!] : out;
}

/** Code Puzzle: put scrambled lines into a working order. Any order that works is accepted. */
export function ParsonsGame({ level, language, onPass, onFail }: GameProps<ParsonsLevel>) {
  const pieces = useMemo<Piece[]>(() => {
    const lines = parsonsLines(level.solution[language] ?? '', level.distractors?.[language]);
    return shuffle(lines.map((text, id) => ({ id, text })), level.id + language);
  }, [level, language]);
  const [program, setProgram] = useState<Piece[]>([]);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [runId, setRunId] = useState(0);
  const pool = pieces.filter((p) => !program.includes(p));

  const add = (p: Piece) => setProgram((prog) => [...prog, p]);
  const remove = (p: Piece) => setProgram((prog) => prog.filter((x) => x !== p));
  const move = (index: number, delta: number) =>
    setProgram((prog) => {
      const next = [...prog];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prog;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const busyRef = useRef(false);
  const pendingCelebration = useRef<(() => void) | null>(null);
  const onFinished = useCallback(() => {
    const celebrate = pendingCelebration.current;
    pendingCelebration.current = null;
    if (celebrate) setTimeout(celebrate, 350);
  }, []);

  const check = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await gradeSubmission(level, language, assembleParsons(program.map((p) => p.text)), executorFor(language));
      setGrade(result);
      setRunId((n) => n + 1);
      if (result.passed) {
        const animated = !!level.grid && (result.gridRun?.grid?.actions.length ?? 0) > 0;
        const celebrate = onPass({ deferCelebration: animated });
        if (animated) pendingCelebration.current = celebrate;
      } else onFail(level.grid ? 'run' : 'check');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const outcome = grade?.gridRun?.grid;
  return (
    <div className="game">
      {level.grid && (
        <GridBoard
          spec={level.grid}
          actions={outcome?.actions ?? []}
          runId={runId}
          status={outcome ? { success: outcome.success, message: outcome.success ? 'Level solved!' : (outcome.reason ?? '') } : undefined}
          onFinished={onFinished}
        />
      )}
      <div className="parsons">
        <div className="parsons-col">
          <h3 className="parsons-title">Lines <span>tap a line to add it</span></h3>
          <ul className="parsons-list">
            {pool.map((p) => (
              <li key={p.id}>
                <button className="parsons-line" onClick={() => add(p)}>
                  <code>{p.text}</code>
                </button>
              </li>
            ))}
            {pool.length === 0 && <li className="parsons-empty">All lines used</li>}
          </ul>
        </div>
        <div className="parsons-col parsons-program">
          <h3 className="parsons-title">Your program <span>{program.length} lines</span></h3>
          <ol className="parsons-list">
            {program.map((p, i) => (
              <li key={p.id} className="parsons-row">
                <span className="parsons-num">{i + 1}</span>
                <code className="parsons-code">{p.text}</code>
                <span className="parsons-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move line ${i + 1} up`}>↑</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === program.length - 1} aria-label={`Move line ${i + 1} down`}>↓</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(p)} aria-label={`Remove line ${i + 1}`}>✕</button>
                </span>
              </li>
            ))}
            {program.length === 0 && <li className="parsons-empty">Tap lines to build the program here</li>}
          </ol>
        </div>
      </div>
      <div className="game-toolbar">
        <button className="btn btn-primary" onClick={check} disabled={busy || program.length === 0}>
          {busy ? 'Running…' : level.grid ? '▶ Run robot' : '✓ Check'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setProgram([]); setGrade(null); }}>↺ Start over</button>
      </div>
      <div className="game-output" aria-live="polite">
        {grade?.blocked && <Blocked messages={grade.blocked} />}
        <Warnings messages={grade?.warnings} />
        {grade?.gridRun?.error && <ErrorBox error={grade.gridRun.error} language={language} />}
        {grade && grade.tests.length > 0 && <TestResults tests={grade.tests} language={language} />}
      </div>
    </div>
  );
}

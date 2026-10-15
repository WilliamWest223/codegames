import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gradeSubmission, type ExecResult, type GradeResult } from '@codegames/runtime';
import type { CodeLevel, ParsonsLevel } from '@codegames/shared';
import { executorFor } from '../../engine';
import { Markdown } from '../../lib/markdown';
import { CodeEditor, type CodeEditorHandle } from '../editor/CodeEditor';
import { SymbolBar } from '../editor/SymbolBar';
import { Blocked, Warnings, Console, ErrorBox, TestResults } from './Output';
import { BossBar } from './BossBar';
import { ParsonsGame } from './ParsonsGame';
import { PlayConsole } from './PlayConsole';
import { INPUT_LIMITS, clampInputText } from './inputLimits';
import { PagePreview } from './play/PagePreview';
import { StepThrough } from './StepThrough';
import { useDraft } from './useDraft';
import type { GameProps } from './types';

/** Build It and Bug Hunt: write or fix code until the tests pass. */
/** Untouched starter for this long counts as stuck, like two failed checks. */
const STALL_MS = 3 * 60_000;

export function BuildItGame({ level, language, onPass, onFail, onScaffold, draftScope = '' }: GameProps<CodeLevel>) {
  const { code, setCode, reset } = useDraft(draftScope + level.id, language, level.starterCode[language] ?? '');
  const [busy, setBusy] = useState<'run' | 'check' | 'step' | null>(null);
  const [stepped, setStepped] = useState<ExecResult | null>(null);
  // "I'm stuck" ladder (docs/PEDAGOGY_PLAN.md): after two failed checks on a write-code level,
  // offer the same problem as a Parsons puzzle. Bosses stay unscaffolded checkpoints.
  const [fails, setFails] = useState(0);
  const [puzzle, setPuzzle] = useState(false);
  // Last rung: a worked example of a similar problem once the puzzle has failed twice too.
  const [puzzleFails, setPuzzleFails] = useState(0);
  const canPuzzle = level.game === 'build-it' && level.role !== 'boss' && !!level.solution[language];
  // A learner who stalls without ever pressing Check also gets the offer: the starter still
  // untouched after STALL_MS (round-7 teacher P2-5).
  const [stalled, setStalled] = useState(false);
  const untouched = code === (level.starterCode[language] ?? '');
  useEffect(() => {
    if (!canPuzzle || !untouched) return;
    const timer = window.setTimeout(() => setStalled(true), STALL_MS);
    return () => window.clearTimeout(timer);
  }, [canPuzzle, untouched]);
  const [stepLine, setStepLine] = useState<number | null>(null);
  const [run, setRun] = useState<ExecResult | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  // The boss bar keeps the last Check's damage while the learner runs or plays the game.
  const [bossResults, setBossResults] = useState<GradeResult['tests']>();
  const execute = executorFor(language);
  const usesInput = level.tests.some((t) => t.input !== undefined);
  // Web Pages levels run against their starting page, so `document` exists on Run and Step too.
  const pageOption = level.page !== undefined ? { page: level.page } : {};
  // Programs that read input, and Web Pages programs that react to clicks, can be played for real.
  const canPlay = usesInput || (level.play?.renderer === 'page' && level.page !== undefined);
  const [runInput, setRunInput] = useState(level.tests.find((t) => !t.hidden)?.input ?? '');
  const [inputClamped, setInputClamped] = useState(false);

  const busyRef = useRef(false);
  const [runCount, setRunCount] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const editor = useRef<CodeEditorHandle>(null);
  const output = useRef<HTMLDivElement>(null);

  // Bring results into view after a run or check (they're often below the fold on phones).
  useLayoutEffect(() => {
    if (run || grade) output.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [run, grade]);

  const doStep = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy('step');
    setGrade(null);
    setRun(null);
    try {
      setStepped(await execute(code, { stdin: usesInput ? runInput : undefined, trace: true, ...pageOption }));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const doRun = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setRunCount((n) => n + 1);
    setBusy('run');
    setGrade(null);
    setStepped(null);
    try {
      setRun(await execute(code, { stdin: usesInput ? runInput : undefined, ...pageOption }));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const doCheck = useCallback(async () => {
    // Ctrl+Enter bypasses the disabled button, so guard against double submits here.
    if (busyRef.current) return;
    busyRef.current = true;
    setRunCount((n) => n + 1);
    setBusy('check');
    setRun(null);
    setStepped(null);
    try {
      const result = await gradeSubmission(level, language, code, execute);
      setGrade(result);
      setBossResults(result.tests);
      if (result.passed) onPass();
      else {
        setFails((n) => n + 1);
        onFail();
      }
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }, [level, language, code, execute, onPass, onFail]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void doCheck();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doCheck]);

  if (puzzle) {
    const parallel = level.parallelExample?.code[language] ? level.parallelExample : undefined;
    const asPuzzle: ParsonsLevel = {
      id: `${level.id}-puzzle`,
      conceptId: level.conceptId,
      title: level.title,
      role: level.role,
      mode: 'parsons',
      prompt: level.prompt,
      reinforces: level.reinforces,
      hints: level.hints,
      game: 'parsons',
      solution: level.solution,
      tests: level.tests,
    };
    return (
      <div className="game">
        <div className="puzzle-banner">
          <p>
            🧩 <strong>Puzzle version.</strong> Same program, but the lines are given: put them in an order that works.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => setPuzzle(false)}>
            ← Back to writing it myself
          </button>
        </div>
        {parallel && puzzleFails >= 2 && (
          <details className="parallel-example">
            <summary>📖 See a similar problem, worked out</summary>
            <Markdown text={parallel.prompt} language={language} trusted />
            <CodeEditor value={parallel.code[language]!} language={language} readOnly label="Similar problem, worked out" minHeight={80} />
          </details>
        )}
        <ParsonsGame
          level={asPuzzle}
          language={language}
          onFail={(kind) => {
            setPuzzleFails((n) => n + 1);
            onFail(kind);
          }}
          // The learner's own draft is kept: it's their code, not the reference solution.
          onPass={onPass}
        />
      </div>
    );
  }

  const errorLine = run?.error?.line ?? grade?.tests.find((t) => t.error?.line)?.error?.line ?? null;

  return (
    <div className="game">
      {level.role === 'boss' && level.tests.some((t) => t.phase) && <BossBar tests={level.tests} results={bossResults} />}
      <CodeEditor value={code} onChange={(next) => { setCode(next); setStepped(null); }} language={language} errorLine={stepped ? null : errorLine} activeLine={stepLine} highlightKey={runCount} label={`${level.title} code editor`} minHeight={260} handle={editor} />
      <SymbolBar editor={editor} language={language} hasBlanks={code.includes('___')} />
      {usesInput && (
        <div className="run-input">
          <label htmlFor={`input-${level.id}`}>
            Input for <strong>▶ Run</strong> <span>one value per line; Check uses the tests' own inputs</span>
          </label>
          <textarea
            id={`input-${level.id}`}
            value={runInput}
            onChange={(e) => {
              const { text, clamped } = clampInputText(e.target.value);
              setRunInput(text);
              setInputClamped(clamped);
            }}
            maxLength={INPUT_LIMITS.maxTotal}
            rows={Math.min(6, Math.max(2, runInput.split('\n').length))}
            spellCheck={false}
          />
          {inputClamped && (
            <span role="status">
              Input is limited to {INPUT_LIMITS.maxLines} lines, {INPUT_LIMITS.maxLine} characters a line and {INPUT_LIMITS.maxTotal.toLocaleString()} in all, so the extra was cut.
            </span>
          )}
        </div>
      )}
      <div className="game-toolbar">
        <button className="btn btn-primary" onClick={doCheck} disabled={!!busy}>
          {busy === 'check' ? 'Checking…' : '✓ Check'}
          <kbd className="kbd">Ctrl ⏎</kbd>
        </button>
        <button className="btn" onClick={doRun} disabled={!!busy}>
          {busy === 'run' ? 'Running…' : '▶ Run'}
        </button>
        <button className="btn" onClick={doStep} disabled={!!busy} title="Run it one line at a time and watch the variables">
          {busy === 'step' ? 'Tracing…' : '👣 Step through'}
        </button>
        {canPlay && (
          <button className="btn" onClick={() => { setGrade(null); setRun(null); setStepped(null); setPlayKey((k) => k + 1); }} disabled={!!busy}>
            🎮 Play it
          </button>
        )}
        {canPuzzle && (fails >= 2 || stalled) && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              onScaffold?.();
              setPuzzle(true);
            }}
            title="Try the same problem with the lines given (counts like the answer hint)"
          >
            🧩 Stuck? Try it as a puzzle
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => { reset(); setRun(null); setGrade(null); }} disabled={!!busy}>
          ↺ Reset code
        </button>
      </div>
      {stepped && <StepThrough key={runCount + (stepped.durationMs ?? 0)} result={stepped} onLine={setStepLine} />}
      {playKey > 0 && !run && !grade && !stepped && <PlayConsole key={playKey} level={level} language={language} code={code} />}
      <div className="game-output" aria-live="polite" ref={output}>
        {run && (
          <>
            {run.page && <PagePreview node={run.page} />}
            <Console stdout={run.stdout} stderr={run.stderr} input={usesInput ? runInput : undefined} />
            {run.error && <ErrorBox error={run.error} language={language} deliberate={level.conceptId === 'first-errors'} />}
          </>
        )}
        {grade?.blocked && <Blocked messages={grade.blocked} />}
        <Warnings messages={grade?.warnings} />
        {grade && grade.tests.length > 0 && <TestResults tests={grade.tests} language={language} />}
      </div>
    </div>
  );
}

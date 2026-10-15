import { useCallback, useRef, useState } from 'react';
import { GRID_API, codeLines, gradeSubmission, type GradeResult, type GridAction } from '@codegames/runtime';
import type { GridLevel } from '@codegames/shared';
import { executorFor } from '../../engine';
import { CodeEditor, type CodeEditorHandle } from '../editor/CodeEditor';
import { SymbolBar } from '../editor/SymbolBar';
import { GridBoard } from './GridBoard';
import { Blocked, Warnings, Console, ErrorBox } from './Output';
import { useDraft } from './useDraft';
import { playCompile } from '../../lib/soundFx';
import type { GameProps } from './types';

/** Commands the level actually uses, so early levels don't show sensors before they're taught. */
export function commandsFor(level: { solution: Partial<Record<string, string>> }, language: 'python' | 'javascript') {
  const source = level.solution[language] ?? '';
  return GRID_API[language].filter((name) => new RegExp(`\\b${name}\\(`).test(source));
}

/** Robot Quest: program the robot to collect every gem (and reach the flag). */
export function GridGame({ level, language, onPass, onFail, draftScope = '' }: GameProps<GridLevel>) {
  const { code, setCode, reset } = useDraft(draftScope + level.id, language, level.starterCode[language] ?? '');
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [speed, setSpeed] = useState(260);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const onFrame = useCallback((action: GridAction | undefined) => setActiveLine(action?.line ?? null), []);
  const busyRef = useRef(false);
  const editor = useRef<CodeEditorHandle>(null);
  const pendingCelebration = useRef<(() => void) | null>(null);
  const [replayDone, setReplayDone] = useState(true);
  const onFinished = useCallback(() => {
    setReplayDone(true);
    // Celebrate when the replay really ends (it may have been paused or stepped).
    const celebrate = pendingCelebration.current;
    pendingCelebration.current = null;
    if (celebrate) setTimeout(celebrate, 350);
  }, []);

  const run = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    playCompile();
    setBusy(true);
    try {
      const result = await gradeSubmission(level, language, code, executorFor(language));
      setGrade(result);
      // Hold the error message back until the robot has visibly crashed.
      setReplayDone((result.gridRun?.grid?.actions.length ?? 0) === 0);
      setRunId((n) => n + 1);
      // Saved now; the celebration waits for the replay to finish.
      if (result.passed) {
        const celebrate = onPass({ deferCelebration: true, par: hasPar ? { lines: codeLines(code, language), target: par } : undefined });
        if ((result.gridRun?.grid?.actions.length ?? 0) === 0) celebrate();
        else pendingCelebration.current = celebrate;
      } else onFail('run');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const outcome = grade?.gridRun?.grid;
  const mainStatus = outcome
    ? outcome.success
      ? grade?.blocked
        ? { success: false, message: 'The path works! One more thing below.' }
        : grade?.failedMap
        ? { success: true, message: 'Map 1 solved…' }
        : grade.outputMismatch
          ? { success: false, message: 'Path done, but the output is wrong.' }
          : { success: true, message: 'Level solved!' }
      : { success: false, message: outcome.reason ?? 'Not solved yet.' }
    : undefined;
  const langKey: 'python' | 'javascript' = language === 'cybersecurity' ? 'python' : language;
  const commands = commandsFor(level, langKey);
  const par = codeLines(level.solution[langKey] ?? '', langKey);
  // Fill-in-the-blank levels have a fixed length, so par would be meaningless there.
  const hasPar = level.mode !== 'fill-blanks';

  return (
    <div className="game game-grid">
      <div className="game-grid-board">
        <GridBoard
          spec={level.grid}
          actions={outcome?.actions ?? []}
          runId={runId}
          status={mainStatus}
          speedMs={speed}
          label={level.extraGrids?.length ? 'Map 1' : 'Robot world'}
          onFrame={onFrame}
          onFinished={onFinished}
        />
        {grade?.failedMap && (
          <div className="game-failed-map">
            <p>
              {grade.failedMap.name ? (
                <>
                  Your code solved map 1, but not <strong>map {grade.failedMap.index + 1}</strong> ({grade.failedMap.name}). We changed only the
                  data at the top: make your loop read it instead of following one fixed path!
                </>
              ) : (
                <>
                  Your code solved map 1 but not <strong>map {grade.failedMap.index + 1}</strong>. Make it work for any map, not just this one!
                </>
              )}
            </p>
            <GridBoard
              spec={grade.failedMap.grid}
              actions={grade.failedMap.outcome.actions}
              runId={runId}
              status={{ success: false, message: grade.failedMap.outcome.reason ?? 'Not solved.' }}
              speedMs={speed}
              label={`Map ${grade.failedMap.index + 1}`}
            />
          </div>
        )}
        {level.extraGrids?.length && !grade?.failedMap ? (
          <p className="game-note">Your code will also be tested on {level.extraGrids.length} other map{level.extraGrids.length > 1 ? 's' : ''}.</p>
        ) : null}
      </div>
      <div className="game-grid-code">
        <div className="game-commands" aria-label="Robot commands">
          {commands.map((c) => (
            <button key={c} type="button" title={`Insert ${c}() at the cursor`} onClick={() =>
                /^(is|on|at)/.test(c)
                  ? editor.current?.insert(`${c}()`) // sensors go inside conditions
                  : editor.current?.insertLine(`${c}()${language === 'javascript' ? ';' : ''}`)
              }>
              <code>{c}()</code>
            </button>
          ))}
          {hasPar && (
            <span className="game-par" title="Par: the length of our solution. Matching it earns ⚡.">
              Par {par} lines
            </span>
          )}
        </div>
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          errorLine={grade?.gridRun?.error?.line ?? null}
          highlightKey={runId}
          activeLine={activeLine}
          handle={editor}
          label={`${level.title} code editor`}
          minHeight={240}
        />
        <SymbolBar editor={editor} language={language} hasBlanks={code.includes('___')} />
        <div className="game-toolbar">
          <button className="btn btn-primary" onClick={run} disabled={busy}>
            {busy ? 'Running…' : '▶ Run robot'}
          </button>
          <button className="btn btn-ghost" onClick={() => setSpeed((s) => (s === 260 ? 110 : 260))}>
            {speed === 260 ? '⏩ Faster' : '▶ Normal speed'}
          </button>
          <button className="btn btn-ghost" onClick={() => { reset(); setGrade(null); setRunId((n) => n + 1); }} disabled={busy}>
            ↺ Reset code
          </button>
        </div>
        <div className="game-output" aria-live="polite">
          {replayDone && grade?.blocked && <Blocked messages={grade.blocked} />}
          {replayDone && <Warnings messages={grade?.warnings} />}
          {replayDone && grade?.gridRun?.error && <ErrorBox error={grade.gridRun.error} language={language} />}
          {grade?.outputMismatch && (
            <div className="out-blocked">
              <p>The robot finished, but the program should print exactly: {grade.outputMismatch.expected}</p>
            </div>
          )}
          {grade?.gridRun?.stdout || grade?.gridRun?.stderr ? <Console stdout={grade.gridRun.stdout} stderr={grade.gridRun.stderr} /> : null}
        </div>
      </div>
    </div>
  );
}

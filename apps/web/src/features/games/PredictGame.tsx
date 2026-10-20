import { useRef, useState } from 'react';
import { gradeModify, looseContainers, gradePrediction, type ExecResult, type GradeResult, type PredictionResult } from '@codegames/runtime';
import type { PredictLevel } from '@codegames/shared';
import { executorFor } from '../../engine';
import { Markdown } from '../../lib/markdown';
import { CodeEditor } from '../editor/CodeEditor';
import { Blocked, TestResults } from './Output';
import { StepThrough } from './StepThrough';
import { useDraft } from './useDraft';
import type { GameProps } from './types';

const REVEAL_AFTER = 2;

/** Which predicted lines appear, in order, in the real output (longest common subsequence). */
function matchedLines(predicted: string[], actual: string[]): boolean[] {
  const n = predicted.length;
  const m = actual.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i]![j] = predicted[i] === actual[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const ok = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (predicted[i] === actual[j]) {
      ok[i] = true;
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i++;
    else j++;
  }
  return ok;
}

/** Read the code, type exactly what it prints. Graded against the code's real output. */
export function PredictGame({ level, language, onPass, onFail, onReveal, draftScope = '' }: GameProps<PredictLevel>) {
  const source = level.code[language] ?? '';
  const [prediction, setPrediction] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [stepped, setStepped] = useState<ExecResult | null>(null);
  const [stepLine, setStepLine] = useState<number | null>(null);
  const [wrong, setWrong] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [predicted, setPredicted] = useState(false);
  const modify = useDraft(`${draftScope}${level.id}#modify`, language, source);
  const [modifyGrade, setModifyGrade] = useState<GradeResult | null>(null);

  const busyRef = useRef(false);

  const [modifyDone, setModifyDone] = useState(false);
  const checkModify = async () => {
    if (busyRef.current || modifyDone) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await gradeModify(level, language, modify.code, executorFor(language));
      setModifyGrade(r);
      if (r.passed) {
        setModifyDone(true);
        onPass();
      }
      else onFail();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  // Multiple choice first (docs/PEDAGOGY_PLAN.md); the learner can switch to typing.
  const choices = level.choices?.[language];
  const [typing, setTyping] = useState(!choices?.length);
  const [ruledOut, setRuledOut] = useState<string[]>([]);

  // PRIMM Investigate: "why" questions after a correct prediction. Wrong picks are ruled out, never penalised.
  const questions = level.investigate ?? [];
  const [answered, setAnswered] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const investigated = answered >= questions.length;
  const answerQuestion = (choice: number) => {
    if (choice !== questions[answered]?.answer) {
      setMissed((m) => [...m, choice]);
      return;
    }
    setMissed([]);
    setAnswered(answered + 1);
    if (answered + 1 === questions.length && !level.modify) onPass();
  };

  const check = async (answer: string = prediction, picked = false) => {
    if (busyRef.current || predicted) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await gradePrediction(source, level.stdin, answer, executorFor(language), level.expectError, language);
      if (!r.correct && answer !== prediction) setRuledOut((out) => [...out, answer]);
      setResult(r);
      if (r.correct) {
        // PRIMM: predict first, then investigate and modify (if the level has those steps).
        if (level.modify || questions.length > 0) setPredicted(true);
        else onPass();
      } else {
        setWrong((w) => w + 1);
        onFail();
        // Guessing among a few options is cheap, so a wrong pick counts as two tries: three
        // stars need a right first pick (round-7 teacher audit).
        if (picked) onFail();
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const reveal = async () => {
    const r = result ?? (await gradePrediction(source, level.stdin, '', executorFor(language), level.expectError, language));
    setResult(r);
    setRevealed(true);
    onReveal?.();
  };

  const choose = (choice: string) => {
    setPrediction(choice);
    void check(choice, true);
  };

  const predictedLines = prediction.replace(/\s+$/, '').split('\n');
  const actualLines = result?.actual.split('\n') ?? [];
  // Compare lines the same lenient way the grader does (spacing in brackets, quote style), and
  // let an expected error's full Python line ("IndexError: ...") match its name.
  const loose = (line: string) => looseContainers(line.trimEnd(), language);
  const errorName = level.expectError ? result?.run.error?.name : undefined;
  const lineOk = matchedLines(
    predictedLines.map((l) => (errorName && l.trim().startsWith(`${errorName}:`) ? errorName : loose(l))),
    actualLines.map(loose),
  );
  const missing = Math.max(0, actualLines.length - predictedLines.length);

  return (
    <div className="game">
      <CodeEditor value={source} language={language} readOnly activeLine={stepLine} label={`${level.title} code to read`} minHeight={120} />
      <label className="predict-label" id={`predict-label-${level.id}`} htmlFor={!typing && choices ? undefined : `predict-${level.id}`}>
        What will it print?
        {level.expectError && (
          <span className="predict-error-note">
            {' '}If it stops with an error, write the error's name (like {language === 'python' ? 'IndexError' : 'TypeError'}) as the last line.
          </span>
        )}
      </label>
      {!typing && choices ? (
        <div className="predict-choices" role="group" aria-labelledby={`predict-label-${level.id}`}>
          {orderChoices(choices, level.id + language).map((choice) => {
            const out = ruledOut.includes(choice);
            return (
              <button
                key={choice}
                className={`predict-choice${out ? ' is-out' : ''}${predicted || result?.correct ? (choice === prediction ? ' is-right' : '') : ''}`}
                onClick={() => choose(choice)}
                disabled={busy || predicted || out || !!result?.correct}
                aria-label={`${out ? 'Ruled out: ' : ''}${choice.split('\n').join(', ') || 'a blank line'}`}
              >
                <pre>{choice || ' '}</pre>
              </button>
            );
          })}
          <button className="btn btn-ghost btn-sm predict-type-instead" onClick={() => setTyping(true)}>
            ✏️ I'd rather type it
          </button>
        </div>
      ) : (
      <textarea
        id={`predict-${level.id}`}
        className="predict-input"
        value={prediction}
        maxLength={2000}
        onChange={(e) => setPrediction(e.target.value)}
        rows={Math.max(3, predictedLines.length + 1)}
        spellCheck={false}
        placeholder="Type the output here, one line per printed line…"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void check();
        }}
      />
      )}
      <div className="game-toolbar">
        {typing && (
          <button className="btn btn-primary" onClick={() => void check()} disabled={busy || predicted || !prediction.trim()}>
            {busy ? 'Running the code…' : '✓ Check prediction'}
          </button>
        )}
        {result && (result.correct || revealed) && !stepped && (
          <button className="btn" onClick={async () => setStepped(await executorFor(language)(source, { stdin: level.stdin, trace: true, seed: 1 }))}>
            👣 Watch it run, step by step
          </button>
        )}
        {wrong >= REVEAL_AFTER && !revealed && (
          <button className="btn btn-ghost" onClick={reveal}>
            👀 Show me the answer
          </button>
        )}
      </div>
      {stepped && <StepThrough result={stepped} onLine={setStepLine} />}
      {predicted && questions.length > 0 && (
        <section className="modify investigate" aria-label="Investigate the code">
          <p className="modify-ok">✓ Prediction correct!</p>
          <span className="eyebrow">
            Step 2 · Investigate ({Math.min(answered + 1, questions.length)} of {questions.length})
          </span>
          {investigated ? (
            <p className="modify-ok">✓ You worked out why.</p>
          ) : (
            <>
              <Markdown text={questions[answered]!.question} language={language} trusted />
              <div className="predict-choices" role="group" aria-label="Pick an answer">
                {orderChoices(questions[answered]!.choices.map((_, i) => String(i)), `${level.id}${answered}`).map((key) => {
                  const i = Number(key);
                  const out = missed.includes(i);
                  return (
                    <button key={key} className={`predict-choice investigate-choice${out ? ' is-out' : ''}`} onClick={() => answerQuestion(i)} disabled={out}>
                      <Markdown text={questions[answered]!.choices[i]!} language={language} inline trusted />
                    </button>
                  );
                })}
              </div>
              {missed.length > 0 && <p className="predict-note">Not that one. Look at the code again: what does each line do?</p>}
            </>
          )}
        </section>
      )}
      {predicted && investigated && level.modify && (
        <section className="modify" aria-label="Modify the code">
          {questions.length === 0 && <p className="modify-ok">✓ Prediction correct!</p>}
          <span className="eyebrow">Step {questions.length > 0 ? 3 : 2} · Modify</span>
          <Markdown text={level.modify.prompt} language={language} trusted />
          <CodeEditor value={modify.code} onChange={modify.setCode} language={language} label={`${level.title}: modify the code`} minHeight={120} />
          <div className="game-toolbar">
            <button className="btn btn-primary" onClick={checkModify} disabled={busy}>
              {busy ? 'Checking…' : '✓ Check my change'}
            </button>
            <button className="btn btn-ghost" onClick={() => { modify.reset(); setModifyGrade(null); }} disabled={busy}>
              ↺ Reset code
            </button>
          </div>
          {modifyGrade?.blocked && <Blocked messages={modifyGrade.blocked} />}
          {modifyGrade && modifyGrade.tests.length > 0 && !modifyGrade.passed && <TestResults tests={modifyGrade.tests} language={language} />}
        </section>
      )}
      {result && !result.correct && (
        <div className="predict-compare" aria-live="polite">
          <div>
            <span className="out-label">You predicted</span>
            <pre>
              {predictedLines.map((line, i) => (
                <span key={i} className={lineOk[i] ? 'line-ok' : 'line-bad'}>
                  {line || ' '}
                  {'\n'}
                </span>
              ))}
            </pre>
          </div>
          {revealed ? (
            <div>
              <span className="out-label">It actually prints</span>
              <pre>{result.actual}</pre>
              <p className="predict-note">Compare line by line and figure out why. Then type it in to finish the level.</p>
            </div>
          ) : (
            <p className="predict-note">
              Not quite. Lines in red don't match.
              {missing > 0 && ` You're also missing ${missing} line${missing > 1 ? 's' : ''}.`}
              {actualLines.length < predictedLines.length && ' You have more lines than the program prints.'}{' '}
              {wrong < REVEAL_AFTER ? 'Trace the code line by line and try again.' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Same order every time for a level (the correct answer isn't always first). */
function orderChoices(choices: string[], seed: string): string[] {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
  const out = [...choices];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { levels, REFRESHER_AFTER, REFRESHERS } from '@codegames/curriculum';
import { explainOutput, type ExecError, type TestResult } from '@codegames/runtime';
import type { Language, PlayableLanguage } from '@codegames/shared';
import { useMastery } from '../progress/useMastery';
import { useProgress } from '../progress/store';
import { Markdown } from '../../lib/markdown';
import { playPass, playError } from '../../lib/soundFx';
import './Output.css';

const MAX_LINES = 60;
const MAX_CHARS = 4000;

/** Keep runaway output from making the page enormous. */
export function clip(text: string): string {
  // Very long text is cut before it is split, so a 100-million-character message costs the same as a short one.
  if (text.length > MAX_CHARS * 4) text = text.slice(0, MAX_CHARS * 4);
  const lines = text.split('\n');
  if (lines.length <= MAX_LINES && text.length <= MAX_CHARS) return text;
  const kept = lines.slice(0, MAX_LINES).join('\n').slice(0, MAX_CHARS);
  return `${kept}\n… (${lines.length - MAX_LINES > 0 ? lines.length - MAX_LINES : 'more'} more lines hidden)`;
}

/**
 * With `language`, the error is counted, and a third repeat of the same kind shows a short
 * refresher once (docs/PEDAGOGY_PLAN.md: repeated-error micro-lessons); the count then starts
 * over. `deliberate` errors (levels that crash on purpose) are not counted.
 */
export function ErrorBox({ error, language, deliberate }: { error: ExecError; language?: PlayableLanguage; deliberate?: boolean }) {
  const title = error.kind === 'robot' ? 'Robot stopped' : error.kind === 'timeout' ? 'Took too long' : error.name;
  const recordError = useProgress((s) => s.recordError);
  const [repeats, setRepeats] = useState(0);
  const kind = error.kind === 'timeout' ? 'TimeoutError' : error.name;
  useEffect(() => {
    if (language && !deliberate && error.kind !== 'internal' && error.kind !== 'robot') setRepeats(recordError(language, kind));
  }, [error, language, deliberate, kind, recordError]);
  const refresher = repeats >= REFRESHER_AFTER ? REFRESHERS[kind] : undefined;
  return (
    <div className="out-error" role="alert">
      <div className="out-error-head">
        <span className="out-error-name">{title}</span>
        {error.line && <span className="out-error-line">line {error.line}</span>}
      </div>
      <p className="out-error-friendly">
        {/* Explanations contain no language tokens, so any language renders them. */}
        <Markdown text={error.friendly} language="python" inline />
      </p>
      {error.kind !== 'robot' && <pre className="out-error-raw">{clip(`${error.name}: ${error.message}`)}</pre>}
      {error.kind === 'robot' && <p className="out-error-raw-text">{clip(error.message)}</p>}
      {refresher && language && (
        <div className="out-refresher">
          <strong>
            💡 {refresher.title}{' '}
            <span className="out-refresher-count">
              ({kind} #{repeats})
            </span>
          </strong>
          <p>
            <Markdown text={refresher.text} language={language} inline trusted />
          </p>
          {refresher.practice && <PracticeLink levelId={refresher.practice} language={language} />}
        </div>
      )}
    </div>
  );
}

/** A bug hunt that trains this fix, offered only once its concept is open (and not from inside it). */
function PracticeLink({ levelId, language }: { levelId: string; language: PlayableLanguage }) {
  const mastery = useMastery(language);
  const { pathname } = useLocation();
  const level = levels.find((l) => l.id === levelId);
  if (level?.game !== 'bug-hunt' || !level.starterCode[language] || pathname.endsWith(`/play/${levelId}`)) return null;
  const state = mastery[level.conceptId];
  if (!state || state === 'locked') return null;
  return (
    <Link className="out-refresher-practice" to={`/play/${levelId}`}>
      🐞 Practice this fix: {level.title} →
    </Link>
  );
}

export function Console({ stdout, stderr, input, empty = 'Nothing printed.' }: { stdout: string; stderr?: string; input?: string; empty?: string }) {
  return (
    <div className="out-console">
      <div className="out-console-head">
        <span>Output</span>
        {input !== undefined && <span className="out-console-input">input: {input.replace(/\n/g, ' ⏎ ')}</span>}
      </div>
      <pre className={stdout ? '' : 'is-empty'}>{stdout ? clip(stdout) : empty}</pre>
      {stderr && (
        <pre className="out-console-stderr" aria-label="Warnings and errors (not graded)">
          {clip(stderr)}
        </pre>
      )}
    </div>
  );
}

/** Where two outputs first differ (1-based line and column). */
export function firstDifference(expected: string, actual: string): { line: number; col: number; want: string; got: string } | null {
  const e = expected.split('\n');
  const a = actual.split('\n');
  for (let i = 0; i < Math.max(e.length, a.length); i++) {
    const el = e[i];
    const al = a[i];
    if (el === al) continue;
    if (el === undefined) return { line: i + 1, col: 1, want: 'nothing (end of output)', got: `an extra line "${al}"` };
    if (al === undefined) return { line: i + 1, col: 1, want: `the line "${el}"`, got: 'nothing (your output ended)' };
    let c = 0;
    while (c < el.length && el[c] === al[c]) c++;
    const show = (ch: string | undefined) => (ch === undefined ? 'end of line' : ch === ' ' ? 'a space' : `"${ch}"`);
    return { line: i + 1, col: c + 1, want: show(el[c]), got: show(al[c]) };
  }
  return null;
}

/** Long decimals like 2.4000000000000004 come from how computers store decimals. */
const FLOAT_NOISE = /\d\.\d*(0{5,}|9{5,})\d/;

/** Show a line of output with the character at `col` marked and spaces made visible. */
function MarkedLine({ text, col }: { text: string; col: number }) {
  const visible = (s: string) => s.replace(/ /g, '·');
  return (
    <>
      {visible(text.slice(0, col - 1))}
      <mark className="out-diff-mark">{text[col - 1] === undefined ? '⏎' : visible(text[col - 1]!)}</mark>
      {visible(text.slice(col))}
    </>
  );
}

export function TestResults({ tests, language }: { tests: TestResult[]; language?: Language }) {
  const passed = tests.filter((t) => t.passed).length;
  const allPassed = tests.length > 0 && passed === tests.length;

  useEffect(() => {
    if (tests.length > 0) {
      if (allPassed) {
        playPass();
      } else {
        playError();
      }
    }
  }, [tests, allPassed]);

  // The same crash in every test is one problem: show it once, above the list.
  const errors = tests.filter((t) => t.error).map((t) => t.error!);
  const shared = errors.length > 1 && errors.every((e) => e.name === errors[0]!.name && e.message === errors[0]!.message) ? errors[0] : undefined;
  return (
    <div className="out-tests">
      <div className="out-tests-head">
        Tests <span className={passed === tests.length ? 'is-pass' : 'is-fail'}>{passed}/{tests.length} passed</span>
      </div>
      {shared && (
        <div className="out-tests-shared">
          <p>{errors.length === tests.length ? 'Every test' : `${errors.length} of ${tests.length} tests`} stopped with the same error:</p>
          <ErrorBox error={shared} language={language as PlayableLanguage | undefined} />
        </div>
      )}
      <ul>
        {tests.map((t) => (
          <li key={t.name} className={t.passed ? 'is-pass' : 'is-fail'}>
            <div className="out-test-name">
              <span aria-hidden="true">{t.passed ? '✓' : '✗'}</span> {t.name}
              {t.hidden && <span className="chip">hidden</span>}
              {t.skipped && <span className="chip">skipped</span>}
            </div>
            {t.skipped && <p className="out-test-hint">Not run: an earlier test got stuck in a loop.</p>}
            {!t.passed && t.mainStopped && (
              <p className="out-test-hint">
                This test calls your function after your main program finishes, but the main program stopped first
                {t.error ? ' with an error' : ' (an exit, or it asked for more input than the test gives)'}. Fix that, then the call can run.
              </p>
            )}
            {!t.passed && !t.hidden && !t.skipped && !t.error && (() => {
              const diff = firstDifference(t.expected, t.actual);
              if (!diff) return null;
              const line = t.actual.split('\n')[diff.line - 1];
              return (
                <div className="out-diff">
                  <p>
                    First difference: line {diff.line}, character {diff.col}. Expected {diff.want}, but got {diff.got}.
                  </p>
                  {line !== undefined && (
                    <pre>
                      <MarkedLine text={line} col={diff.col} />
                    </pre>
                  )}
                  {language &&
                    explainOutput(t.actual, t.expected, language).map((note) => (
                      <p key={note} className="out-diff-tip">
                        💡 <Markdown text={note} language="python" inline />
                      </p>
                    ))}
                  {FLOAT_NOISE.test(t.actual) && (
                    <p className="out-diff-tip">
                      💡 Numbers like 2.4000000000000004 aren't your maths being wrong: computers store decimals approximately. Round them
                      when you print, e.g. <code>:.2f</code> in Python or <code>.toFixed(2)</code> in JavaScript.
                    </p>
                  )}
                </div>
              );
            })()}
            {!t.passed && !t.hidden && !t.skipped && (
              <div className="out-test-detail">
                {t.call !== undefined ? (
                  <div>
                    <span className="out-label">We called</span>
                    <pre>{t.call}</pre>
                  </div>
                ) : t.input !== undefined && (
                  <div>
                    <span className="out-label">Input</span>
                    <pre>{t.input}</pre>
                  </div>
                )}
                <div>
                  <span className="out-label">Expected</span>
                  <pre>{clip(t.expected) || ' '}</pre>
                </div>
                <div>
                  <span className="out-label">Your output</span>
                  <pre>{t.actual ? clip(t.actual) : '(nothing)'}</pre>
                </div>
              </div>
            )}
            {!t.passed && t.hidden && !t.mainStopped && !t.error && (
              <p className="out-test-hint">
                {t.call !== undefined
                  ? 'This test uses your functions and classes directly, with new values (its name says what it checks). Make sure they follow the rules for any input, not just the example.'
                  : 'A hidden test failed. Does your code work for other inputs too?'}
              </p>
            )}
            {!t.passed && t.error && !shared && <ErrorBox error={t.error} language={language as PlayableLanguage | undefined} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Likely-mistake warnings (missing brackets, uncalled commands). */
export function Warnings({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <div className="out-warnings" role="status">
      {messages.map((m) => (
        <p key={m}>
          <span aria-hidden="true">💡</span> <Markdown text={m} language="python" inline />
        </p>
      ))}
    </div>
  );
}

export function Blocked({ messages }: { messages: string[] }) {
  return (
    <div className="out-blocked" role="alert">
      {messages.map((m) => (
        <p key={m}>
          <span aria-hidden="true">⚑</span> {m}
        </p>
      ))}
    </div>
  );
}

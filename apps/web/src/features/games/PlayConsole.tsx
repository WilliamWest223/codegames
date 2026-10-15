import { useEffect, useRef, useState } from 'react';
import type { DomEvent, ExecResult, InputEvent } from '@codegames/runtime';
import type { CodeLevel, PlayableLanguage } from '@codegames/shared';
import { executorFor } from '../../engine';
import { Markdown } from '../../lib/markdown';
import { ErrorBox } from './Output';
import { readHangman } from './play/hangman';
import { HangmanScreen } from './play/HangmanScreen';
import { readAdventure } from './play/adventure';
import { AdventureScreen } from './play/AdventureScreen';
import { PagePreview } from './play/PagePreview';
import { INPUT_LIMITS, clampEventValue, whyRefuse } from './inputLimits';

const WAITING_ERRORS = new Set(['EOFError', 'InputError']);

/**
 * Play the learner's own program interactively. Programs here are deterministic, so
 * each time the program asks for input we re-run it from the start with every answer
 * typed so far: no special browser features needed. Web Pages levels work the same way:
 * every click or keystroke on the page is appended to a list of events the runtime replays
 * after the program has set up its handlers, so the program never has to stay alive.
 */
/** Interleave output with the prompts and answers, like a real terminal session. */
function transcript(stdout: string, events: InputEvent[], answers: string[]): { text: string; kind: 'out' | 'prompt' | 'answer' }[] {
  const parts: { text: string; kind: 'out' | 'prompt' | 'answer' }[] = [];
  let last = 0;
  events.forEach((e, i) => {
    if (e.offset > last) parts.push({ text: stdout.slice(last, e.offset), kind: 'out' });
    last = e.offset;
    if (e.prompt) parts.push({ text: e.prompt, kind: 'prompt' });
    if (answers[i] !== undefined) parts.push({ text: `${answers[i]}\n`, kind: 'answer' });
  });
  if (last < stdout.length) parts.push({ text: stdout.slice(last), kind: 'out' });
  return parts;
}

export function PlayConsole({ level, language, code: liveCode }: { level: CodeLevel; language: PlayableLanguage; code: string }) {
  // The program is fixed when play starts: editing mid-game must not swap it.
  const [code] = useState(liveCode);
  // One seed per game, so re-runs see the same "random" numbers (e.g. a random secret).
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [hidden] = useState<string[]>(() => {
    const play = level.play;
    const first = play?.randomFirstInput
      ? [String(play.randomFirstInput[0] + Math.floor(Math.random() * (play.randomFirstInput[1] - play.randomFirstInput[0] + 1)))]
      : play?.randomWord?.length
        ? [play.randomWord[Math.floor(Math.random() * play.randomWord.length)]!]
        : [];
    return [...first, ...(play?.fixedInputs ?? [])];
  });
  const isPage = level.play?.renderer === 'page' && level.page !== undefined;
  const [typed, setTyped] = useState<string[]>([]);
  const [events, setEvents] = useState<DomEvent[]>([]);
  // Page interactions clear the page's own state too: remount the preview so it forgets its drafts.
  const [pageKey, setPageKey] = useState(0);
  const [line, setLine] = useState('');
  const [result, setResult] = useState<ExecResult | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLPreElement>(null);
  // The newest answers and events; a run that finishes while more arrived runs once more
  // with all of them, instead of queueing a run per keystroke.
  const latest = useRef<{ inputs: string[]; events: DomEvent[] }>({ inputs: [], events: [] });
  const inFlight = useRef(false);
  const stale = useRef(false);

  const run = async () => {
    if (inFlight.current) {
      stale.current = true;
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      do {
        stale.current = false;
        const { inputs, events } = latest.current;
        const lines = [...hidden, ...inputs];
        // No trailing newline when nothing was typed: that would be an (empty) answer.
        const stdin = lines.length ? lines.join('\n') + '\n' : '';
        setResult(await executorFor(language)(code, { stdin, seed, ...(isPage ? { page: level.page, events } : {}) }));
      } while (stale.current);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const restart = (keepInputs = false) => {
    setLimitNote(null);
    latest.current = { inputs: keepInputs ? latest.current.inputs : [], events: [] };
    if (!keepInputs) setTyped([]);
    setEvents([]);
    setPageKey((k) => k + 1);
    void run();
  };

  useEffect(() => {
    void run();
    // Start once; restarting is explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waiting = !!result?.error && WAITING_ERRORS.has(result.error.name);
  // Keep the newest output in view, like a terminal.
  useEffect(() => {
    const screen = screenRef.current;
    if (screen) screen.scrollTop = screen.scrollHeight;
  }, [result]);
  useEffect(() => {
    if (waiting) inputRef.current?.focus();
  }, [waiting, result]);

  const [limitNote, setLimitNote] = useState<string | null>(null);
  const submit = () => {
    const refusal = whyRefuse([...hidden, ...typed], line);
    setLimitNote(refusal);
    if (refusal) return;
    const next = [...typed, line];
    setTyped(next);
    setLine('');
    latest.current = { ...latest.current, inputs: next };
    void run();
  };

  const onPageEvent = (raw: DomEvent) => {
    // Bounded, like the runtime's replay: a page session keeps at most 500 interactions of at most 1000 characters.
    if (latest.current.events.length >= INPUT_LIMITS.maxEvents) {
      setLimitNote(`This page has handled ${INPUT_LIMITS.maxEvents} clicks and keystrokes. Press "Reset page" to start fresh.`);
      return;
    }
    const event = clampEventValue(raw);
    const next = [...latest.current.events, event];
    latest.current = { ...latest.current, events: next };
    setEvents(next);
    void run();
  };

  // The page is drawn once the program has every input it asked for; while it waits, the console leads.
  const showPage = isPage && result?.page && !waiting;

  return (
    <section className="play" aria-label="Play your program">
      <div className="play-head">
        <span className="eyebrow">🎮 Play it</span>
        <div className="play-actions">
          {isPage && (
            <button className="btn btn-ghost btn-sm" onClick={() => restart(true)} disabled={events.length === 0} title="Undo every click and keystroke on the page">
              ⟲ Reset page
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => restart()} disabled={busy && !isPage}>
            ↺ Restart
          </button>
        </div>
      </div>
      {level.play?.intro && <Markdown text={level.play.intro} language={language} trusted />}
      {level.play?.renderer === 'hangman' && result && <HangmanScreen view={readHangman(result.stdout, typed, !waiting)} />}
      {level.play?.renderer === 'adventure' && result && <AdventureScreen view={readAdventure(result.stdout)} />}
      {showPage && <PagePreview key={pageKey} node={result.page!} onEvent={onPageEvent} settled={!busy} />}
      <pre className="play-screen" aria-live="polite" ref={screenRef}>
        {result
          ? transcript(result.stdout, (result.inputs ?? []).slice(hidden.length), typed).map((part, i) => (
              <span key={i} className={`play-${part.kind}`}>
                {part.text}
              </span>
            ))
          : busy
            ? '…'
            : ''}
      </pre>
      {limitNote && (
        <p className="play-done" role="status">
          {limitNote}
        </p>
      )}
      {waiting ? (
        <form className="play-input" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <label htmlFor={`play-${level.id}`}>Your program is waiting for input:</label>
          <input id={`play-${level.id}`} ref={inputRef} value={line} onChange={(e) => setLine(e.target.value)} maxLength={INPUT_LIMITS.maxLine} autoComplete="off" spellCheck={false} />
          <button className="btn btn-primary btn-sm" disabled={busy}>Enter ⏎</button>
        </form>
      ) : result?.error ? (
        <ErrorBox error={result.error} />
      ) : result ? (
        <p className="play-done">
          {isPage ? 'Your page is live: the program runs again after every click or keystroke.' : 'Program finished.'}
          {hidden.length > 0 && !result.stdout.includes(hidden[0]!) ? ` (The secret was ${hidden[0]}.)` : ''}
        </p>
      ) : null}
    </section>
  );
}

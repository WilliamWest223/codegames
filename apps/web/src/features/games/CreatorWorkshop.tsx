import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CodeLevel, LangCode, PlayableLanguage } from '@codegames/shared';
import { downloadText } from '../../lib/download';
import { CodeEditor } from '../editor/CodeEditor';
import { PlayConsole } from './PlayConsole';
import { useDraft } from './useDraft';
import './CreatorWorkshop.css';

const MAX_FILE_BYTES = 50_000;
const FILE_EXTENSION: Record<PlayableLanguage, string> = { python: 'py', javascript: 'js', cybersecurity: 'py' };

export interface WorkshopConfig {
  /** Draft key: the learner's data is saved per language, apart from every level's draft. */
  draftKey: string;
  /** Download name without the extension, e.g. `my-world` → `my-world.py`. */
  fileBase: string;
  /** Starter data for the editor. */
  starter: LangCode;
  /** The full program to play: the learner's data above the fixed engine. */
  compose: (data: LangCode) => LangCode;
  /** The pretend level PlayConsole runs (intro text and renderer). Never graded. */
  playLevel: CodeLevel;
  back: { to: string; label: string };
  eyebrow: string;
  title: string;
  lede: ReactNode;
  editorEyebrow: string;
  editorTitle: string;
  editorHelp: ReactNode;
  /** Accessible name of the editor (also the editor section's label). */
  editorLabel: string;
  playLabel: string;
  resetLabel: string;
  /** Accessible name of the play area. */
  playRegionLabel: string;
  emptyTitle: string;
  emptyText: ReactNode;
}

/** The pretend level a workshop plays: ungraded, no hints or tests, starter = solution = data. */
export function sandboxLevel(
  id: string,
  conceptId: string,
  title: string,
  starter: LangCode,
  play: NonNullable<CodeLevel['play']>,
): CodeLevel {
  return {
    id,
    conceptId,
    title,
    role: 'challenge',
    mode: 'freeform',
    game: 'build-it',
    prompt: '',
    reinforces: [],
    hints: [],
    starterCode: starter,
    solution: starter,
    tests: [],
    play,
  };
}

/**
 * A creative sandbox after a boss: edit only the data layer and play it with the boss's
 * engine. Nothing here is graded, rewarded or written to progress (only the draft is saved).
 */
export function CreatorWorkshop({ language, config }: { language: PlayableLanguage; config: WorkshopConfig }) {
  const langKey: 'python' | 'javascript' = language === 'cybersecurity' ? 'python' : language;
  const { code, setCode, reset } = useDraft(config.draftKey, language, config.starter[langKey] ?? '');
  const [play, setPlay] = useState<{ run: number; code: string } | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);

  const startPlaying = () => {
    const data: LangCode = { [langKey]: code };
    setPlay((p) => ({ run: (p?.run ?? 0) + 1, code: config.compose(data)[langKey] ?? '' }));
  };

  const fileName = `${config.fileBase}.${FILE_EXTENSION[language]}`;

  // Opened files only replace the editor text; they run like typed code (in the worker, on Play).
  const openFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`That file is too big (the limit is ${MAX_FILE_BYTES / 1000} KB).`);
      return;
    }
    const text = await file.text();
    if (text.includes('\0')) {
      setFileError("That doesn't look like a text file (it contains binary data).");
      return;
    }
    setFileError(null);
    setCode(text);
    setPlay(null);
  };

  return (
    <div className="creator">
      <header className="creator-head">
        <div>
          <Link to={config.back.to} className="level-crumbs">← {config.back.label}</Link>
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p className="creator-lede">{config.lede}</p>
        </div>
        <div className="creator-actions">
          <button className="btn btn-primary" onClick={startPlaying}>
            ▶ {config.playLabel}
          </button>
          <button className="btn btn-ghost" onClick={() => { reset(); setPlay(null); }}>
            {config.resetLabel}
          </button>
        </div>
      </header>

      <div className="creator-grid">
        <section className="panel creator-editor" aria-label={config.editorLabel}>
          <div className="creator-section-head">
            <div>
              <span className="eyebrow">{config.editorEyebrow}</span>
              <h2>{config.editorTitle}</h2>
            </div>
            <span className="chip">{langKey === 'python' ? 'Python' : 'JavaScript'}</span>
          </div>
          <p>{config.editorHelp}</p>
          <CodeEditor value={code} onChange={setCode} language={langKey} label={config.editorLabel} minHeight={360} />
          <div className="creator-files">
            <button className="btn btn-ghost btn-sm" onClick={() => downloadText(fileName, code)}>
              ⬇ Download {fileName}
            </button>
            <label className="btn btn-ghost btn-sm">
              📂 Open a file
              <input
                type="file"
                className="visually-hidden"
                accept={`.${FILE_EXTENSION[language]},.txt`}
                onChange={(e) => {
                  void openFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {fileError && <p className="creator-file-error" role="alert">{fileError}</p>}
          </div>
        </section>

        <section className="creator-play" aria-label={config.playRegionLabel}>
          {play ? (
            <PlayConsole key={play.run} level={config.playLevel} language={language} code={play.code} />
          ) : (
            <div className="panel creator-empty">
              <span className="creator-icon" aria-hidden="true">✦</span>
              <h2>{config.emptyTitle}</h2>
              <p>{config.emptyText}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

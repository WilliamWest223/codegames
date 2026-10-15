import { LANGUAGE_LABELS, PLAYABLE_LANGUAGES, type PlayableLanguage } from '@codegames/shared';
import { useProgress } from '../progress/store';
import './Welcome.css';

const PITCH: Record<PlayableLanguage, { line: string; sample: string }> = {
  python: { line: 'Clean and readable. A favorite first language, used for data, AI, and automation.', sample: 'print("Hello, World!")' },
  javascript: { line: 'The language of the web. Runs in every browser and powers interactive sites.', sample: 'console.log("Hello, World!");' },
};

/** First-run screen: what CodeGames is, and pick a starting language. */
export function Welcome() {
  const setLanguage = useProgress((s) => s.setLanguage);
  return (
    <div className="welcome">
      <p className="eyebrow">Learn to code by playing</p>
      <h1 className="welcome-title">
        Program a robot. <br />
        <span>Then program anything.</span>
      </h1>
      <p className="welcome-lede">
        CodeGames teaches real programming from the very first line, with puzzles, robot quests, and bug hunts that get
        harder as you get better. Every level builds on the ones before, so nothing you learn gets forgotten.
      </p>
      <h2 className="welcome-pick">Pick your first language</h2>
      <div className="welcome-cards">
        {PLAYABLE_LANGUAGES.map((lang, i) => (
          <button key={lang} className={`welcome-card lang-${lang}`} style={{ animationDelay: `${120 + i * 90}ms` }} onClick={() => setLanguage(lang)}>
            <span className="welcome-card-name">{LANGUAGE_LABELS[lang]}</span>
            <span className="welcome-card-line">{PITCH[lang].line}</span>
            <code className="welcome-card-sample">{PITCH[lang].sample}</code>
            <span className="welcome-card-go">Start with {LANGUAGE_LABELS[lang]} →</span>
          </button>
        ))}
      </div>
      <p className="welcome-note">You can switch languages any time. Progress is saved separately for each one, right here on this computer.</p>
    </div>
  );
}

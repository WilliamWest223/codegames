import { LANGUAGE_LABELS, PLAYABLE_LANGUAGES } from '@codegames/shared';
import { useProgress } from '../features/progress/store';
import './LanguageSwitch.css';

/** Segmented control to switch the language you're learning. Progress is kept per language. */
export function LanguageSwitch() {
  const language = useProgress((s) => s.language);
  const setLanguage = useProgress((s) => s.setLanguage);
  return (
    <div className="lang-switch" role="radiogroup" aria-label="Language">
      {PLAYABLE_LANGUAGES.map((lang) => (
        <button
          key={lang}
          role="radio"
          aria-checked={language === lang}
          className={`lang-switch-option lang-${lang}`}
          onClick={() => setLanguage(lang)}
        >
          <span className="lang-dot" aria-hidden="true" />
          <span className="lang-long">{LANGUAGE_LABELS[lang]}</span>
          <span className="lang-short" aria-hidden="true">
            {lang === 'python' ? 'Py' : 'JS'}
          </span>
        </button>
      ))}
    </div>
  );
}

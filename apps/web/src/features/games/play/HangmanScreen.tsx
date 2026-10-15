import type { HangmanView } from './hangman';
import './HangmanScreen.css';

const MAX_HEARTS = 10;

/** Gallows parts, drawn in order as lives run out. */
const PARTS = [
  <circle key="head" cx="120" cy="58" r="13" />,
  <line key="body" x1="120" y1="71" x2="120" y2="110" />,
  <line key="arm-l" x1="120" y1="82" x2="102" y2="98" />,
  <line key="arm-r" x1="120" y1="82" x2="138" y2="98" />,
  <line key="leg-l" x1="120" y1="110" x2="104" y2="134" />,
  <line key="leg-r" x1="120" y1="110" x2="136" y2="134" />,
];

/** A game screen drawn entirely from what the learner's Hangman program printed. */
export function HangmanScreen({ view }: { view: HangmanView }) {
  const { tiles, startLives, guesses, outcome } = view;
  // The last "Lives: N" is printed before the final wrong guess: a lost game has none left.
  const lives = outcome === 'lose' ? 0 : view.lives;
  if (!tiles.length) return null;
  const share = startLives && lives !== undefined ? (startLives - lives) / startLives : 0;
  const lost = outcome === 'lose' ? PARTS.length : Math.min(PARTS.length, Math.max(0, Math.round(share * PARTS.length)));
  // Hearts are a picture, not a counter: cap them so a huge number can't flood the page.
  const hearts = Math.min(Math.max(startLives ?? 0, lives ?? 0), MAX_HEARTS);
  return (
    <div className={`hangman${outcome ? ` is-${outcome}` : ''}`} aria-label="Hangman board">
      <svg className="hangman-gallows" viewBox="0 0 170 160" role="img" aria-label={`${lost} of ${PARTS.length} parts drawn`}>
        <g className="hangman-frame">
          <line x1="20" y1="150" x2="150" y2="150" />
          <line x1="50" y1="150" x2="50" y2="20" />
          <line x1="50" y1="20" x2="120" y2="20" />
          <line x1="120" y1="20" x2="120" y2="45" />
        </g>
        <g className="hangman-figure">{PARTS.slice(0, lost)}</g>
      </svg>
      <div className="hangman-side">
        <div className="hangman-tiles" aria-label="The word">
          {tiles.map((t, i) => (
            <span key={i} className={`hangman-tile${t ? ' is-shown' : ''}`}>
              {t ?? ''}
            </span>
          ))}
        </div>
        {lives !== undefined && (
          <div className="hangman-lives" aria-label={`${lives} lives left`}>
            {Array.from({ length: hearts }, (_, i) => (
              <span key={i} className={i < lives ? 'is-full' : ''} aria-hidden="true">
                ♥
              </span>
            ))}
            {lives > MAX_HEARTS && <span className="hangman-lives-count">×{lives}</span>}
          </div>
        )}
        {guesses.length > 0 && (
          <div className="hangman-guesses" aria-label="Your guesses">
            {guesses.map((g) => (
              <span key={g.letter} className={g.hit ? 'is-hit' : 'is-miss'}>
                {g.letter}
              </span>
            ))}
          </div>
        )}
        {outcome && <p className="hangman-outcome">{outcome === 'win' ? 'You win! 🎉' : 'Out of lives!'}</p>}
      </div>
    </div>
  );
}

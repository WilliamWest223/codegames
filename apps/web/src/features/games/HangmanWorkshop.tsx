import { HANGMAN_WORDS, hangmanWithWords } from '@codegames/curriculum';
import type { PlayableLanguage } from '@codegames/shared';
import { CreatorWorkshop, sandboxLevel, type WorkshopConfig } from './CreatorWorkshop';

const DRAFT = 'hangman-word-builder';

/** Per-language names, so the help text matches the variables in the editor. */
const LIVES_NAME: Record<PlayableLanguage, string> = { python: 'start_lives', javascript: 'startLives' };

function config(language: PlayableLanguage): WorkshopConfig {
  return {
    draftKey: DRAFT,
    fileBase: 'my-words',
    starter: HANGMAN_WORDS,
    compose: hangmanWithWords,
    playLevel: sandboxLevel(DRAFT, 'boss-3', 'Your word list', HANGMAN_WORDS, {
      intro: 'The Hangman engine has secretly picked one of your words. Type one letter per guess!',
      renderer: 'hangman',
    }),
    back: { to: '/play/boss-3', label: 'Back to Hangman' },
    eyebrow: 'Word workshop',
    title: 'Make your own word list',
    lede: <>The Hangman engine is already built. Choose the words it picks from and how many lives players get, then play.</>,
    editorEyebrow: 'Data layer',
    editorTitle: 'Edit your words',
    editorHelp: (
      <>
        Add your own words to the <code>words</code> list (lowercase letters only, at least one word) and change{' '}
        <code>{LIVES_NAME[language]}</code>. Keep both names as they are: the engine reads them. Your list is saved on
        this device.
      </>
    ),
    editorLabel: 'Word list editor',
    playLabel: 'Play with your words',
    resetLabel: 'Reset words',
    playRegionLabel: 'Your Hangman game',
    emptyTitle: 'Your game is waiting',
    emptyText: <>Press <strong>Play with your words</strong> and the engine will pick one of them at random.</>,
  };
}

/** Post-boss-3 word workshop: the learner edits the word list and plays it with the Hangman engine. */
export function HangmanWorkshop({ language }: { language: PlayableLanguage }) {
  return <CreatorWorkshop language={language} config={config(language)} />;
}

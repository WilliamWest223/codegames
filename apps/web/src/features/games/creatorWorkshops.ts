import type { ComponentType } from 'react';
import type { PlayableLanguage } from '@codegames/shared';
import { AdventureWorkshop } from './AdventureWorkshop';
import { HangmanWorkshop } from './HangmanWorkshop';

/**
 * Post-boss creator workshops (not the robot-skins screen in `features/workshop/`). Each opens at
 * `/play/<boss>?mode=<mode>` once that boss is beaten in this language: `LevelScreen` guards the
 * route and `CompletionModal` links to it with `title` as the button label.
 */
export interface CreatorWorkshopEntry {
  mode: string;
  boss: string;
  bossTitle: string;
  title: string;
  goal: string;
  Screen: ComponentType<{ language: PlayableLanguage }>;
}

export const CREATOR_WORKSHOPS: readonly CreatorWorkshopEntry[] = [
  { mode: 'world', boss: 'boss-4', bossTitle: 'Text Adventure', title: 'Build your own world', goal: 'create a world of your own', Screen: AdventureWorkshop },
  { mode: 'words', boss: 'boss-3', bossTitle: 'Hangman', title: 'Make your own word list', goal: 'make a word list of your own', Screen: HangmanWorkshop },
];

/** The workshop a boss opens, if any. */
export function workshopForBoss(bossId: string): CreatorWorkshopEntry | undefined {
  return CREATOR_WORKSHOPS.find((w) => w.boss === bossId);
}

/** The workshop at `/play/<levelId>?mode=<mode>`, if that pair names one. */
export function workshopForRoute(levelId: string, mode: string | null): CreatorWorkshopEntry | undefined {
  return CREATOR_WORKSHOPS.find((w) => w.mode === mode && w.boss === levelId);
}

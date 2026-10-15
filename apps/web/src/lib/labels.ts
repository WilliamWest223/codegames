import type { MasteryLevel } from '@codegames/curriculum';
import type { GameType, LearningMode, LevelRole } from '@codegames/shared';

export const GAME_LABELS: Record<GameType, string> = {
  'grid-quest': 'Robot Quest',
  'predict-output': 'Predict the Output',
  parsons: 'Code Puzzle',
  'bug-hunt': 'Bug Hunt',
  'build-it': 'Build It',
  'speed-run': 'Speed Run',
};

export const GAME_ICONS: Record<GameType, string> = {
  'grid-quest': '◈',
  'predict-output': '◎',
  parsons: '⇅',
  'bug-hunt': '✱',
  'build-it': '▣',
  'speed-run': '⚡',
};

export const ROLE_LABELS: Record<LevelRole, string> = {
  intro: 'Intro',
  combine: 'Combine',
  integrate: 'Integrate',
  challenge: 'Challenge',
  boss: 'Boss',
};

export const MODE_LABELS: Record<LearningMode, string> = {
  blocks: 'Blocks',
  hybrid: 'Read code',
  parsons: 'Arrange lines',
  'fill-blanks': 'Fill the blanks',
  guided: 'Guided',
  freeform: 'Freeform',
};

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  locked: 'Locked',
  available: 'Ready to start',
  learned: 'Learned',
  practiced: 'Practiced',
  proficient: 'Proficient',
};

/** Plain-language explanations shown as tooltips and in the map legend. */
export const ROLE_HELP: Record<LevelRole, string> = {
  intro: 'Intro: meet a new idea on its own.',
  combine: 'Combine: use the new idea together with something you already know.',
  integrate: 'Integrate: mix the new idea with several earlier skills.',
  challenge: 'Challenge: an optional harder puzzle for extra practice.',
  boss: 'Boss: the region finale. Beat it to unlock the next region.',
};

export const MODE_HELP: Record<LearningMode, string> = {
  blocks: 'Snap blocks together.',
  hybrid: 'Read real code and predict what it prints.',
  parsons: 'Put scrambled lines of code in the right order.',
  'fill-blanks': 'Most of the code is written: fill in the ___ blanks.',
  guided: 'Write the code yourself, with hints and tests to guide you.',
  freeform: 'Write it from scratch, with fewer hints.',
};

export const MASTERY_HELP: Record<MasteryLevel, string> = {
  locked: 'Finish the concepts before it to unlock.',
  available: 'Unlocked and ready to play.',
  learned: 'You finished the intro level.',
  practiced: 'You finished its Intro, Combine and Integrate levels.',
  proficient: 'Practiced, and you used it 3+ more times in later levels or warm-ups.',
};

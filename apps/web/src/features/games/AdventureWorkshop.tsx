import { ADVENTURE_WORLD, adventureWithWorld } from '@codegames/curriculum';
import type { PlayableLanguage } from '@codegames/shared';
import { CreatorWorkshop, sandboxLevel, type WorkshopConfig } from './CreatorWorkshop';

const DRAFT = 'adventure-world-builder';

const CONFIG: WorkshopConfig = {
  draftKey: DRAFT,
  fileBase: 'my-world',
  starter: ADVENTURE_WORLD,
  compose: adventureWithWorld,
  playLevel: sandboxLevel(DRAFT, 'boss-4', 'Your world', ADVENTURE_WORLD, {
    intro: 'Your world data is running the Text Adventure engine. Try `look`, `go DIR`, `take ITEM`, `inventory`, or `quit`.',
    renderer: 'adventure',
  }),
  back: { to: '/play/boss-4', label: 'Back to Text Adventure' },
  eyebrow: 'World builder',
  title: 'Build your own world',
  lede: <>The player engine is already built. Change the <code>rooms</code> data, then play your world immediately.</>,
  editorEyebrow: 'Data layer',
  editorTitle: 'Edit your rooms',
  editorHelp: (
    <>
      Add a room, change an exit, or move an item. Keep the top-level variable named <code>rooms</code>,
      keep a room called <code>hall</code> (the player starts there), and hide a <code>crown</code> somewhere:
      taking it wins the game. Your draft is saved on this device.
    </>
  ),
  editorLabel: 'World data editor',
  playLabel: 'Play your world',
  resetLabel: 'Reset world',
  playRegionLabel: 'Your world',
  emptyTitle: 'Your world is waiting',
  emptyText: <>When you are ready, press <strong>Play your world</strong> to launch the same engine with your room data.</>,
};

/** Post-boss-4 world builder: the learner edits `rooms` and plays it with the adventure engine. */
export function AdventureWorkshop({ language }: { language: PlayableLanguage }) {
  return <CreatorWorkshop language={language} config={CONFIG} />;
}

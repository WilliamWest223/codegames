/** What XP and stars are *for*: rank titles, and robot skins unlocked by stars. */

export interface Rank {
  title: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { title: 'Rookie', minXp: 0 },
  { title: 'Apprentice', minXp: 100 },
  { title: 'Coder', minXp: 300 },
  { title: 'Engineer', minXp: 600 },
  { title: 'Hacker', minXp: 1000 },
  { title: 'Code Wizard', minXp: 1500 },
  // Region 3 and a second language (round-4 audit: rewards ran out before Region 3).
  { title: 'Architect', minXp: 1850 },
  { title: 'Modeler', minXp: 2400 },
  { title: 'Grandmaster', minXp: 3000 },
  { title: 'Legend', minXp: 3800 },
];

export function rankFor(xp: number): { rank: Rank; next?: Rank } {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.minXp) index = i;
  });
  return { rank: RANKS[index]!, next: RANKS[index + 1] };
}

export interface Skin {
  id: string;
  name: string;
  /** Robot body color. */
  color: string;
  /** Total stars (across all languages) needed to unlock. */
  stars: number;
}

export const SKINS: Skin[] = [
  { id: 'mint', name: 'Mint', color: '#5ef2b8', stars: 0 },
  { id: 'sky', name: 'Sky', color: '#7cc4ff', stars: 15 },
  { id: 'sunset', name: 'Sunset', color: '#ffb547', stars: 40 },
  { id: 'berry', name: 'Berry', color: '#ff7ab6', stars: 75 },
  { id: 'violet', name: 'Violet', color: '#c792ff', stars: 120 },
  { id: 'gold', name: 'Gold', color: '#ffd700', stars: 200 },
  { id: 'ocean', name: 'Ocean', color: '#3fd0d4', stars: 270 },
  { id: 'ember', name: 'Ember', color: '#ff6b4a', stars: 340 },
  { id: 'prism', name: 'Prism', color: '#a8ff60', stars: 450 },
  { id: 'obsidian', name: 'Obsidian', color: '#8a8fa8', stars: 600 },
];

export function skinById(id: string | undefined): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]!;
}

/**
 * Belts: the headline progression (docs/PEDAGOGY_PLAN.md). Levels and mastery move learning;
 * points mostly don't, so a belt is earned only by beating bosses: unscaffolded checkpoints.
 * Each boss inside a belt adds a stripe. Tiers follow the owner's topic map
 * (docs/research/topic-map-and-gamification.md): Yellow covers functions, lists and
 * dictionaries (Regions 3–4); Orange starts with Region 5.
 */
export interface Belt {
  id: string;
  name: string;
  /** Bosses that earn this belt; each one beaten is a stripe. */
  bosses: string[];
  /** What a learner with this belt can do (shown when earned). */
  canDo: string;
}

export const BELTS: Belt[] = [
  { id: 'white', name: 'White belt', bosses: ['boss-0', 'boss-1', 'boss-2'], canDo: 'You can write programs that store data, make decisions and repeat themselves.' },
  { id: 'yellow', name: 'Yellow belt', bosses: ['boss-3', 'boss-4'], canDo: 'You can split a program into functions, work with lists (arrays) and dictionaries (objects), handle errors, and model things with your own classes.' },
  { id: 'orange', name: 'Orange belt', bosses: ['boss-5'], canDo: 'You can pass functions around, recurse through nested data, and build families of classes.' },
  { id: 'green', name: 'Green belt', bosses: ['boss-6'], canDo: 'You can count the steps an algorithm takes, search and sort by hand, and pick a stack, queue, set or linked list for the job.' },
  { id: 'blue', name: 'Blue belt', bosses: ['boss-7'], canDo: 'You can build trees and graphs, find shortest paths, and solve problems by trying everything, remembering answers, or being greedy.' },
];

export interface BeltProgress {
  /** The highest belt fully earned, if any. */
  earned?: Belt;
  /** The belt being worked on now (undefined once every belt is earned). */
  working?: Belt;
  /** Stripes (bosses beaten) on the belt being worked on. */
  stripes: number;
}

/**
 * Belt progress from the set of completed level ids (boss levels share their concept's id).
 * `best` is a belt the learner already reached (e.g. under older tiers, see `legacyBelt`): a
 * belt is never shown lower than that, and work continues on the belt after it.
 */
export function beltProgress(completed: ReadonlySet<string>, best?: string): BeltProgress {
  let earned: Belt | undefined;
  let progress: BeltProgress | undefined;
  for (const belt of BELTS) {
    const beaten = belt.bosses.filter((b) => completed.has(b)).length;
    if (beaten === belt.bosses.length) {
      earned = belt;
      continue;
    }
    progress = { earned, working: belt, stripes: beaten };
    break;
  }
  const result = progress ?? { earned, stripes: 0 };
  const bestIndex = BELTS.findIndex((b) => b.id === best);
  const earnedId = result.earned?.id;
  if (bestIndex <= BELTS.findIndex((b) => b.id === earnedId)) return result;
  const working = BELTS[bestIndex + 1];
  return { earned: BELTS[bestIndex], working, stripes: working ? working.bosses.filter((b) => completed.has(b)).length : 0 };
}

/**
 * The belt these completions earned under the original tiers (before Region 5: White = bosses
 * 0–2, Yellow = boss-3, Orange = boss-4). Saved once as the learner's best belt when progress
 * is migrated, so the retier never takes a belt away (round-8 P1-3).
 */
export function legacyBelt(completed: ReadonlySet<string>): string | undefined {
  if (!['boss-0', 'boss-1', 'boss-2'].every((b) => completed.has(b))) return undefined;
  if (!completed.has('boss-3')) return 'white';
  return completed.has('boss-4') ? 'orange' : 'yellow';
}

/**
 * The story wrapper: the robot crash-landed and each region restores one ship system.
 * Light on purpose; the code is still the game.
 */
export const REGION_STORY: Record<number, { system: string; beat: string }> = {
  0: { system: 'Motors', beat: 'The robot crash-landed. Teach it to move so it can reach the ship.' },
  1: { system: 'Memory banks', beat: 'The ship\'s computer forgot everything. Give it values to remember.' },
  2: { system: 'Navigation', beat: 'The autopilot can\'t decide. Teach it to choose and to repeat.' },
  3: { system: 'Engine room', beat: 'The engines need reusable parts: functions, lists and error checks.' },
  4: { system: 'Crew quarters', beat: 'Model the crew and cargo with your own dictionaries and classes.' },
  5: { system: 'Hyperdrive', beat: 'Mines block the jump path. Pass functions around, recurse through nested data and build families of classes to clear them.' },
  6: { system: 'Flight computer', beat: 'The computer is too slow to fly. Count its steps, then search, sort and look things up the fast way.' },
  7: { system: 'Star charts', beat: 'The charts are a tangle of routes and costs. Build trees and graphs, and find the cheapest way home.' },
  8: { system: 'Ship display', beat: 'The bridge screen is blank. Build its pages, buttons and forms with the DOM.' },
  10: { system: 'Security systems', beat: 'Someone has been probing the ship\'s systems. Lock them down.' },
};

/**
 * The security side quest's boss. It is never in `BELTS` (belts are sequential, so that would
 * make an optional branch mandatory); beating it adds a separate patch to the belt card.
 */
export const SECURITY_PATCH = { boss: 'boss-security', name: 'Security patch', canDo: 'You can store passwords safely, validate input, and explain why toy ciphers are not real security.' };

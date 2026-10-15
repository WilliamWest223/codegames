/** What the adventure screen shows, read from the learner's own program output. */
export interface AdventureView {
  room?: string;
  exits: string[];
  items: string[];
  /** Rooms seen so far, in the order the player first entered them. */
  explored: string[];
  inventory: string[];
  /** The latest refusal or message that isn't a room description. */
  message?: string;
  won: boolean;
}

const ROOM = /^You are in the (.+?)\. Exits: (.*?)\. Items: (.*)$/;
const list = (text: string) => (text.trim() === 'none' || text.trim() === 'nothing' ? [] : text.split(',').map((s) => s.trim()).filter(Boolean));

export function readAdventure(stdout: string): AdventureView {
  const view: AdventureView = { exits: [], items: [], explored: [], inventory: [], won: false };
  for (const raw of stdout.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const room = line.match(ROOM);
    if (room) {
      view.room = room[1]!;
      view.exits = list(room[2]!);
      view.items = list(room[3]!);
      if (!view.explored.includes(view.room)) view.explored.push(view.room);
      view.message = undefined;
      continue;
    }
    const taken = line.match(/^Taken: (.+)$/);
    if (taken) {
      if (!view.inventory.includes(taken[1]!)) view.inventory.push(taken[1]!);
      view.items = view.items.filter((i) => i !== taken[1]);
      view.message = line;
      continue;
    }
    const carry = line.match(/^You carry: (.*)$/);
    if (carry) {
      view.inventory = list(carry[1]!);
      continue;
    }
    if (/^You win/i.test(line)) view.won = true;
    view.message = line;
  }
  return view;
}

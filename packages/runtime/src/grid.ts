import type { GridSpec } from '@codegames/shared';

/**
 * Robot world for grid-quest levels.
 *
 * Legend for `GridSpec.rows`:
 *   `#` wall   `.` floor   `G` gem   `F` flag (goal tile)
 *   `>` `<` `^` `v` robot start, facing east / west / north / south
 */
export type Direction = 'N' | 'E' | 'S' | 'W';

export interface RobotState {
  x: number;
  y: number;
  dir: Direction;
}

/** `line` is the learner's source line that issued the command, for highlighting. */
export type GridAction =
  | { type: 'move'; robot: RobotState; line?: number }
  | { type: 'turn'; robot: RobotState; line?: number }
  | { type: 'collect'; robot: RobotState; gem: [number, number]; line?: number };

export interface GridOutcome {
  actions: GridAction[];
  success: boolean;
  /** Learner-facing explanation of why the level wasn't won. */
  reason?: string;
  gemsCollected: number;
  totalGems: number;
}

/** Thrown to stop learner code when the robot does something impossible. */
export class GridError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GridError';
  }
}

const DIRS: Direction[] = ['N', 'E', 'S', 'W'];
const DELTA: Record<Direction, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const START: Record<string, Direction> = { '^': 'N', '>': 'E', v: 'S', '<': 'W' };

export const MAX_GRID_ACTIONS = 500;

export interface ParsedGrid {
  width: number;
  height: number;
  walls: Set<string>;
  gems: Set<string>;
  flag?: [number, number];
  start: RobotState;
}

const key = (x: number, y: number) => `${x},${y}`;

export function parseGrid(spec: GridSpec): ParsedGrid {
  const walls = new Set<string>();
  const gems = new Set<string>();
  let flag: [number, number] | undefined;
  let start: RobotState | undefined;
  spec.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') walls.add(key(x, y));
      else if (ch === 'G') gems.add(key(x, y));
      else if (ch === 'F') flag = [x, y];
      else if (ch in START) start = { x, y, dir: START[ch]! };
    });
  });
  if (!start) throw new Error('Grid has no robot start (> < ^ v)');
  return {
    width: Math.max(...spec.rows.map((r) => r.length)),
    height: spec.rows.length,
    walls,
    gems,
    flag,
    start,
  };
}

/** Mutable simulation driven by the learner's robot commands. */
export class GridWorld {
  readonly grid: ParsedGrid;
  robot: RobotState;
  readonly gemsLeft: Set<string>;
  readonly actions: GridAction[] = [];

  constructor(spec: GridSpec) {
    this.grid = parseGrid(spec);
    this.robot = { ...this.grid.start };
    this.gemsLeft = new Set(this.grid.gems);
  }

  private record(action: GridAction) {
    if (this.actions.length >= MAX_GRID_ACTIONS) {
      throw new GridError(`The robot ran out of energy after ${MAX_GRID_ACTIONS} actions. Is there an infinite loop?`);
    }
    this.actions.push(action);
  }

  private ahead(): [number, number] {
    const [dx, dy] = DELTA[this.robot.dir];
    return [this.robot.x + dx, this.robot.y + dy];
  }

  private isOpen(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.grid.width && y < this.grid.height && !this.grid.walls.has(key(x, y));
  }

  move = (line?: number): void => {
    const [x, y] = this.ahead();
    if (!this.isOpen(x, y)) throw new GridError('Bonk! The robot walked into a wall.');
    this.robot = { ...this.robot, x, y };
    this.record({ type: 'move', robot: { ...this.robot }, line });
  };

  turnLeft = (line?: number): void => {
    this.robot = { ...this.robot, dir: DIRS[(DIRS.indexOf(this.robot.dir) + 3) % 4]! };
    this.record({ type: 'turn', robot: { ...this.robot }, line });
  };

  collect = (line?: number): void => {
    const k = key(this.robot.x, this.robot.y);
    if (!this.gemsLeft.has(k)) throw new GridError("There's no gem here to collect.");
    this.gemsLeft.delete(k);
    this.record({ type: 'collect', robot: { ...this.robot }, gem: [this.robot.x, this.robot.y], line });
  };

  isBlocked = (): boolean => {
    const [x, y] = this.ahead();
    return !this.isOpen(x, y);
  };

  onGem = (): boolean => this.gemsLeft.has(key(this.robot.x, this.robot.y));

  atFlag = (): boolean =>
    !!this.grid.flag && this.grid.flag[0] === this.robot.x && this.grid.flag[1] === this.robot.y;

  outcome(error?: string): GridOutcome {
    const totalGems = this.grid.gems.size;
    const gemsCollected = totalGems - this.gemsLeft.size;
    let reason = error;
    if (!reason && this.gemsLeft.size > 0) {
      reason = `Collected ${gemsCollected} of ${totalGems} gems.`;
    } else if (!reason && this.grid.flag && !this.atFlag()) {
      reason = "The robot didn't finish on the flag.";
    }
    return { actions: this.actions, success: !reason, reason, gemsCollected, totalGems };
  }
}

/**
 * Robot commands as exposed to learner code. JavaScript uses camelCase,
 * Python uses snake_case. There is deliberately no turnRight: learners build
 * it from three left turns in the custom-commands concept and reuse it later.
 */
export const GRID_API = {
  javascript: ['move', 'turnLeft', 'collect', 'isBlocked', 'onGem', 'atFlag'],
  python: ['move', 'turn_left', 'collect', 'is_blocked', 'on_gem', 'at_flag'],
} as const;

/** JavaScript bindings. `currentLine` reports which learner line is calling. */
export function gridBindings(world: GridWorld, currentLine: () => number | undefined = () => undefined): Record<string, (...args: never[]) => unknown> {
  const noArgs = (name: string, fn: () => void) =>
    (...args: unknown[]) => {
      if (args.length > 0) throw new GridError(`${name}() doesn't take anything inside its brackets. To repeat it, call it again or use a loop.`);
      fn();
    };
  return {
    move: noArgs('move', () => world.move(currentLine())),
    turnLeft: noArgs('turnLeft', () => world.turnLeft(currentLine())),
    collect: noArgs('collect', () => world.collect(currentLine())),
    isBlocked: world.isBlocked,
    onGem: world.onGem,
    atFlag: world.atFlag,
  };
}

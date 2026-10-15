import { useEffect, useMemo, useRef, useState } from 'react';
import { parseGrid, type GridAction, type RobotState } from '@codegames/runtime';
import type { GridSpec } from '@codegames/shared';
import { skinById } from '../workshop/rewards';
import { useProgress } from '../progress/store';
import './GridBoard.css';

const GAP = 3;
const ROTATION: Record<RobotState['dir'], number> = { N: -90, E: 0, S: 90, W: 180 };
const DIR_WORDS: Record<RobotState['dir'], string> = { N: 'up', E: 'right', S: 'down', W: 'left' };

interface Props {
  spec: GridSpec;
  /** Actions to replay. Changing `runId` restarts the animation. */
  actions: GridAction[];
  runId: number;
  /** Final status shown when the replay ends. */
  status?: { success: boolean; message: string };
  speedMs?: number;
  label?: string;
  /** Called with the action just shown (or undefined at the start), e.g. to highlight its line. */
  onFrame?: (action: GridAction | undefined) => void;
  /** Show pause/step/replay controls. */
  controls?: boolean;
  /** Called once per run when the replay reaches the last step. */
  onFinished?: () => void;
}

/** Replays a robot run step by step on the grid, with pause / step / replay. */
export function GridBoard({ spec, actions, runId, status, speedMs = 260, label, onFrame, controls = true, onFinished }: Props) {
  const grid = useMemo(() => parseGrid(spec), [spec]);
  const skin = skinById(useProgress((s) => s.skin));
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Restart on every new run.
  useEffect(() => {
    setFrame(0);
    setPlaying(actions.length > 0);
  }, [runId, actions]);

  useEffect(() => {
    if (!playing) return;
    if (frame >= actions.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setFrame((f) => f + 1), speedMs);
    return () => clearTimeout(timer);
  }, [playing, frame, actions.length, speedMs]);

  // `frame` can briefly exceed a new, shorter run (e.g. after Reset clears the actions)
  // before the restart effect runs; clamp so rendering never reads past the end.
  const shown = Math.min(frame, actions.length);

  useEffect(() => {
    onFrame?.(shown === 0 ? undefined : actions[shown - 1]);
  }, [shown, actions, onFrame]);

  const finishedRun = useRef(-1);
  useEffect(() => {
    if (actions.length > 0 && shown >= actions.length && finishedRun.current !== runId) {
      finishedRun.current = runId;
      onFinished?.();
    }
  }, [shown, actions.length, runId, onFinished]);

  const robot = shown === 0 ? grid.start : actions[shown - 1]!.robot;
  const collected = new Set(actions.slice(0, shown).flatMap((a) => (a.type === 'collect' ? [`${a.gem[0]},${a.gem[1]}`] : [])));
  const finished = shown >= actions.length;
  const cells = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const k = `${x},${y}`;
      const wall = grid.walls.has(k) || x >= (spec.rows[y]?.length ?? 0);
      const gem = grid.gems.has(k) && !collected.has(k);
      const flag = grid.flag && grid.flag[0] === x && grid.flag[1] === y;
      cells.push(
        <div key={k} className={`tile${wall ? ' tile-wall' : ''}`}>
          {gem && <span className="tile-gem" />}
          {flag && <span className="tile-flag">⚑</span>}
        </div>,
      );
    }
  }
  const gemsLeft = [...grid.gems].filter((k) => !collected.has(k)).length;
  const description = `Robot at column ${robot.x}, row ${robot.y}, facing ${DIR_WORDS[robot.dir]}. ${gemsLeft} gem${gemsLeft === 1 ? '' : 's'} left${grid.flag ? `; flag at column ${grid.flag[0]}, row ${grid.flag[1]}` : ''}.`;

  return (
    <figure className="board" aria-label={label ?? 'Robot world'} style={{ '--robot': skin.color } as React.CSSProperties}>
      <div
        className="board-grid"
        aria-hidden="true"
        style={{
          gridTemplateColumns: `repeat(${grid.width}, 1fr)`,
          aspectRatio: `${grid.width} / ${grid.height}`,
          // Cap the width by the height limit so tiles stay square on wide screens.
          maxWidth: `calc(420px * ${grid.width} / ${grid.height})`,
        }}
      >
        {cells}
        <div
          className="robot"
          style={{
            // Size the robot to one tile and step by tile + gap.
            width: `calc((100% - ${GAP * (grid.width - 1)}px) / ${grid.width})`,
            height: `calc((100% - ${GAP * (grid.height - 1)}px) / ${grid.height})`,
            transform: `translate(calc(${robot.x} * (100% + ${GAP}px)), calc(${robot.y} * (100% + ${GAP}px)))`,
            transitionDuration: `${speedMs * 0.9}ms`,
          }}
        >
          <svg viewBox="0 0 40 40" style={{ transform: `rotate(${ROTATION[robot.dir]}deg)`, transitionDuration: `${speedMs * 0.9}ms` }}>
            <rect x="7" y="9" width="24" height="22" rx="7" className="robot-body" />
            <circle cx="24" cy="16" r="2.6" className="robot-eye" />
            <circle cx="24" cy="24" r="2.6" className="robot-eye" />
            <path d="M31 14 L37 20 L31 26 Z" className="robot-nose" />
          </svg>
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {playing ? '' : description}
      </p>
      <figcaption className="board-caption">
        <span>
          <span className="tile-gem tile-gem-inline" aria-hidden="true" /> {gemsLeft} gem{gemsLeft === 1 ? '' : 's'} left
          {actions.length > 0 && (
            <span className="board-step">
              {' '}
              · step {shown}/{actions.length}
            </span>
          )}
        </span>
        {finished && status && <span className={status.success ? 'board-ok' : 'board-bad'}>{status.message}</span>}
      </figcaption>
      {controls && actions.length > 0 && (
        <div className="board-controls">
          {finished ? (
            <button className="btn btn-sm btn-ghost" onClick={() => { setFrame(0); setPlaying(true); }}>
              ↻ Replay
            </button>
          ) : (
            <button className="btn btn-sm btn-ghost" onClick={() => setPlaying((p) => !p)}>
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => { setPlaying(false); setFrame(Math.max(0, shown - 1)); }} disabled={shown === 0} aria-label="Step back">
            ⏮
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => { setPlaying(false); setFrame((f) => Math.min(actions.length, f + 1)); }} disabled={finished} aria-label="Step forward">
            ⏭ Step
          </button>
        </div>
      )}
    </figure>
  );
}

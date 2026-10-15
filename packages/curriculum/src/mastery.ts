import type { Concept, Level } from '@codegames/shared';

/**
 * Mastery levels from docs/concept-ideas.md §8.5 (V1 implements the first four).
 * - locked: some required concept isn't practiced yet
 * - available: unlocked, no levels finished
 * - learned: intro finished
 * - practiced: every intro/combine/integrate (or boss) level finished
 * - proficient: practiced, and used 3+ times since: reinforced by levels of other concepts
 *   finished without help, or recalled in warm-up reviews
 */
export type MasteryLevel = 'locked' | 'available' | 'learned' | 'practiced' | 'proficient';

export const MASTERY_ORDER: MasteryLevel[] = ['locked', 'available', 'learned', 'practiced', 'proficient'];

export const PROFICIENT_USES = 3;

export function atLeast(level: MasteryLevel, min: MasteryLevel): boolean {
  return MASTERY_ORDER.indexOf(level) >= MASTERY_ORDER.indexOf(min);
}

/** Levels that must be done for a concept to count as practiced. */
export function coreLevels(conceptId: string, levels: Level[]): Level[] {
  return levels.filter((l) => l.conceptId === conceptId && l.role !== 'challenge');
}

/**
 * Compute every concept's mastery from the set of completed level ids.
 * Concepts are processed in an order where requirements come first.
 */
export function computeMastery(
  concepts: Concept[],
  levels: Level[],
  completed: ReadonlySet<string>,
  /** Completed warm-up reviews per concept; each counts as one use toward proficient. */
  reviews: Readonly<Record<string, number>> = {},
  /**
   * Concepts already practiced in another language. They satisfy prerequisites here too,
   * so switching languages doesn't relock the map (docs/concept-ideas.md §8.6); the
   * concept's own levels still have to be played in this language.
   */
  transfer: ReadonlySet<string> = new Set(),
  /**
   * Completed levels solved with help (fewer than 3 stars). They still count as done, but
   * not as uses toward proficient: proficiency has to come from unassisted solves.
   */
  assisted: ReadonlySet<string> = new Set(),
): Record<string, MasteryLevel> {
  const result: Record<string, MasteryLevel> = {};
  const uses: Record<string, number> = { ...reviews };
  for (const level of levels) {
    if (!completed.has(level.id) || assisted.has(level.id)) continue;
    for (const id of level.reinforces) uses[id] = (uses[id] ?? 0) + 1;
  }

  const byId = new Map(concepts.map((c) => [c.id, c]));
  const visit = (concept: Concept): MasteryLevel => {
    const cached = result[concept.id];
    if (cached) return cached;
    const unlocked = concept.requires.every((id) => {
      const req = byId.get(id);
      return req ? transfer.has(id) || atLeast(visit(req), 'practiced') : false;
    });
    let level: MasteryLevel = 'locked';
    if (unlocked && !concept.comingSoon) {
      const core = coreLevels(concept.id, levels);
      const intro = core.find((l) => l.role === 'intro' || l.role === 'boss');
      const done = core.filter((l) => completed.has(l.id)).length;
      if (core.length > 0 && done === core.length) {
        level = (uses[concept.id] ?? 0) >= PROFICIENT_USES ? 'proficient' : 'practiced';
      } else if (intro && completed.has(intro.id)) {
        level = 'learned';
      } else {
        level = 'available';
      }
    }
    result[concept.id] = level;
    return level;
  };
  concepts.forEach(visit);
  return result;
}

/** All concepts that must come before `conceptId` (transitive `requires`). */
export function ancestors(conceptId: string, concepts: Concept[]): Set<string> {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const out = new Set<string>();
  const stack = [...(byId.get(conceptId)?.requires ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id)) continue;
    out.add(id);
    stack.push(...(byId.get(id)?.requires ?? []));
  }
  return out;
}

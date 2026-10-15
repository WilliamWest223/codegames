import { describe, expect, it } from 'vitest';
import { PLAYABLE_LANGUAGES, levelLanguages, type Level } from '@codegames/shared';
import { parseGrid, parsonsLines } from '@codegames/runtime';
import { ancestors, conceptLanguages, concepts, levels, localize } from '../src';

const conceptById = new Map(concepts.map((c) => [c.id, c]));
const playable = concepts.filter((c) => !c.comingSoon);

/** Minimum reinforced concepts for integrate/challenge levels, by region (docs/concept-ideas.md §8.1). */
function regionMinimum(region: number): number {
  if (region === 0) return 0;
  if (region <= 2) return 2;
  if (region <= 4) return 3;
  if (region <= 7) return 4;
  return 5;
}

/** Earlier regions a level must draw from (§8.1). */
function earlierRegionsRequired(region: number): number {
  if (region === 0) return 0;
  if (region <= 2) return 1;
  if (region <= 4) return 2;
  return 3;
}

describe('concept graph', () => {
  it('has unique ids', () => {
    expect(new Set(concepts.map((c) => c.id)).size).toBe(concepts.length);
  });

  it('only requires concepts that exist, in the same or an earlier region', () => {
    for (const c of concepts) {
      for (const id of c.requires) {
        const req = conceptById.get(id);
        expect(req, `${c.id} requires missing ${id}`).toBeDefined();
        expect(req!.region, `${c.id} requires later-region ${id}`).toBeLessThanOrEqual(c.region);
      }
    }
  });

  it('has no cycles', () => {
    for (const c of concepts) expect(ancestors(c.id, concepts).has(c.id), `cycle through ${c.id}`).toBe(false);
  });

  it('gates every region behind the previous boss', () => {
    // Side quests are gated by their own `requires`, not by region order.
    for (const c of concepts.filter((c) => c.region > 0 && !c.sideQuest)) {
      const previousBoss = concepts.find((b) => b.boss && b.region === c.region - 1);
      if (!previousBoss) continue;
      expect(ancestors(c.id, concepts).has(previousBoss.id), `${c.id} should come after ${previousBoss.id}`).toBe(true);
    }
  });

  it('makes each boss require every other concept in its region', () => {
    for (const boss of concepts.filter((c) => c.boss)) {
      const before = ancestors(boss.id, concepts);
      for (const c of concepts.filter((c) => c.region === boss.region && !c.boss && !c.comingSoon)) {
        expect(before.has(c.id), `${boss.id} should require ${c.id}`).toBe(true);
      }
    }
  });

  it('keeps side quests optional', () => {
    for (const c of concepts.filter((c) => !c.sideQuest)) {
      for (const a of ancestors(c.id, concepts)) {
        expect(conceptById.get(a)?.sideQuest, `${c.id} depends on side quest ${a}`).toBeFalsy();
      }
    }
  });

  it('keeps side quests in their own regions', () => {
    const sideRegions = new Set(concepts.filter((c) => c.sideQuest).map((c) => c.region));
    for (const c of concepts.filter((c) => !c.sideQuest)) expect(sideRegions.has(c.region), `${c.id} shares a side-quest region`).toBe(false);
  });
  it('gives every playable non-boss concept a "you can now" statement', () => {
    for (const c of playable.filter((c) => !c.boss)) expect(c.canDo?.trim(), `${c.id} needs canDo`).toBeTruthy();
  });
});

describe('levels', () => {
  it('are named <conceptId>-<n> (bosses: the boss concept id)', () => {
    for (const l of levels) {
      if (l.role === 'boss') expect(l.id).toBe(l.conceptId);
      else expect(l.id, l.id).toMatch(new RegExp(`^${l.conceptId}-\\d+$`));
    }
  });

  it('have unique ids and known concepts', () => {
    expect(new Set(levels.map((l) => l.id)).size).toBe(levels.length);
    for (const l of levels) expect(conceptById.has(l.conceptId), l.id).toBe(true);
  });

  it('cover every playable concept with intro, combine, integrate (or one boss level)', () => {
    for (const c of playable) {
      const roles = levels.filter((l) => l.conceptId === c.id).map((l) => l.role);
      if (c.boss) expect(roles, c.id).toEqual(['boss']);
      else {
        expect(roles[0], `${c.id} should start with an intro`).toBe('intro');
        for (const role of ['intro', 'combine', 'integrate'] as const) expect(roles, `${c.id} needs ${role}`).toContain(role);
      }
    }
  });

  it('are available in every language their concept allows', () => {
    for (const l of levels) {
      const allowed = conceptLanguages(conceptById.get(l.conceptId)!);
      for (const lang of PLAYABLE_LANGUAGES) {
        if (allowed.includes(lang)) expect(levelLanguages(l), `${l.id} missing ${lang}`).toContain(lang);
        else expect(levelLanguages(l), `${l.id} should not exist in ${lang}`).not.toContain(lang);
      }
    }
  });

  it('keep language-restricted concepts in side quests only', () => {
    for (const c of concepts.filter((c) => c.languages)) expect(c.sideQuest, `${c.id} restricts languages but is on the main path`).toBe(true);
  });

  it('give Web Pages levels a starting page', () => {
    for (const l of levels.filter((l) => conceptById.get(l.conceptId)!.region === 8)) {
      expect(l.game === 'build-it' || l.game === 'bug-hunt', `${l.id} must be a code level`).toBe(true);
      if (l.game === 'build-it' || l.game === 'bug-hunt') {
        expect(l.page?.trim(), `${l.id} needs page HTML`).toBeTruthy();
        expect(l.play?.renderer, `${l.id} should play as a page`).toBe('page');
        for (const t of l.tests) expect(t.harness?.javascript, `${l.id}: ${t.name} must grade through render()`).toContain('render()');
      }
    }
  });

  it('have hints', () => {
    for (const l of levels) expect(l.hints.length, l.id).toBeGreaterThan(0);
  });

  it('resolve every language token', () => {
    for (const l of levels) {
      for (const lang of PLAYABLE_LANGUAGES) {
        const text = [l.prompt, ...l.hints, l.takeaway ?? ''].map((t) => localize(t, lang)).join('\n');
        expect(text, `${l.id} (${lang})`).not.toMatch(/\{\{(py|js):/);
      }
    }
  });

  it('use valid grids', () => {
    for (const l of levels) {
      const grids = l.game === 'grid-quest' ? [l.grid, ...(l.extraGrids ?? [])] : l.game === 'parsons' && l.grid ? [l.grid] : [];
      for (const g of grids) expect(() => parseGrid(g), l.id).not.toThrow();
    }
  });

  it('keep Parsons distractors distinct from solution lines', () => {
    for (const l of levels.filter((l): l is Extract<Level, { game: 'parsons' }> => l.game === 'parsons')) {
      for (const lang of levelLanguages(l)) {
        const solutionLines = parsonsLines(l.solution[lang]!);
        for (const d of l.distractors?.[lang] ?? []) expect(solutionLines, `${l.id}: ${d}`).not.toContain(d);
      }
    }
  });
});

describe('mastery rules (docs/concept-ideas.md §8.1)', () => {
  for (const l of levels) {
    const concept = conceptById.get(l.conceptId)!;
    const before = ancestors(concept.id, concepts);
    const earlierRegions = new Set(l.reinforces.map((id) => conceptById.get(id)?.region).filter((r) => r! < concept.region));

    it(`${l.id} reinforces only earlier concepts`, () => {
      for (const id of l.reinforces) expect(before.has(id), `${l.id} reinforces ${id}, which isn't a prerequisite`).toBe(true);
    });

    if (l.role === 'combine' && concept.region > 0) {
      it(`${l.id} (combine) reinforces at least one concept`, () => {
        expect(l.reinforces.length).toBeGreaterThanOrEqual(1);
      });
    }

    if (l.role === 'integrate' || l.role === 'challenge') {
      it(`${l.id} (${l.role}) meets the region minimum`, () => {
        expect(l.reinforces.length).toBeGreaterThanOrEqual(regionMinimum(concept.region));
        expect(earlierRegions.size).toBeGreaterThanOrEqual(earlierRegionsRequired(concept.region));
      });
    }

    if (l.role === 'boss') {
      it(`${l.id} (boss) combines its region with older ones`, () => {
        const sameRegion = l.reinforces.filter((id) => conceptById.get(id)?.region === concept.region);
        expect(sameRegion.length).toBeGreaterThanOrEqual(Math.min(3, playable.filter((c) => c.region === concept.region && !c.boss).length));
        expect(l.reinforces.length).toBeGreaterThanOrEqual(Math.max(3, regionMinimum(concept.region)));
        expect(earlierRegions.size).toBeGreaterThanOrEqual(earlierRegionsRequired(concept.region));
      });
    }
  }
});

describe('teaching quality (round-1 teacher audit)', () => {
  it('every level has a hint ladder of at least 2 steps', () => {
    expect(levels.filter((l) => l.hints.length < 2).map((l) => l.id)).toEqual([]);
  });

  it('intro and boss levels end with a takeaway', () => {
    const missing = levels
      .filter((l) => l.role === 'intro' || l.role === 'boss')
      .filter((l) => PLAYABLE_LANGUAGES.some((lang) => !localize(l.takeaway ?? '', lang).trim()))
      .map((l) => l.id);
    expect(missing).toEqual([]);
  });

  it('robot levels from Repeat onward cannot be solved by hard-coding a path', () => {
    const repeatAndLater = new Set(concepts.filter((c) => c.id === 'repeat' || ancestors(c.id, concepts).has('repeat')).map((c) => c.id));
    const unguarded = levels
      .filter((l) => l.game === 'grid-quest' && repeatAndLater.has(l.conceptId))
      .filter((l) => l.game === 'grid-quest' && !(l.extraGrids?.length ?? 0) && !PLAYABLE_LANGUAGES.every((lang) => (l.requirements?.[lang] ?? []).some((r) => r.forbid)))
      .map((l) => l.id);
    expect(unguarded).toEqual([]);
  });
});

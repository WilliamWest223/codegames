import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { PLAYABLE_LANGUAGES, type PlayableLanguage } from '@codegames/shared';
import { BELTS, concepts, levels, legacyBelt, REFRESHER_AFTER, SPACED_GAP } from '@codegames/curriculum';
import { SKINS } from '../workshop/rewards';
import { dayKey } from './activity';

export interface Completion {
  at: number;
  /** Failed checks before succeeding. */
  attempts: number;
  hintsUsed: number;
  /** 1–3, best ever (replays can improve it). */
  stars?: number;
  /** Robot levels: solved within par (the reference solution's length). */
  par?: boolean;
}

export interface CompletionResult {
  firstTime: boolean;
  stars: number;
  improved: boolean;
}

/**
 * Stars reward independent success without punishing help-seeking:
 * nudge hints are free; only the final hint (which gives the answer away) costs a star.
 * ★★★ at most one failed check, final hint unused; ★★ a few tries or the final hint;
 * ★ many tries, or a "show me" reveal.
 */
export function starsFor(attempts: number, hintsUsed: number, hintsTotal: number, revealed: boolean): number {
  if (revealed) return 1;
  const usedAnswerHint = hintsTotal > 0 && hintsUsed >= hintsTotal;
  if (attempts <= 1 && !usedAnswerHint) return 3;
  if (attempts <= 4) return 2;
  return 1;
}

type PerLanguage<T> = Record<PlayableLanguage, T>;

interface ProgressState {
  /** null until the learner picks a language on the welcome screen. */
  language: PlayableLanguage | null;
  xp: number;
  completed: PerLanguage<Record<string, Completion>>;
  /** Failed checks per `${language}:${levelId}`, reset on completion. */
  attempts: Record<string, number>;
  /** Hints opened per `${language}:${levelId}` (kept across reloads; cleared on completion). */
  hints: Record<string, number>;
  /** Levels whose answer was revealed, per `${language}:${levelId}` (cleared on completion). */
  reveals: Record<string, number>;
  /** Unsaved editor contents per `${language}:${levelId}`. */
  drafts: Record<string, string>;
  /** One-sentence reflections per `${language}:${levelId}` ("explain what you built"). */
  reflections: Record<string, { text: string; at: number }>;
  saveReflection: (language: PlayableLanguage, levelId: string, text: string) => void;
  /** How often each kind of error happened, per `${language}:${ErrorName}` (lifetime, for the journal). */
  errorCounts: Record<string, number>;
  /** Repeats since that kind's refresher last showed; resets when it shows. */
  errorStreaks: Record<string, number>;
  /** Counts an error; returns the streak (REFRESHER_AFTER means "show the refresher now"). */
  recordError: (language: PlayableLanguage, name: string) => number;
  /**
   * Best belt reached per language. Belts are computed from completions, so this only matters
   * when the belt tiers change: it keeps a belt from being taken away (round-8 P1-3).
   */
  bestBelt: Partial<Record<PlayableLanguage, string>>;
  /** Levels per day the learner chose as their goal (1, 3 or 5). */
  dailyGoal: number;
  /** When the goal changed (`dayKey` → new goal; '' → the goal before the first change). */
  goalHistory: Record<string, number>;
  setDailyGoal: (goal: number) => void;
  /** Chosen robot skin id (see features/workshop/rewards.ts). */
  skin: string;
  setSkin: (id: string) => void;
  /** Things done per calendar day (levels, replays, reviews): drives streak and daily goal. */
  activity: Record<string, number>;
  /** Warm-up reviews per concept: how many, and when last. */
  reviews: PerLanguage<Record<string, { count: number; at: number; spaced?: number }>>;
  setLanguage: (language: PlayableLanguage) => void;
  recordAttempt: (language: PlayableLanguage, levelId: string) => void;
  /** Remember hints opened / an answer revealed, so a reload doesn't restore full stars. */
  recordHints: (language: PlayableLanguage, levelId: string, count: number) => void;
  recordReveal: (language: PlayableLanguage, levelId: string) => void;
  completeLevel: (
    language: PlayableLanguage,
    levelId: string,
    xp: number,
    hints: { used: number; total: number; revealed: boolean; freeAttempts?: number },
    par?: boolean,
  ) => CompletionResult;
  saveDraft: (language: PlayableLanguage, levelId: string, code: string) => void;
  clearDraft: (language: PlayableLanguage, levelId: string) => void;
  /** "Try it again from scratch": forget this level's hints, reveal, attempts and draft, keep the completion. */
  resetLevelHelp: (language: PlayableLanguage, levelId: string) => void;
  recordReview: (language: PlayableLanguage, conceptId: string, xp: number, lastTouched: number) => void;
  /** A clean warm-up recall of a level finished with help: it now counts as done on your own. */
  graduateLevel: (language: PlayableLanguage, levelId: string) => void;
  resetProgress: () => void;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Current persisted-store version (bump with `migrateProgress`). */
export const PROGRESS_VERSION = 5;
/** Upper bound for XP and every counter in a save; far above anything reachable by play. */
export const MAX_COUNT = 1_000_000;
/** Largest draft kept per level, and most drafts kept in total. */
export const MAX_DRAFT_CHARS = 50_000;
export const MAX_DRAFTS = 500;
export const MAX_REFLECTION_CHARS = 300;
/** Earliest plausible timestamp (2020-01-01); later than "now + 1 day" is rejected too. */
const MIN_TIME = Date.UTC(2020, 0, 1);
const DAY_MS = 86_400_000;
/** Drafts of the post-boss creator workshops are keyed by these ids rather than by a level id. */
const WORKSHOP_DRAFT_IDS = ['hangman-word-builder', 'adventure-world-builder'];

const LANGUAGES = PLAYABLE_LANGUAGES;
const LEVEL_IDS = new Set(levels.map((l) => l.id));
const CONCEPT_IDS = new Set(concepts.map((c) => c.id));
const SKIN_IDS = new Set(SKINS.map((s) => s.id));
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const ERROR_NAME = /^[A-Za-z_][A-Za-z0-9_.]{0,63}$/;

const int = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isSafeInteger(x) && x >= min && x <= max;
const count = (x: unknown): x is number => int(x, 0, MAX_COUNT);
const timestamp = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= MIN_TIME && x <= Date.now() + DAY_MS;

/** Keep entries whose key passes `okKey` and whose value `pick` maps to something (undefined drops it). */
function pickMap<T>(v: unknown, okKey: (k: string) => boolean, pick: (x: unknown) => T | undefined, max = Infinity): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isRecord(v)) return out;
  let n = 0;
  for (const [k, x] of Object.entries(v)) {
    if (n >= max) break;
    if (k === '__proto__' || !okKey(k)) continue;
    const picked = pick(x);
    if (picked === undefined) continue;
    out[k] = picked;
    n++;
  }
  return out;
}

/** `${language}:${rest}` keys whose `rest` passes `okRest`. */
const langKey = (okRest: (rest: string) => boolean) => (k: string) => {
  const i = k.indexOf(':');
  return i > 0 && (LANGUAGES as readonly string[]).includes(k.slice(0, i)) && okRest(k.slice(i + 1));
};
const levelKey = langKey((rest) => LEVEL_IDS.has(rest));
const draftOk = langKey((rest) => LEVEL_IDS.has(rest) || WORKSHOP_DRAFT_IDS.includes(rest));
const errorKey = langKey((rest) => ERROR_NAME.test(rest));

/** Drop anything malformed from persisted progress (hand-edited, imported, or corrupted). */
export function sanitize(persisted: unknown): Partial<ProgressState> {
  if (!isRecord(persisted)) return {};
  const p = persisted;
  const completion = (x: unknown): Completion | undefined => {
    if (!isRecord(x) || !timestamp(x.at)) return undefined;
    if (x.stars !== undefined && !int(x.stars, 1, 3)) return undefined;
    if (x.attempts !== undefined && !count(x.attempts)) return undefined;
    if (x.hintsUsed !== undefined && !count(x.hintsUsed)) return undefined;
    return {
      at: x.at,
      attempts: (x.attempts as number | undefined) ?? 0,
      hintsUsed: (x.hintsUsed as number | undefined) ?? 0,
      ...(x.stars !== undefined ? { stars: x.stars as number } : {}),
      ...(x.par === true ? { par: true } : {}),
    };
  };
  const review = (x: unknown) => {
    if (!isRecord(x) || !count(x.count) || !timestamp(x.at)) return undefined;
    if (x.spaced !== undefined && !count(x.spaced)) return undefined;
    return { count: x.count, at: x.at, ...(x.spaced !== undefined ? { spaced: x.spaced as number } : {}) };
  };
  const perLang = <T,>(v: unknown, okKey: (k: string) => boolean, pick: (x: unknown) => T | undefined) =>
    Object.fromEntries(LANGUAGES.map((l) => [l, pickMap<T>(isRecord(v) ? v[l] : undefined, okKey, pick)])) as PerLanguage<Record<string, T>>;
  const counter = (x: unknown) => (count(x) ? x : undefined);
  const positive = (x: unknown) => (count(x) && x > 0 ? x : undefined);
  const goal = (x: unknown) => ([1, 3, 5].includes(x as number) ? (x as number) : undefined);
  return {
    language: (LANGUAGES as readonly unknown[]).includes(p.language) ? (p.language as PlayableLanguage) : null,
    xp: count(p.xp) ? p.xp : 0,
    completed: perLang<Completion>(p.completed, (k) => LEVEL_IDS.has(k), completion),
    attempts: pickMap(p.attempts, levelKey, counter),
    hints: pickMap(p.hints, levelKey, counter),
    reveals: pickMap(p.reveals, levelKey, (x) => (x === 1 ? 1 : undefined)),
    activity: pickMap(p.activity, (k) => DAY_KEY.test(k), positive),
    skin: typeof p.skin === 'string' && SKIN_IDS.has(p.skin) ? p.skin : DEFAULT_SKIN,
    reflections: pickMap(
      p.reflections,
      levelKey,
      (x) => (isRecord(x) && typeof x.text === 'string' && timestamp(x.at) && x.text.trim() ? { text: x.text.trim().slice(0, MAX_REFLECTION_CHARS), at: x.at } : undefined),
    ),
    errorCounts: pickMap(p.errorCounts, errorKey, counter),
    errorStreaks: pickMap(p.errorStreaks, errorKey, counter),
    dailyGoal: goal(p.dailyGoal) ?? 3,
    goalHistory: pickMap(p.goalHistory, (k) => k === '' || DAY_KEY.test(k), goal),
    drafts: pickMap(p.drafts, draftOk, (x) => (typeof x === 'string' && x.length <= MAX_DRAFT_CHARS ? x : undefined), MAX_DRAFTS),
    reviews: perLang(p.reviews, (k) => CONCEPT_IDS.has(k), review),
    bestBelt: Object.fromEntries(
      LANGUAGES.flatMap((l) => {
        const id = isRecord(p.bestBelt) ? p.bestBelt[l] : undefined;
        return BELTS.some((b) => b.id === id) ? [[l, id as string]] : [];
      }),
    ),
  };
}

export const draftKey = (language: PlayableLanguage, levelId: string) => `${language}:${levelId}`;

const empty = () => ({
  xp: 0,
  completed: { python: {}, javascript: {}, cybersecurity: {} } as PerLanguage<Record<string, Completion>>,
  attempts: {} as Record<string, number>,
  hints: {} as Record<string, number>,
  reveals: {} as Record<string, number>,
  drafts: {} as Record<string, string>,
  reviews: { python: {}, javascript: {}, cybersecurity: {} } as PerLanguage<Record<string, { count: number; at: number }>>,
  activity: {} as Record<string, number>,
  errorCounts: {} as Record<string, number>,
  errorStreaks: {} as Record<string, number>,
  bestBelt: {} as Partial<Record<PlayableLanguage, string>>,
  reflections: {} as Record<string, { text: string; at: number }>,
});

const DEFAULT_SKIN = 'mint';

/** Fired on `window` when localStorage refuses a save (quota exceeded or blocked); the shell shows a gentle note. */
export const STORAGE_FULL_EVENT = 'codegames:storage-full';

const bump = (activity: Record<string, number>, now = Date.now()) => {
  const key = dayKey(now);
  return { ...activity, [key]: (activity[key] ?? 0) + 1 };
};

/**
 * Bring saved progress from an older `version` up to date. Exported for tests.
 * - v1 → start fresh (the scaffold stored nothing worth keeping).
 * - v2 → v3: warm-up reviews. v3 → v4: the activity log, rebuilt from timestamps.
 * - v4 → v5: `bestBelt`, the belt the completions earned under the original tiers, so the
 *   Region 5 retier (Yellow = bosses 3–4, Orange = boss 5) never takes a belt away.
 */
export function migrateProgress(persisted: unknown, version: number): Record<string, unknown> {
  const fresh = () => ({ language: null, ...empty() });
  try {
    if (typeof version !== 'number' || !Number.isFinite(version) || version < 2 || !isRecord(persisted)) return fresh();
    const state = persisted;
    const reviews = isRecord(state.reviews) ? state.reviews : empty().reviews;
    let activity: Record<string, number> = isRecord(state.activity) ? (state.activity as Record<string, number>) : {};
    if (version < 4) {
      // Rebuild the activity log from timestamps; anything that isn't a record with a numeric `at` is skipped.
      const atsOf = (group: unknown) => (isRecord(group) ? Object.values(group).map((x) => (isRecord(x) ? x.at : undefined)) : []);
      const times = [...Object.values(isRecord(state.completed) ? state.completed : {}).flatMap(atsOf), ...Object.values(reviews).flatMap(atsOf)].filter(
        (t): t is number => typeof t === 'number' && Number.isFinite(t) && t > 1_000_000_000_000,
      );
      activity = {};
      for (const t of times) activity = bump(activity, t);
    }
    let bestBelt = state.bestBelt;
    if (version < 5) {
      const rebuilt: Partial<Record<PlayableLanguage, string>> = {};
      for (const language of PLAYABLE_LANGUAGES) {
        const done = isRecord(state.completed) ? state.completed[language] : undefined;
        const belt = isRecord(done) ? legacyBelt(new Set(Object.keys(done))) : undefined;
        if (belt) rebuilt[language] = belt;
      }
      bestBelt = rebuilt;
    }
    return { ...state, reviews, activity, bestBelt };
  } catch {
    // Total by design: whatever is in storage, the app starts rather than crashes.
    return fresh();
  }
}

/**
 * localStorage, or an in-memory stand-in where it doesn't exist or is blocked (unit tests,
 * some private modes). Without it zustand warns "storage unavailable" on every load (round-8 P2).
 */
function progressStorage(): StateStorage {
  let base: StateStorage | undefined;
  try {
    if (typeof localStorage !== 'undefined') base = localStorage;
  } catch {
    // Access itself can throw when storage is blocked.
  }
  if (!base) {
    const memory = new Map<string, string>();
    base = {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
    };
  }
  const inner = base;
  return {
    getItem: (key) => inner.getItem(key),
    removeItem: (key) => inner.removeItem(key),
    // A full disk or quota must not crash the app: progress stays in memory, and the shell is told.
    setItem: (key, value) => {
      try {
        inner.setItem(key, value);
      } catch {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORAGE_FULL_EVENT));
      }
    },
  };
}

/**
 * All learner progress, persisted to localStorage. Local only by design.
 * Bump `version` and extend `migrate` whenever the shape changes, or learners lose progress.
 */
export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      language: null,
      skin: DEFAULT_SKIN,
      setSkin: (skin) => set({ skin }),
      dailyGoal: 3,
      goalHistory: {},
      saveReflection: (language, levelId, text) =>
        set((s) => {
          const key = draftKey(language, levelId);
          const trimmed = text.trim().slice(0, 300);
          if (!trimmed) {
            const { [key]: _removed, ...rest } = s.reflections;
            return { reflections: rest };
          }
          return { reflections: { ...s.reflections, [key]: { text: trimmed, at: Date.now() } } };
        }),
      recordError: (language, name) => {
        const key = `${language}:${name}`;
        const count = (get().errorCounts[key] ?? 0) + 1;
        const streak = (get().errorStreaks[key] ?? 0) + 1;
        // Once the refresher shows, the streak starts over: it isn't shown on every later repeat.
        const kept = streak >= REFRESHER_AFTER ? 0 : streak;
        set((s) => ({ errorCounts: { ...s.errorCounts, [key]: count }, errorStreaks: { ...s.errorStreaks, [key]: kept } }));
        return streak;
      },
      setDailyGoal: (dailyGoal) =>
        set((s) => {
          if (dailyGoal === s.dailyGoal) return s;
          // Remember the old goal for past days, so a new goal isn't applied retroactively.
          const goalHistory: Record<string, number> = { ...s.goalHistory, [dayKey(Date.now())]: dailyGoal };
          if (!('' in s.goalHistory)) goalHistory[''] = s.dailyGoal;
          return { dailyGoal, goalHistory };
        }),
      ...empty(),
      setLanguage: (language) => set({ language }),
      recordAttempt: (language, levelId) =>
        set((s) => {
          const key = draftKey(language, levelId);
          return { attempts: { ...s.attempts, [key]: (s.attempts[key] ?? 0) + 1 } };
        }),
      recordHints: (language, levelId, count) =>
        set((s) => {
          const key = draftKey(language, levelId);
          return count > (s.hints[key] ?? 0) ? { hints: { ...s.hints, [key]: count } } : {};
        }),
      recordReveal: (language, levelId) => set((s) => ({ reveals: { ...s.reveals, [draftKey(language, levelId)]: 1 } })),
      completeLevel: (language, levelId, xp, hints, par) => {
        const state = get();
        const key = draftKey(language, levelId);
        const { [key]: attempts = 0, ...otherAttempts } = state.attempts;
        const { [key]: savedHints = 0, ...otherHints } = state.hints;
        const { [key]: savedReveal = 0, ...otherReveals } = state.reveals;
        const used = Math.max(hints.used, savedHints);
        const stars = starsFor(Math.max(0, attempts - (hints.freeAttempts ?? 0)), used, hints.total, hints.revealed || savedReveal === 1);
        const previous = state.completed[language][levelId];
        const best = Math.max(stars, previous?.stars ?? 0);
        set({
          xp: previous ? state.xp : state.xp + xp,
          attempts: otherAttempts,
          hints: otherHints,
          reveals: otherReveals,
          activity: bump(state.activity),
          completed: {
            ...state.completed,
            [language]: {
              ...state.completed[language],
              [levelId]: previous
                ? { ...previous, stars: best, par: previous.par || par || undefined }
                : { at: Date.now(), attempts, hintsUsed: used, stars, par: par || undefined },
            },
          },
        });
        return { firstTime: !previous, stars, improved: !!previous && stars > (previous.stars ?? 0) };
      },
      saveDraft: (language, levelId, code) =>
        set((s) => {
          // Oversized drafts are not stored (the editor also caps its input); the previous draft stays.
          if (code.length > MAX_DRAFT_CHARS) return {};
          const key = draftKey(language, levelId);
          if (!(key in s.drafts) && Object.keys(s.drafts).length >= MAX_DRAFTS) return {};
          return { drafts: { ...s.drafts, [key]: code } };
        }),
      clearDraft: (language, levelId) =>
        set((s) => {
          const { [draftKey(language, levelId)]: _removed, ...drafts } = s.drafts;
          return { drafts };
        }),
      resetLevelHelp: (language, levelId) =>
        set((s) => {
          const key = draftKey(language, levelId);
          const { [key]: _a, ...attempts } = s.attempts;
          const { [key]: _h, ...hints } = s.hints;
          const { [key]: _r, ...reveals } = s.reveals;
          const { [key]: _d, ...drafts } = s.drafts;
          return { attempts, hints, reveals, drafts };
        }),
      recordReview: (language, conceptId, xp, lastTouched) =>
        set((s) => {
          const prev = s.reviews[language][conceptId];
          const now = Date.now();
          const spaced = (prev?.spaced ?? 0) + (now - lastTouched >= SPACED_GAP ? 1 : 0);
          return {
            xp: s.xp + xp,
            activity: bump(s.activity, now),
            reviews: { ...s.reviews, [language]: { ...s.reviews[language], [conceptId]: { count: (prev?.count ?? 0) + 1, at: now, spaced } } },
          };
        }),
      graduateLevel: (language, levelId) =>
        set((s) => {
          const prev = s.completed[language][levelId];
          if (!prev || (prev.stars ?? 3) >= 3) return {};
          return { completed: { ...s.completed, [language]: { ...s.completed[language], [levelId]: { ...prev, stars: 3 } } } };
        }),
      resetProgress: () => set({ ...empty() }),
    }),
    {
      name: 'codegames-progress',
      storage: createJSONStorage(progressStorage),
      version: PROGRESS_VERSION,
      // Never let malformed saved data crash the app: keep only well-formed parts.
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      migrate: (persisted, version) => migrateProgress(persisted, version) as unknown as ProgressState,
    },
  ),
);

// Another tab saved progress: reload it, so this tab's next save doesn't overwrite that tab's
// completions with stale state (persist always writes the whole store).
function isOurStorage(area: Storage | null): boolean {
  try {
    return area === localStorage;
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'codegames-progress' && isOurStorage(event.storageArea)) void useProgress.persist.rehydrate();
  });
}

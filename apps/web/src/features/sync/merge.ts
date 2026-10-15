// apps/web/src/features/sync/merge.ts
// Pure, deterministic merging of local progress state with remote snapshot data.

export interface MergeOptions {
  preferLocalPrefs?: boolean;
}

export function mergeProgress(local: any, remote: any, opts: MergeOptions = {}): any {
  if (!remote || typeof remote !== 'object') return { ...local };
  if (!local || typeof local !== 'object') return { ...remote };

  const merged = { ...local };

  // Language & preference fields
  if (opts.preferLocalPrefs) {
    merged.language = local.language ?? remote.language ?? null;
    merged.skin = local.skin ?? remote.skin ?? 'default';
    merged.dailyGoal = local.dailyGoal ?? remote.dailyGoal ?? 3;
  } else {
    merged.language = remote.language ?? local.language ?? null;
    merged.skin = remote.skin ?? local.skin ?? 'default';
    merged.dailyGoal = remote.dailyGoal ?? local.dailyGoal ?? 3;
  }

  // XP: cosmetic client XP takes max
  merged.xp = Math.max(Number(local.xp || 0), Number(remote.xp || 0));

  // Completed levels: union with best stars and earliest completion time
  merged.completed = {
    python: { ...(local.completed?.python || {}) },
    javascript: { ...(local.completed?.javascript || {}) },
  };

  for (const lang of ['python', 'javascript'] as const) {
    const remoteLang = remote.completed?.[lang] || {};
    for (const [id, comp] of Object.entries(remoteLang) as [string, any][]) {
      const existing = merged.completed[lang][id];
      if (!existing) {
        merged.completed[lang][id] = { ...comp };
      } else {
        merged.completed[lang][id] = {
          at: Math.min(existing.at, comp.at),
          attempts: existing.at <= comp.at ? existing.attempts : comp.attempts,
          hintsUsed: existing.at <= comp.at ? existing.hintsUsed : comp.hintsUsed,
          stars: Math.max(existing.stars ?? 3, comp.stars ?? 3),
          par: Boolean(existing.par || comp.par),
        };
      }
    }
  }

  // Counters: union with max values
  for (const field of ['errorCounts', 'errorStreaks', 'activity'] as const) {
    merged[field] = { ...(local[field] || {}) };
    const remoteField = remote[field] || {};
    for (const [k, v] of Object.entries(remoteField) as [string, number][]) {
      merged[field][k] = Math.max(merged[field][k] || 0, v || 0);
    }
  }

  // Reflections: later timestamp wins
  merged.reflections = { ...(local.reflections || {}) };
  for (const [k, v] of Object.entries(remote.reflections || {}) as [string, any][]) {
    const existing = merged.reflections[k];
    if (!existing || (v.at && v.at > (existing.at || 0))) {
      merged.reflections[k] = v;
    }
  }

  // Best belt: keep highest belt attained
  merged.bestBelt = { ...(local.bestBelt || {}) };
  for (const lang of ['python', 'javascript'] as const) {
    if (remote.bestBelt?.[lang] && !merged.bestBelt[lang]) {
      merged.bestBelt[lang] = remote.bestBelt[lang];
    }
  }

  // Reviews: max count and latest timestamp
  merged.reviews = {
    count: Math.max(local.reviews?.count || 0, remote.reviews?.count || 0),
    at: Math.max(local.reviews?.at || 0, remote.reviews?.at || 0),
    spaced: Math.max(local.reviews?.spaced || 0, remote.reviews?.spaced || 0),
  };

  return merged;
}

/** Strips device-only fields (drafts) before sending to server */
export function trimForSync(data: any): any {
  if (!data || typeof data !== 'object') return {};
  const copy = { ...data };
  delete copy.drafts;
  delete copy.draftsAt;
  return copy;
}

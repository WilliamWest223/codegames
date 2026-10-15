// apps/web/src/features/sync/syncApi.ts
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { trimForSync } from './merge';

export interface PushResult {
  ok: boolean;
  code?: string;
  revision?: number;
  updated_at?: string;
  retry_after?: number;
}

export interface PullResult {
  ok: boolean;
  empty?: boolean;
  data?: any;
  revision?: number;
  schema_version?: number;
  updated_at?: string;
  code?: string;
  retry_after?: number;
}

export async function pushSnapshot(data: any, schemaVersion: number, revision: number): Promise<PushResult> {
  if (!isSupabaseConfigured) return { ok: false, code: 'not_configured' };

  const sanitized = trimForSync(data);
  const { data: result, error } = await supabase.rpc('push_snapshot', {
    p: {
      data: sanitized,
      schema_version: schemaVersion,
      revision,
    },
  });

  if (error) {
    return { ok: false, code: error.message };
  }

  return result as PushResult;
}

export async function pullSnapshot(): Promise<PullResult> {
  if (!isSupabaseConfigured) return { ok: false, code: 'not_configured' };

  const { data: result, error } = await supabase.rpc('pull_snapshot', { p: {} });
  if (error) {
    return { ok: false, code: error.message };
  }

  return result as PullResult;
}

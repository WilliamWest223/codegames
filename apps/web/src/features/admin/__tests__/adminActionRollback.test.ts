import { describe, expect, it } from 'vitest';
import {
  applyPlayerPatch,
  callAdminRpc,
  restorePlayer,
  type AdminPlayerRecord,
  type RpcClient,
} from '../AdminDashboard';

const player = (over: Partial<AdminPlayerRecord> = {}): AdminPlayerRecord => ({
  id: 'u1',
  email: 'u1@example.com',
  display_name: 'U1',
  role: 'Player',
  status: 'Active',
  created_at: '2026-01-01T00:00:00Z',
  xp: 100,
  completed_levels: 3,
  ...over,
});

const clientReturning = (result: Awaited<ReturnType<RpcClient['rpc']>>): RpcClient => ({
  rpc: async () => result,
});

describe('callAdminRpc', () => {
  it('returns null on success', async () => {
    expect(await callAdminRpc(clientReturning({ data: { ok: true }, error: null }), 'f', {})).toBeNull();
  });

  it('surfaces server error message (e.g. admin_required)', async () => {
    const c = clientReturning({ data: null, error: { message: 'admin_required' } });
    expect(await callAdminRpc(c, 'admin_set_user_role', {})).toBe('admin_required');
  });

  it('surfaces ok:false payload codes', async () => {
    const c = clientReturning({ data: { ok: false, code: 'rate_limited' }, error: null });
    expect(await callAdminRpc(c, 'f', {})).toBe('rate_limited');
  });

  it('surfaces thrown errors instead of swallowing them', async () => {
    const c: RpcClient = {
      rpc: async () => {
        throw new Error('network down');
      },
    };
    expect(await callAdminRpc(c, 'f', {})).toBe('network down');
  });
});

describe('optimistic update rollback', () => {
  it('restores the previous player record after a failed action', () => {
    const before = [player(), player({ id: 'u2' })];
    const optimistic = applyPlayerPatch(before, 'u1', { role: 'Admin' });
    expect(optimistic[0]?.role).toBe('Admin');
    const rolledBack = restorePlayer(optimistic, before[0]!);
    expect(rolledBack).toEqual(before);
  });

  it('does not touch other players on rollback', () => {
    const before = [player(), player({ id: 'u2' })];
    const mid = applyPlayerPatch(applyPlayerPatch(before, 'u1', { status: 'Suspended' }), 'u2', { xp: 0 });
    const out = restorePlayer(mid, before[0]!);
    expect(out[0]?.status).toBe('Active');
    expect(out[1]?.xp).toBe(0);
  });
});

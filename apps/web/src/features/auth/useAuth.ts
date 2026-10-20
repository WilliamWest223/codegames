// apps/web/src/features/auth/useAuth.ts
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

/**
 * Client-side admin hint from the JWT only.
 * Trust `app_metadata.app_roles` (set by the custom access token hook), never
 * `user_metadata` (user-writable) or a hardcoded email. Authoritative check is
 * still `get_my_role` / server `private.is_admin()` on every admin RPC.
 */
export function checkIsAdmin(user: User | null): boolean {
  if (!user) return false;
  const appRoles = (user.app_metadata?.app_roles ?? []) as string[];
  return Array.isArray(appRoles) && appRoles.includes('admin');
}

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  ageOk: boolean;
  displayName: string | null;
  isAdmin: boolean;
  simulatePlayer: boolean;
  initAuth: () => Promise<void>;
  continueAsGuest: () => void;
  setAgeConfirmed: () => void;
  setDisplayName: (name: string) => void;
  setSimulatePlayer: (simulate: boolean) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: isSupabaseConfigured ? 'loading' : 'signed-out',
  session: null,
  user: null,
  isGuest: false,
  ageOk: false,
  displayName: null,
  isAdmin: false,
  simulatePlayer: false,

  continueAsGuest: () => {
    set({ status: 'signed-in', isGuest: true, displayName: 'Guest', isAdmin: false, simulatePlayer: false });
  },

  setSimulatePlayer: (simulate: boolean) => set({ simulatePlayer: simulate }),

  initAuth: async () => {
    if (!isSupabaseConfigured) {
      set({ status: 'signed-out' });
      return;
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Optimistic JWT hint only; refreshProfile overwrites from get_my_role.
      set({ status: 'signed-in', session, user: session.user, isAdmin: false });
      await get().refreshProfile();
    } else {
      set({ status: 'signed-out', session: null, user: null, isAdmin: false });
    }

    // Subscribe to auth state updates
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        set({ status: 'signed-in', session: newSession, user: newSession.user, isAdmin: false });
        await get().refreshProfile();
      } else {
        set({ status: 'signed-out', session: null, user: null, ageOk: false, displayName: null, isAdmin: false });
      }
    });
  },

  refreshProfile: async () => {
    if (!isSupabaseConfigured) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('age_confirmed_at, display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      set({
        ageOk: Boolean(data.age_confirmed_at),
        displayName: data.display_name ?? null,
      });
    }

    try {
      const { data: roleData, error: roleError } = await supabase.rpc('get_my_role');
      if (!roleError && typeof roleData === 'string') {
        // Server RPC is authoritative for UI gating; never OR with client heuristics.
        set({ isAdmin: roleData === 'admin' });
      } else {
        set({ isAdmin: false });
      }
    } catch {
      set({ isAdmin: false });
    }
  },

  setAgeConfirmed: () => set({ ageOk: true }),
  setDisplayName: (displayName: string) => set({ displayName }),
}));

// apps/web/src/features/auth/useAuth.ts
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  ageOk: boolean;
  displayName: string | null;
  initAuth: () => Promise<void>;
  continueAsGuest: () => void;
  setAgeConfirmed: () => void;
  setDisplayName: (name: string) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: isSupabaseConfigured ? 'loading' : 'signed-out',
  session: null,
  user: null,
  isGuest: false,
  ageOk: false,
  displayName: null,

  continueAsGuest: () => {
    set({ status: 'signed-in', isGuest: true, displayName: 'Guest' });
  },

  initAuth: async () => {
    if (!isSupabaseConfigured) {
      set({ status: 'signed-out' });
      return;
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ status: 'signed-in', session, user: session.user });
      await get().refreshProfile();
    } else {
      set({ status: 'signed-out', session: null, user: null });
    }

    // Subscribe to auth state updates
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        set({ status: 'signed-in', session: newSession, user: newSession.user });
        await get().refreshProfile();
      } else {
        set({ status: 'signed-out', session: null, user: null, ageOk: false, displayName: null });
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
  },

  setAgeConfirmed: () => set({ ageOk: true }),
  setDisplayName: (displayName: string) => set({ displayName }),
}));

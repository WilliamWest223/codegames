import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { clearUserCaches } from '../../lib/swClient';
import { useAuth } from './useAuth';
import { clearLocalProgress } from '../progress/store';
import { syncEngine } from '../sync/engine';

export async function logout(): Promise<void> {
  const wasGuest = useAuth.getState().isGuest;
  // Local progress is wiped below, so upload unsynced edits while the session is still valid.
  // shortcut: best-effort; an offline logout still drops unsynced edits. Upgrade: warn and confirm first.
  if (!wasGuest) await syncEngine.push().catch(() => undefined);
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore network errors during signout
    }
  }

  // Clear local auth & sync meta keys
  try {
    localStorage.removeItem('codegames-auth');
    localStorage.removeItem('codegames-sync-meta');
    sessionStorage.removeItem('codegames.next');
  } catch {
    // Ignore storage errors
  }

  // A signed-in user's progress must not bleed into the next account on this browser.
  if (!wasGuest) clearLocalProgress();
  syncEngine.reset();

  // Signal service worker to purge user data caches
  await clearUserCaches();

  window.location.replace('/');
}

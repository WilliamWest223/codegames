import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { clearUserCaches } from '../../lib/swClient';

export async function logout(): Promise<void> {
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

  // Signal service worker to purge user data caches
  await clearUserCaches();

  window.location.replace('/');
}

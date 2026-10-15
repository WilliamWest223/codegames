// apps/web/src/features/auth/AuthCallback.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from './useAuth';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current || !isSupabaseConfigured) return;
    exchanged.current = true;

    async function handleExchange() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errDesc = params.get('error_description');

        if (errDesc) {
          setError(errDesc);
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
        }

        // Auto-confirm age RPC if user was onboarding
        try {
          await supabase.rpc('confirm_age', {});
        } catch {
          // Ignore if already confirmed or error
        }

        await useAuth.getState().refreshProfile();

        // Safe redirect to requested next path
        let next = '/';
        const rawNext = sessionStorage.getItem('codegames.next');
        sessionStorage.removeItem('codegames.next');
        if (rawNext && /^\/(?!\/)[A-Za-z0-9/_-]{0,200}$/.test(rawNext)) {
          next = rawNext;
        }

        navigate(next, { replace: true });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Authentication exchange failed');
      }
    }

    handleExchange();
  }, [navigate]);

  if (error) {
    return (
      <div className="card" style={{ maxWidth: 440, margin: '3rem auto', padding: '2rem' }}>
        <h2>Sign In Problem</h2>
        <p style={{ color: 'var(--danger, #ff5555)', margin: '1rem 0' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/signin', { replace: true })}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>Signing you in…</h2>
      <p style={{ color: 'var(--text-muted)' }}>Verifying credentials and restoring your progress.</p>
    </div>
  );
}

// apps/web/src/features/auth/SignIn.tsx
import { useState, type FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface SignInProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SignIn({ onSuccess, onCancel }: SignInProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="card" style={{ maxWidth: 440, margin: '2rem auto', padding: '1.5rem' }}>
        <h2>Cloud Sync Not Configured</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Supabase credentials are not configured yet. The app is running in offline local-only mode.
        </p>
        {onCancel && (
          <button className="btn btn-secondary" onClick={onCancel} style={{ marginTop: '1rem' }}>
            Continue in Offline Mode
          </button>
        )}
      </div>
    );
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (tab === 'signup' && !ageConfirmed) {
      setError('You must be 13 or older to create an account.');
      return;
    }

    setBusy(true);
    setError(null);
    setSentMessage(null);

    try {
      const origin = window.location.origin;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: tab === 'signup',
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (otpError) {
        if (otpError.message.includes('over_email_send_rate_limit') || otpError.status === 429) {
          setError('Email sign-in is currently rate-limited. Please sign in with Google or GitHub, or try again later.');
        } else {
          setError(otpError.message);
        }
      } else {
        setSentMessage(`A sign-in link has been sent to ${email.trim()}. Open the link on this device to continue.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (tab === 'signup' && !ageConfirmed) {
      setError('You must confirm you are 13 or older before creating an account.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const origin = window.location.origin;
      // Must use redirect flow because COOP 'same-origin' severs popup windows
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to sign in with ${provider}`);
      setBusy(false);
    }
  };

  return (
    <div className="card auth-card" style={{ maxWidth: 440, margin: '2rem auto', padding: '2rem', textAlign: 'left' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button
          type="button"
          className={`tab-btn ${tab === 'signup' ? 'active' : ''}`}
          onClick={() => { setTab('signup'); setError(null); }}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'signup' ? '2px solid var(--accent)' : 'none',
            color: tab === 'signup' ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Create Account
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'signin' ? 'active' : ''}`}
          onClick={() => { setTab('signin'); setError(null); }}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'signin' ? '2px solid var(--accent)' : 'none',
            color: tab === 'signin' ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {tab === 'signup'
          ? 'Save your progress, earn verified belts, and practice on any device. 100% free with no ads.'
          : 'Welcome back! Sign in to restore your progress and continue learning.'}
      </p>

      {/* OAuth Fast Providers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => handleOAuth('google')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <span>Continue with Google</span>
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => handleOAuth('github')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <span>Continue with GitHub</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', margin: '1rem 0' }}>
        — or use email magic link —
      </div>

      <form onSubmit={handleEmailSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="auth-email" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            required
            disabled={busy}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>

        {tab === 'signup' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                style={{ marginTop: '0.2rem' }}
              />
              <span>I confirm that I am 13 years of age or older.</span>
            </label>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger, #ff5555)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {sentMessage && (
          <div style={{ color: 'var(--success, #50fa7b)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {sentMessage}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || (tab === 'signup' && !ageConfirmed)}
          style={{ width: '100%', padding: '0.75rem' }}
        >
          {busy ? 'Sending…' : tab === 'signup' ? 'Create Free Account' : 'Send Magic Link'}
        </button>
      </form>

      {onCancel && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          Continue Playing Offline
        </button>
      )}
    </div>
  );
}

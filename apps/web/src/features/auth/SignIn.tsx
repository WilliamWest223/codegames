// apps/web/src/features/auth/SignIn.tsx
import { useState, type FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from './useAuth';
import './SignIn.css';

interface SignInProps {
  onSuccess?: () => void;
}

export function SignIn({ onSuccess }: SignInProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const continueAsGuest = useAuth((s) => s.continueAsGuest);

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-mark">&gt;_</span> CodeGames
            </div>
            <h1 className="auth-tagline">Offline Development Mode</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            No Supabase environment variables detected. You can explore all levels and play in local-only offline mode.
          </p>
          <button className="auth-submit-btn" type="button" onClick={continueAsGuest}>
            Continue as Guest →
          </button>
        </div>
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
        setSentMessage(`A sign-in link and verification code have been sent to ${email.trim()}.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim() || !email.trim()) return;

    setBusy(true);
    setError(null);

    try {
      const cleanToken = otpToken.trim();
      // Try verify with token
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanToken,
        type: tab === 'signup' ? 'signup' : 'email',
      });

      if (verifyError) {
        // Fallback retry with 'magiclink'
        const retry = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: cleanToken,
          type: 'magiclink',
        });
        if (retry.error) {
          setError(verifyError.message);
          return;
        }
      }

      if (data?.session) {
        await useAuth.getState().initAuth();
        onSuccess?.();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
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
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-mark">&gt;_</span> CodeGames
          </div>
          <p className="auth-tagline">
            Master Python & JavaScript through playable games.
          </p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signup'}
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(null); }}
          >
            Create Account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signin'}
            className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError(null); }}
          >
            Sign In
          </button>
        </div>

        {/* OAuth Buttons */}
        <div className="auth-oauth-group">
          <button
            type="button"
            className="auth-oauth-btn"
            disabled={busy}
            onClick={() => handleOAuth('google')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            className="auth-oauth-btn"
            disabled={busy}
            onClick={() => handleOAuth('github')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>

        <div className="auth-divider">
          <span>or email link / code</span>
        </div>

        {error && <div className="auth-alert-error">{error}</div>}
        {sentMessage && <div className="auth-alert-success">{sentMessage}</div>}

        {!sentMessage ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="auth-form-group">
              <label htmlFor="auth-email" className="auth-form-label">
                Email address
              </label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                required
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {tab === 'signup' && (
              <div className="auth-form-group">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    required
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                  />
                  <span>I confirm that I am 13 years of age or older.</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={busy || (tab === 'signup' && !ageConfirmed)}
            >
              {busy ? 'Sending…' : tab === 'signup' ? 'Create Free Account' : 'Send Sign-In Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-otp-box">
            <label htmlFor="auth-otp" className="auth-form-label" style={{ textAlign: 'center' }}>
              Enter 6-digit code from your email:
            </label>
            <input
              id="auth-otp"
              className="auth-otp-input"
              type="text"
              maxLength={8}
              autoFocus
              required
              disabled={busy}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value)}
              placeholder="123456"
            />
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={busy || !otpToken.trim()}
            >
              {busy ? 'Verifying…' : 'Verify & Enter Game'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setSentMessage(null); setOtpToken(''); }}
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
              >
                ← Back to email input
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

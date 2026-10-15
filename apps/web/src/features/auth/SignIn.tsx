// apps/web/src/features/auth/SignIn.tsx
import { useState, useEffect, type FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from './useAuth';
import './SignIn.css';

interface SignInProps {
  onSuccess?: () => void;
}

export function SignIn({ onSuccess }: SignInProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rate limiting: 5 failed attempts locks for 60s
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const continueAsGuest = useAuth((s) => s.continueAsGuest);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => setLockoutSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const sanitizeInput = (str: string) => str.trim();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) {
      return 'Password must contain at least one special character (!@#$%^&* etc).';
    }
    return null;
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-mark">&gt;_</span> CodeGames
            </div>
            <h1 className="auth-tagline">Offline Local Mode</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            No Supabase connection configured. You can play all tracks, curriculum levels, and games in offline local storage mode.
          </p>
          <button className="auth-submit-btn" type="button" onClick={continueAsGuest}>
            Continue as Guest →
          </button>
        </div>
      </div>
    );
  }

  // Handle direct Email + Password sign-in (NO verification code required)
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const cleanEmail = sanitizeInput(email);
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both your email and password.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockoutSeconds(60);
          setError('Too many failed attempts. Login locked for 60 seconds.');
        } else {
          setError(authError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : authError.message);
        }
        return;
      }

      if (data?.session) {
        setFailedAttempts(0);
        await useAuth.getState().initAuth();
        onSuccess?.();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  // Handle Account Creation with required one-time email verification
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const cleanEmail = sanitizeInput(email);
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    const pwdError = validatePassword(cleanPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (cleanPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!ageConfirmed) {
      setError('You must confirm that you are 13 years of age or older.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If user is already active (rare auto-confirm)
      if (data.session) {
        await useAuth.getState().initAuth();
        onSuccess?.();
        return;
      }

      // One-time verification email sent
      setAwaitingVerification(true);
      setSuccessMsg(`Verification code sent to ${cleanEmail}. Please enter the 6-digit code below to activate your account.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setBusy(false);
    }
  };

  // Verify the 6-digit code for account activation
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const cleanToken = sanitizeInput(otpToken);
    const cleanEmail = sanitizeInput(email);

    if (!cleanToken || !cleanEmail) return;

    setBusy(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      if (verifyError) {
        // Fallback retry with email type
        const retry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (retry.error) {
          setError(verifyError.message);
          return;
        }
      }

      if (data?.session) {
        try {
          await supabase.rpc('confirm_age', {});
        } catch {
          // Ignore
        }
        await useAuth.getState().initAuth();
        onSuccess?.();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
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
            Master Python, JavaScript & Cybersecurity through games.
          </p>
        </div>

        {/* Tab Switcher */}
        {!awaitingVerification && (
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => { setTab('signin'); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setError(null); }}
            >
              Create Account
            </button>
          </div>
        )}

        {error && <div className="auth-alert-error" role="alert">{error}</div>}
        {successMsg && <div className="auth-alert-success" role="status">{successMsg}</div>}

        {/* Sign In Form */}
        {!awaitingVerification && tab === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div className="auth-form-group">
              <label htmlFor="signin-email" className="auth-form-label">
                Email address
              </label>
              <input
                id="signin-email"
                className="auth-input"
                type="email"
                required
                disabled={busy || lockoutSeconds > 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="signin-password" className="auth-form-label">
                  Password
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0 4px', color: 'var(--text-muted)' }}
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="signin-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={busy || lockoutSeconds > 0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={busy || lockoutSeconds > 0}
            >
              {lockoutSeconds > 0
                ? `Locked (${lockoutSeconds}s)`
                : busy
                  ? 'Signing in…'
                  : 'Sign In →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Quick test login: <strong>admin@email.com</strong> / <strong>west@1234</strong>
            </div>
          </form>
        )}

        {/* Create Account Form */}
        {!awaitingVerification && tab === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div className="auth-form-group">
              <label htmlFor="signup-email" className="auth-form-label">
                Email address
              </label>
              <input
                id="signup-email"
                className="auth-input"
                type="email"
                required
                disabled={busy || lockoutSeconds > 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="signup-password" className="auth-form-label">
                Password <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(min 8 chars, 1 special char)</span>
              </label>
              <input
                id="signup-password"
                className="auth-input"
                type="password"
                required
                disabled={busy || lockoutSeconds > 0}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="signup-confirm-password" className="auth-form-label">
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                className="auth-input"
                type="password"
                required
                disabled={busy || lockoutSeconds > 0}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

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

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={busy || !ageConfirmed || lockoutSeconds > 0}
            >
              {busy ? 'Creating account…' : 'Create Account & Verify Email →'}
            </button>
          </form>
        )}

        {/* One-time 6-digit verification code input */}
        {awaitingVerification && (
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
              {busy ? 'Verifying…' : 'Verify & Enter CodeGames →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setAwaitingVerification(false); setSuccessMsg(null); setError(null); }}
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

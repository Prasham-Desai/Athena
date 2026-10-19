'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Eye, EyeOff, Lock, Unlock, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// The correct password — hard-coded as required.
// ⚠️  This IS visible in the compiled client bundle; this is a lightweight
//     access gate, NOT production-grade authentication.
// ---------------------------------------------------------------------------
const CORRECT_PASSWORD = 'Trafalgar';

// ---------------------------------------------------------------------------
// Inner component (needs useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuthStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // If already authenticated, redirect immediately.
  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = searchParams.get('returnTo');
      const safe = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
      router.replace(safe);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password === CORRECT_PASSWORD) {
      setLoading(true);
      setError('');
      login();
      // Navigation is handled by the useEffect above once isAuthenticated flips.
    } else {
      setError('Incorrect password. Please try again.');
      setShaking(true);
      setPassword('');
      setTimeout(() => {
        setShaking(false);
        inputRef.current?.focus();
      }, 600);
    }
  };

  return (
    <div className="athena-login-root">
      {/* Animated background orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <div className={`login-panel${shaking ? ' shake' : ''}`}>
        {/* Logo + branding */}
        <div className="login-header">
          <div className="login-logo" aria-hidden="true">
            <img src="/logo.svg" alt="" width={38} height={38} />
          </div>
          <h1 className="login-title">Athena</h1>
          <p className="login-subtitle">Wisdom in every session</p>
        </div>

        {/* Divider */}
        <div className="login-divider" aria-hidden="true" />

        {/* Unlock label */}
        <div className="login-lock-row">
          <Lock className="login-lock-icon" aria-hidden="true" size={15} />
          <span className="login-lock-label">Enter your password to continue</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="login-field-wrap">
            <label htmlFor="athena-password" className="sr-only">
              Password
            </label>
            <input
              id="athena-password"
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Password"
              autoComplete="current-password"
              autoFocus
              required
              className="login-input"
              aria-describedby={error ? 'login-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="login-eye-btn"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Error message */}
          <div
            id="login-error"
            role="alert"
            aria-live="polite"
            className={`login-error${error ? ' login-error--visible' : ''}`}
          >
            {error}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="login-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" aria-hidden="true" />
                Unlocking…
              </>
            ) : (
              <>
                <Unlock size={16} aria-hidden="true" />
                Unlock
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        /* ------------------------------------------------------------------ */
        /* Reset / root                                                         */
        /* ------------------------------------------------------------------ */
        .athena-login-root {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: hsl(224 71% 4%);
          overflow: hidden;
          z-index: 9999;
        }

        /* ------------------------------------------------------------------ */
        /* Ambient orbs                                                         */
        /* ------------------------------------------------------------------ */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .orb-1 {
          width: 520px; height: 520px;
          top: -160px; left: -120px;
          background: radial-gradient(circle, hsl(243 75% 59% / 0.18) 0%, transparent 70%);
          animation-delay: 0s;
        }
        .orb-2 {
          width: 400px; height: 400px;
          bottom: -100px; right: -80px;
          background: radial-gradient(circle, hsl(280 70% 55% / 0.14) 0%, transparent 70%);
          animation-delay: -4s;
        }
        .orb-3 {
          width: 300px; height: 300px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, hsl(243 75% 59% / 0.06) 0%, transparent 70%);
          animation-delay: -8s;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-24px) scale(1.04); }
        }
        .orb-3 {
          animation-name: orbPulse;
        }
        @keyframes orbPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.6; }
          50%       { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }

        /* ------------------------------------------------------------------ */
        /* Panel                                                               */
        /* ------------------------------------------------------------------ */
        .login-panel {
          position: relative;
          width: 100%;
          max-width: 400px;
          background: hsl(222 47% 8% / 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid hsl(222 47% 18% / 0.7);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          box-shadow:
            0 0 0 1px hsl(243 75% 59% / 0.06),
            0 24px 64px -12px hsl(0 0% 0% / 0.55),
            0 4px 16px -4px hsl(243 75% 59% / 0.08);
          animation: panelIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes panelIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        /* Shake on wrong password */
        .login-panel.shake {
          animation: shake 0.55s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }

        /* ------------------------------------------------------------------ */
        /* Header                                                              */
        /* ------------------------------------------------------------------ */
        .login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
          text-align: center;
        }

        .login-logo {
          width: 56px; height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, hsl(243 75% 59% / 0.15), hsl(280 70% 55% / 0.1));
          border: 1px solid hsl(243 75% 59% / 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
          box-shadow: 0 8px 24px -8px hsl(243 75% 59% / 0.3);
        }

        .login-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 1.625rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, hsl(213 31% 91%) 0%, hsl(243 75% 75%) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
          margin: 0;
        }

        .login-subtitle {
          font-size: 0.75rem;
          color: hsl(215 20% 50%);
          letter-spacing: 0.02em;
          margin: 0;
        }

        /* ------------------------------------------------------------------ */
        /* Divider                                                             */
        /* ------------------------------------------------------------------ */
        .login-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            hsl(222 47% 18% / 0.8) 30%,
            hsl(243 75% 59% / 0.15) 50%,
            hsl(222 47% 18% / 0.8) 70%,
            transparent 100%
          );
          margin-bottom: 1.5rem;
        }

        /* ------------------------------------------------------------------ */
        /* Lock row                                                            */
        /* ------------------------------------------------------------------ */
        .login-lock-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .login-lock-icon {
          color: hsl(215 20% 50%);
          flex-shrink: 0;
        }
        .login-lock-label {
          font-size: 0.75rem;
          color: hsl(215 20% 50%);
          letter-spacing: 0.01em;
        }

        /* ------------------------------------------------------------------ */
        /* Form                                                                */
        /* ------------------------------------------------------------------ */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .login-field-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          padding: 0.75rem 2.75rem 0.75rem 1rem;
          background: hsl(222 47% 11%);
          border: 1px solid hsl(222 47% 18%);
          border-radius: 12px;
          color: hsl(213 31% 91%);
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .login-input::placeholder {
          color: hsl(215 20% 40%);
        }

        .login-input:focus {
          border-color: hsl(243 75% 59% / 0.6);
          box-shadow: 0 0 0 3px hsl(243 75% 59% / 0.12);
        }

        .login-eye-btn {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: hsl(215 20% 45%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 6px;
          transition: color 0.15s;
          line-height: 0;
        }
        .login-eye-btn:hover { color: hsl(213 31% 75%); }
        .login-eye-btn:focus-visible {
          outline: 2px solid hsl(243 75% 59% / 0.5);
          outline-offset: 2px;
        }

        /* ------------------------------------------------------------------ */
        /* Error                                                               */
        /* ------------------------------------------------------------------ */
        .login-error {
          font-size: 0.75rem;
          color: hsl(0 70% 65%);
          min-height: 1rem;
          padding: 0 0.25rem;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.2s, transform 0.2s;
          pointer-events: none;
        }
        .login-error--visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        /* ------------------------------------------------------------------ */
        /* Submit button                                                       */
        /* ------------------------------------------------------------------ */
        .login-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.8125rem 1.5rem;
          background: linear-gradient(135deg, hsl(243 75% 59%) 0%, hsl(280 70% 55%) 100%);
          color: #ffffff;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px -4px hsl(243 75% 59% / 0.45);
          margin-top: 0.25rem;
        }

        .login-submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -6px hsl(243 75% 59% / 0.5);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px -2px hsl(243 75% 59% / 0.4);
        }

        .login-submit-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .login-submit-btn:focus-visible {
          outline: 2px solid hsl(243 75% 75%);
          outline-offset: 3px;
        }

        /* Spinner */
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ------------------------------------------------------------------ */
        /* Screen reader only                                                  */
        /* ------------------------------------------------------------------ */
        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border-width: 0;
        }

        /* ------------------------------------------------------------------ */
        /* Responsive                                                          */
        /* ------------------------------------------------------------------ */
        @media (max-width: 420px) {
          .login-panel { padding: 2rem 1.25rem; border-radius: 20px; }
          .login-title { font-size: 1.375rem; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export — wraps form in Suspense for useSearchParams
// ---------------------------------------------------------------------------
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

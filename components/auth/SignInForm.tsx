'use client';
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const verifyNotice = searchParams.get('verify') === '1';

  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailNotVerified(false);

    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.mustChangePassword && data.redirectTo) {
          window.location.assign(data.redirectTo);
          return;
        }

        if (
          res.status === 403 &&
          data &&
          typeof data.error === 'string' &&
          data.error.toLowerCase().includes('not verified')
        ) {
          setEmailNotVerified(true);
        } else {
          setError((data && data.error) || 'Sign in failed');
        }

        setLoading(false);
        return;
      }

      window.location.assign(data?.redirectTo || '/');
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Network error');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('loading');
    setResendError(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setResendError(
          (data && data.error) || 'Failed to resend verification email.',
        );
        setResendStatus('error');
        return;
      }

      setResendStatus('success');
    } catch {
      setResendError('Failed to resend verification email.');
      setResendStatus('error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md p-8 bg-white dark:bg-slate-900/80 shadow-xl rounded-xl"
    >
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      {verifyNotice && (
        <div className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
          Registration successful! Please check your email and verify your
          account before signing in.
        </div>
      )}

      {emailNotVerified && (
        <div className="mb-4 p-3 rounded bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm flex flex-col gap-2">
          <span>Your email is not verified. Please check your mailbox.</span>
          <button
            type="button"
            className="inline-flex items-center justify-center px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-fit text-sm"
            onClick={handleResend}
            disabled={resendStatus === 'loading'}
          >
            {resendStatus === 'loading'
              ? 'Sending...'
              : 'Send verification email again'}
          </button>

          {resendStatus === 'success' && (
            <span className="text-green-700">
              Verification email sent successfully!
            </span>
          )}

          {resendStatus === 'error' && (
            <span className="text-red-600">{resendError}</span>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Your password"
          required
          minLength={6}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="mt-2 text-sm text-indigo-600"
        >
          {showPassword ? 'Hide' : 'Show'} password
        </button>
      </div>

      <div className="flex items-center justify-between mt-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Remember me
        </label>

        <a
          href="/forgot-password"
          className="text-sm text-indigo-600 hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Sign Up
          </a>
        </div>
      </div>
    </form>
  );
}

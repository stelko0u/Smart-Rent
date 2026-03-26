'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  resendVerificationEmail,
  signInUser,
  type SignInResponse,
} from '@/lib/api/userApi';

type ResendStatus = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInForm() {
  const searchParams = useSearchParams();
  const verifyNotice = searchParams.get('verify') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  const validateEmail = (value: string) => EMAIL_REGEX.test(value.trim());

  const resetMessages = () => {
    setError(null);
    setEmailNotVerified(false);
    setResendError(null);
    setResendStatus('idle');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error || emailNotVerified || resendError) {
      setError(null);
      setEmailNotVerified(false);
      setResendError(null);
      setResendStatus('idle');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('Please enter your email.');
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      const data: SignInResponse = await signInUser({
        email: normalizedEmail,
        password,
        remember,
      });

      if (data.mustChangePassword && data.redirectTo) {
        window.location.assign(data.redirectTo);
        return;
      }

      window.location.assign(data.redirectTo || '/');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'EMAIL_NOT_VERIFIED') {
          setEmailNotVerified(true);
        } else {
          setError(err.message || 'Sign in failed');
        }
      } else {
        setError('Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const normalizedEmail = email.trim();

    setResendStatus('loading');
    setResendError(null);

    if (!normalizedEmail) {
      setResendError('Please enter your email first.');
      setResendStatus('error');
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setResendError('Please enter a valid email address.');
      setResendStatus('error');
      return;
    }

    try {
      await resendVerificationEmail(normalizedEmail);
      setResendStatus('success');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to resend verification email.';

      setResendError(message);
      setResendStatus('error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-xl dark:bg-slate-900/80"
    >
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}

      {verifyNotice && (
        <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-2 text-sm text-blue-700">
          Registration successful! Please check your email and verify your
          account before signing in.
        </div>
      )}

      {emailNotVerified && (
        <div className="mb-4 flex flex-col gap-2 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          <span>Your email is not verified. Please check your mailbox.</span>

          <button
            type="button"
            className="w-fit inline-flex items-center justify-center rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
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
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Your password"
          autoComplete="current-password"
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

      <div className="mt-4 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Remember me
        </label>

        <Link
          href="/forgot-password"
          className="text-sm text-indigo-600 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </form>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/api/userApi';

type FormStatus = 'idle' | 'loading' | 'success';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>('idle');

  const validateEmail = (value: string) => EMAIL_REGEX.test(value.trim());

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError(null);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    setError(null);

    if (!validateEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setStatus('loading');

      await requestPasswordReset(normalizedEmail);

      setStatus('success');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again later.';

      setError(message);
      setStatus('idle');
    }
  };

  const isDisabled = status === 'loading' || status === 'success';

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter the email address associated with your account. You will
            receive instructions to reset your password.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isDisabled}
              required
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          {status === 'success' && (
            <div className="text-sm text-green-700">
              If there is an account with this email, you will receive
              instructions on it.
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isDisabled}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending...' : 'Send Instructions'}
            </button>
          </div>
        </form>

        <footer className="mt-6 text-center text-sm text-gray-600">
          <span>Return to </span>
          <Link href="/signin" className="text-indigo-600 hover:underline">
            Sign In
          </Link>
        </footer>
      </div>
    </main>
  );
}

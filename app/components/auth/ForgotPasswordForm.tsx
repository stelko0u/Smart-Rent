'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setStatus('loading');
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        if (res.status === 404) {
          setError('No user found with this email address.');
        } else {
          setError('An error occurred. Please try again later.');
        }
        setStatus('idle');
        return;
      }

      setStatus('success');
    } catch (err: any) {
      setError('An error occurred. Please try again later.');
      setStatus('idle');
    }
  };

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
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
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
              disabled={status === 'loading' || status === 'success'}
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

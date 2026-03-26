'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useTranslation } from '@/providers/LanguageProvider';

type ForgotPasswordResponse = {
  ok?: boolean;
  success?: boolean;
  message?: string;
  error?: string;
};

export default function ForgotPasswordForm() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email.trim()) return t('validation.requiredEmail');

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) return t('validation.invalidEmail');

    return '';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data: ForgotPasswordResponse = await response
        .json()
        .catch(() => ({}));

      const hasExplicitFailure = data.ok === false || data.success === false;

      if (!response.ok || hasExplicitFailure) {
        setError(data.error || t('messages.unexpectedError'));
        return;
      }

      setSuccess(data.message || t('messages.resetEmailSent'));
      setEmail('');
    } catch {
      setError(t('messages.unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('auth.forgotPasswordTitle')}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('auth.forgotPasswordSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('common.email')}
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black text-black"
            placeholder="name@example.com"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-black text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t('auth.sending') : t('auth.requestResetLink')}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        {t('auth.rememberPassword')}{' '}
        <Link
          href="/signin"
          className="font-medium text-blue-600 hover:underline"
        >
          {t('auth.signInHere')}
        </Link>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from '@/providers/LanguageProvider';

type SignInResponse = {
  ok?: boolean;
  error?: string;
};

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  function validate() {
    if (!email.trim()) {
      return t('validation.requiredEmail');
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return t('validation.invalidEmail');
    }

    if (!password.trim()) {
      return t('validation.requiredPassword');
    }

    return '';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: SignInResponse = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setError(
          data.error === 'invalid_credentials'
            ? t('messages.invalidCredentials')
            : t('messages.unexpectedError'),
        );
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t('messages.unexpectedError'));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('auth.signInTitle')}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{t('auth.signInSubtitle')}</p>
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
            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('common.password')}
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-black text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t('auth.signingIn') : t('common.signIn')}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          {t('auth.forgotPassword')}
        </Link>

        <p className="text-gray-600">
          {t('auth.noAccount')}{' '}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:underline"
          >
            {t('auth.createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
}

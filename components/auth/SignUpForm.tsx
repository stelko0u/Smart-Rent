'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useTranslation } from '@/providers/LanguageProvider';

type SignUpResponse = {
  ok?: boolean;
  error?: string;
};

export default function SignUpForm() {
  const router = useRouter();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!firstName.trim()) return t('validation.requiredFirstName');
    if (!lastName.trim()) return t('validation.requiredLastName');
    if (!email.trim()) return t('validation.requiredEmail');

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) return t('validation.invalidEmail');

    if (!password.trim()) return t('validation.requiredPassword');
    if (password.length < 6) return t('validation.passwordMin');
    if (password !== confirmPassword) return t('validation.passwordsMismatch');

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

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          password,
          role: 'USER',
        }),
      });

      const data: SignUpResponse = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        setError(data.error || t('messages.unexpectedError'));
        setLoading(false);
        return;
      }

      setSuccess(t('messages.signUpSuccess'));
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/signin');
      }, 1200);
    } catch {
      setError(t('messages.unexpectedError'));
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('auth.signUpTitle')}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{t('auth.signUpSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('common.firstName')}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('common.lastName')}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('common.phone')}
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black"
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('common.confirmPassword')}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none transition focus:border-black"
            placeholder="••••••••"
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
          {loading ? t('auth.signingUp') : t('common.signUp')}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        {t('auth.alreadyHaveAccount')}{' '}
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

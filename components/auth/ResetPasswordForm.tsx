'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword, verifyResetToken } from '@/lib/api/userApi';
import { useTranslation } from '@/providers/LanguageProvider';

export default function ResetPasswordForm() {
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [invalidReason, setInvalidReason] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordsMatch = useMemo(
    () => password === confirmPassword,
    [password, confirmPassword],
  );
  const isPasswordValid = useMemo(
    () => password.trim().length >= 6,
    [password],
  );

  useEffect(() => {
    let isMounted = true;

    async function validateToken() {
      if (!email || !token) {
        if (!isMounted) return;
        setInvalidReason('Invalid link.');
        setIsTokenValid(false);
        setIsCheckingToken(false);
        return;
      }

      try {
        const data = await verifyResetToken({ email, token });

        if (!isMounted) return;

        if (data.valid) {
          setIsTokenValid(true);
          setInvalidReason('');
        } else {
          setIsTokenValid(false);
          setInvalidReason(data.reason || 'Invalid token.');
        }
      } catch {
        if (!isMounted) return;
        setIsTokenValid(false);
        setInvalidReason('Error verifying token.');
      } finally {
        if (isMounted) {
          setIsCheckingToken(false);
        }
      }
    }

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [email, token]);

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => {
      router.push('/signin');
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [success, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !token) {
      setError('Invalid reset link.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);

      await resetPassword({
        email,
        token,
        password,
      });

      setSuccess('Password has been successfully reset!');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Error resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingToken) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/public/authbg.jpg"
          alt=""
          fill
          priority
          quality={70}
          sizes="100vw"
          className="object-cover blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-black/25" />
        <p className="relative z-10 text-white">Verifying token...</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 max-w-md rounded-xl bg-white p-6 text-center shadow-md">
          <h2 className="mb-2 text-xl font-semibold text-red-600">
            Invalid link
          </h2>
          <p className="text-gray-600">{invalidReason}</p>

          <Link
            href="/forgot-password"
            className="mt-4 inline-block font-bold text-blue-800 hover:underline"
          >
            Send a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur-sm"
    >
      <h2 className="mb-5 text-center text-3xl font-bold text-gray-700">
        Reset password
      </h2>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {success && <p className="mb-3 text-sm text-green-600">{success}</p>}
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          New Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-medium text-gray-700">
          Confirm Password
        </span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>
      {!!confirmPassword && !passwordsMatch && (
        <p className="mb-3 text-sm text-red-500">Passwords do not match.</p>
      )}
      {!!password && !isPasswordValid && (
        <p className="mb-3 text-sm text-red-500">
          Password must be at least 6 characters long.
        </p>
      )}
      <div className="mt-4 text-sm text-gray-600">
        {t('auth.rememberPassword')}{' '}
        <Link
          href="/signin"
          className="font-medium text-blue-600 hover:underline"
        >
          {t('auth.signInHere')}
        </Link>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isSubmitting ? 'Submitting...' : 'Save New Password'}
      </button>
    </form>
  );
}

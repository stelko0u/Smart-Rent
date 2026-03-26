'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword, verifyResetToken } from '@/lib/api/userApi';

export default function ResetPasswordPage() {
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

  const passwordsMatch = useMemo(() => {
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const isPasswordValid = useMemo(() => {
    return password.trim().length >= 6;
  }, [password]);

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

    return () => {
      window.clearTimeout(timeout);
    };
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
      <div className="min-h-screen flex items-center justify-center">
        <p>Verifying token...</p>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-md">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md"
      >
        <h2 className="mb-4 text-center text-xl font-semibold text-gray-600">
          Reset password
        </h2>

        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
        {success && <p className="mb-2 text-sm text-green-600">{success}</p>}

        <label className="mb-3 block">
          <span className="text-gray-700">New Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border p-2 text-gray-500"
          />
        </label>

        <label className="mb-2 block">
          <span className="text-gray-700">Confirm Password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border p-2 text-gray-500"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Save New Password'}
        </button>
      </form>
    </div>
  );
}

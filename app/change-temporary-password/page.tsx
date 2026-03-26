'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { completeOnboarding } from '@/lib/api/authApi';

export default function ChangeTemporaryPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get('userId');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!userId) {
      setError('Invalid or missing user ID.');
    }
  }, [userId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userId) {
      setError('Invalid or missing user ID.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await completeOnboarding({
        userId,
        password,
      });

      setSuccess('Password has been successfully changed!');

      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error changing password.');
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Invalid link
          </h2>
          <p className="text-gray-600">The link is invalid or expired.</p>
          <a
            href="/signin"
            className="mt-4 inline-block text-blue-800 font-bold hover:underline"
          >
            Go back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-600">
          Change Temporary Password
        </h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

        <label className="block mb-3">
          <span className="text-gray-700">New Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border rounded-md p-2 text-gray-500"
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700">Confirm Password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="mt-1 block w-full border rounded-md p-2 text-gray-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Save New Password'}
        </button>
      </form>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOutUser } from '@/lib/api/authApi';

type BanInfo = {
  reason?: string | null;
  bannedAt?: string | null;
} | null;

export default function BannedPage() {
  const router = useRouter();
  const [banInfo, setBanInfo] = useState<BanInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadBanStatus() {
      try {
        const data = await getCurrentUser();

        if (!mounted) return;

        if (data.user?.banned) {
          setBanInfo({
            reason: data.user.banReason,
            bannedAt: data.user.bannedAt,
          });
        } else {
          router.replace('/');
        }
      } catch (err) {
        console.error('Failed to check ban status:', err);
        if (mounted) {
          router.replace('/');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBanStatus();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSignOut() {
    try {
      await signOutUser();
      router.replace('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Banned
          </h1>

          <p className="text-gray-600 mb-6">
            Your account has been banned and you cannot perform any actions.
          </p>

          {banInfo?.reason && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left">
              <p className="text-sm font-medium text-red-800 mb-1">Reason:</p>
              <p className="text-sm text-red-700">{banInfo.reason}</p>
            </div>
          )}

          {banInfo?.bannedAt && (
            <p className="text-sm text-gray-500 mb-6">
              Banned on: {new Date(banInfo.bannedAt).toLocaleDateString()}
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              If you believe this is a mistake, please contact support.
            </p>

            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

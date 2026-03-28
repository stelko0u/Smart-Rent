'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOutUser } from '@/lib/api/authApi';
import { TriangleExclamation } from '@/components/icons';
import Link from 'next/link';

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
            <TriangleExclamation className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Banned
          </h1>

          <p className="text-gray-600 mb-6">
            Your account has been banned and you cannot perform any actions.
          </p>

          {banInfo?.reason && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left flex gap-2">
              <p className="text-sm font-bold text-red-800 mb-1">Reason:</p>
              <p className="text-sm text-red-700">{banInfo.reason}</p>
            </div>
          )}

          {banInfo?.bannedAt && (
            <p className="text-sm text-gray-800 font-bold mb-6">
              Banned on: {new Date(banInfo.bannedAt).toLocaleDateString()}
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              If you believe this is a mistake, please contact support.
              <span>
                <Link
                  href="mailto:smartrentalpro@abv.bg"
                  className="text-sm text-blue-500 block"
                >
                  smartrentalpro@abv.bg
                </Link>
              </span>
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

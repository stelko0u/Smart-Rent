'use client';

import React, { useState } from 'react';
import { signOutUser } from '@/lib/api/userApi';

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await signOutUser();

      // по-добре от reload → гарантира чист state
      window.location.assign('/');
    } catch (err) {
      console.error('Logout error:', err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      type="button"
      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 hover:scale-105 transition-all cursor-pointer"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}

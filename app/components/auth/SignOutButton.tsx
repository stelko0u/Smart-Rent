'use client';
import React, { useState } from 'react';

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        window.location.reload();
      } else {
        console.error('Logout failed', await res.text());
        setLoading(false);
      }
    } catch (err) {
      console.error('Logout error', err);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
      disabled={loading}
      type="button"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}

'use client';

import { useEffect, useState } from 'react';

export interface CurrentUser {
  id: number;
  email: string;
  name: string; // match your API (or firstName/lastName if you prefer)
  role: string;
}

export function useCurrentUser() {
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Not authenticated');

        const data = await res.json(); // data has { ok: true, user: {...} }

        if (isMounted) setUserData(data.user); // ✅ unwrap user here
      } catch (err) {
        if (isMounted) setUserData(null);
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return { userData, loading, error, isAuthenticated: !!userData };
}

'use client';

import { useCallback, useEffect, useState } from 'react';

type AuthResponse<TUser> = {
  ok: boolean;
  user?: TUser;
  error?: string;
};

export function useCurrentUser<TUser = any>() {
  const [userData, setUserData] = useState<TUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        const data = (await res
          .json()
          .catch(() => null)) as AuthResponse<TUser> | null;
        setUserData(null);
        setError(data?.error || 'Not authenticated');
        return;
      }

      const data = (await res.json()) as AuthResponse<TUser>;
      setUserData(data.user ?? null);
    } catch (err) {
      console.error('Failed to load current user:', err);
      setUserData(null);
      setError('Failed to load current user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    userData,
    loading,
    error,
    isAuthenticated: !!userData,
    refresh: loadUser,
  };
}

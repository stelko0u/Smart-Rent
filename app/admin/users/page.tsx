'use client';

import React, { useEffect, useState } from 'react';

type User = {
  id: string | number;
  name: string;
  email?: string;
  role?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/users', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        if (res.status === 403) {
          throw new Error('Unauthorized — admin role required');
        }
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = await res.json();
        if (mounted) setUsers(Array.isArray(data) ? data : (data.users ?? []));
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6 bg-white min-h-full">
      <h1 className="text-2xl font-semibold mb-4">Admin — Manage Users</h1>

      {loading && <p>Loading users…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <>
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-black border">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{u.id}</td>
                      <td className="px-4 py-2 border">{u.name}</td>
                      <td className="px-4 py-2 border">{u.email ?? '—'}</td>
                      <td className="px-4 py-2 border">{u.role ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No users found.</p>
          )}
        </>
      )}
    </div>
  );
}

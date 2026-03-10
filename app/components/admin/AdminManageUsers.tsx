'use client';

import React, { useEffect, useState } from 'react';
import ReactModal from 'react-modal';

type User = {
  id: string | number;
  name?: string;
  email?: string;
  role?: string;
  banned?: boolean;
  bannedAt?: string;
  banReason?: string;
  emailVerified?: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | string | null>(
    null,
  );
  const [showBanModal, setShowBanModal] = useState(false);
  const [banUserId, setBanUserId] = useState<number | string | null>(null);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    load();
  }, []);

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
        const data = await res.json();
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  function openBanModal(id: number | string) {
    setBanUserId(id);
    setBanReason('');
    setShowBanModal(true);
  }

  function closeBanModal() {
    setShowBanModal(false);
    setBanUserId(null);
    setBanReason('');
  }

  async function confirmBan() {
    if (banReason.length < 0 || banReason.length > 500) {
      setError('Ban reason must be between 0 and 500 characters');
      setActionLoading(null);
      return;
    }
    if (banUserId === null) return;
    setShowBanModal(false);
    setActionLoading(banUserId);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: banUserId,
          action: 'ban',
          reason: banReason || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to ban user');
      }

      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to ban user');
    } finally {
      setActionLoading(null);
      setBanUserId(null);
      setBanReason('');
    }
  }

  async function handleUnban(id: number | string) {
    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'unban' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to unban user');
      }

      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to unban user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: number | string, userName?: string) {
    if (
      !confirm(
        `Are you sure you want to delete user ${userName || id}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to delete user');
      }

      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Manage Users
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View, manage, ban, and remove platform users.
            </p>
          </div>

          {!loading && users && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total Users
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {users.length}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">Loading users…</p>
          </div>
        )}

        {!loading && users && (
          <>
            {users.length > 0 ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-slate-700">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className={`transition ${
                            u.banned
                              ? 'bg-red-50/40 hover:bg-red-50'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                            #{u.id}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                {(u.name || u.email || '?')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {u.name || 'Unnamed User'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  User account
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-700">
                              {u.email || '—'}
                            </div>
                            {u.emailVerified === false && (
                              <div className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                                Unverified
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                u.role === 'ADMIN'
                                  ? 'bg-violet-100 text-violet-700'
                                  : u.role === 'COMPANY'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role || '—'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {u.banned ? (
                              <div className="space-y-1">
                                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                  Banned
                                </span>

                                {u.banReason && (
                                  <p className="max-w-xs text-xs text-slate-600">
                                    <span className="font-medium text-slate-700">
                                      Reason:
                                    </span>{' '}
                                    {u.banReason}
                                  </p>
                                )}

                                {u.bannedAt && (
                                  <p className="text-xs text-slate-400">
                                    {new Date(u.bannedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Active
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {u.role !== 'ADMIN' ? (
                                <>
                                  <button
                                    onClick={() =>
                                      u.banned
                                        ? handleUnban(u.id)
                                        : openBanModal(u.id)
                                    }
                                    disabled={actionLoading === u.id}
                                    className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition ${
                                      u.banned
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-amber-500 text-white hover:bg-amber-600'
                                    } disabled:cursor-not-allowed disabled:bg-slate-300`}
                                  >
                                    {actionLoading === u.id
                                      ? 'Processing...'
                                      : u.banned
                                        ? 'Unban'
                                        : 'Ban'}
                                  </button>

                                  <button
                                    onClick={() => handleDelete(u.id, u.name)}
                                    disabled={actionLoading === u.id}
                                    className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  >
                                    {actionLoading === u.id
                                      ? 'Processing...'
                                      : 'Delete'}
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium italic text-slate-500">
                                  Protected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <p className="text-lg font-medium text-slate-700">
                  No users found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  There are currently no users to display.
                </p>
              </div>
            )}
          </>
        )}

        {showBanModal && (
          <ReactModal
            isOpen={showBanModal}
            onRequestClose={closeBanModal}
            ariaHideApp={false}
            shouldCloseOnOverlayClick={true}
            className="relative z-50 w-full max-w-lg rounded-3xl bg-white p-0 shadow-2xl outline-none"
            overlayClassName="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          >
            <div className="overflow-hidden rounded-3xl">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  Ban User
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This action will restrict the selected user from accessing the
                  platform.
                </p>
              </div>

              <div className="px-6 py-5">
                <label
                  htmlFor="banReason"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Ban Reason
                </label>

                <textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={4}
                  placeholder="Enter reason for banning this user..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-slate-400">Maximum 500 characters</span>
                  <span
                    className={`${
                      banReason.length > 500 ? 'text-red-500' : 'text-slate-400'
                    }`}
                  >
                    {banReason.length}/500
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  onClick={closeBanModal}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmBan}
                  disabled={banReason.length <= 0 || banReason.length > 500}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Ban User
                </button>
              </div>
            </div>
          </ReactModal>
        )}
      </div>
    </div>
  );
}

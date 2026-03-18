'use client';

import React, { useEffect, useState } from 'react';

type Company = {
  id: number;
  name?: string | null;
  email?: string | null;
  maintenancePercent?: number;
  ownerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('company:created', handler);
    return () => window.removeEventListener('company:created', handler);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/companies', {
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }

      const json = await res.json();
      setCompanies(Array.isArray(json.companies) ? json.companies : []);
    } catch (err: any) {
      console.error('Load companies error:', err);
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: Company) {
    setEditingId(c.id);
    setForm({
      name: c.name ?? '',
      email: c.email ?? '',
      maintenancePercent: c.maintenancePercent ?? 0,
    });
  }

  async function saveEdit(id: number) {
    setError(null);
    try {
      const payload = {
        id,
        name: form.name,
        email: form.email,
        maintenancePercent: Number(form.maintenancePercent),
      };
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || `Save failed (${res.status})`);
      }

      await load();
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    }
  }

  async function del(id: number) {
    if (
      !confirm(
        'Are you sure you want to delete this company? This will also delete its owner user and all related data.',
      )
    )
      return;
    setError(null);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || `Delete failed (${res.status})`);
      }

      await load();
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Manage Companies
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View, edit, and manage company records.
          </p>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading companies...
              </p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <p className="text-base font-semibold text-slate-700">
                No companies found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Companies will appear here once they are created.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      ID
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Name
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Email
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Maintenance %
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Owner ID
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Created
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {companies.map((c, index) => (
                    <tr
                      key={c.id}
                      className={`transition hover:bg-slate-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          #{c.id}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {editingId === c.id ? (
                          <input
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="Company name"
                          />
                        ) : (
                          <span className="font-medium text-slate-900">
                            {c.name || '—'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {editingId === c.id ? (
                          <input
                            value={form.email}
                            onChange={(e) =>
                              setForm({ ...form, email: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="company@email.com"
                          />
                        ) : (
                          <span className="text-slate-600">
                            {c.email || '—'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {editingId === c.id ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={String(form.maintenancePercent)}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                maintenancePercent: e.target.value,
                              })
                            }
                            className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            {(c.maintenancePercent ?? 0).toFixed(2)}%
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {c.ownerId ?? '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="px-5 py-4">
                        {editingId === c.id ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => saveEdit(c.id)}
                              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEdit(c)}
                              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => del(c.id)}
                              className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

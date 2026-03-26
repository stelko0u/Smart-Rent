'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 400, width: '100%' }} className="p-4">
      Loading map...
    </div>
  ),
});

export default function CompanyOffices({ companyId }: { companyId: number }) {
  const [offices, setOffices] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyColors: Record<number, string> = {
    1: '#e11d48',
    2: '#2563eb',
    3: '#16a34a',
  };

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/company/offices', {
        credentials: 'include',
        cache: 'no-store',
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load offices');
      }

      setOffices(Array.isArray(data?.offices) ? data.offices : []);
    } catch (err: any) {
      console.error('Failed to load offices:', err);
      setError(err?.message || 'Failed to load offices');
      setOffices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ name: '', address: '' });
    setPos(null);
  }

  function startEdit(o: any) {
    setEditing(o);
    setPos(
      o?.latitude != null && o?.longitude != null
        ? [o.latitude, o.longitude]
        : null,
    );
  }

  async function save() {
    if (!editing) return;

    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        name: editing.name,
        address: editing.address,
        latitude: pos?.[0],
        longitude: pos?.[1],
        companyId,
      };

      if (editing.id) payload.id = editing.id;

      const method = editing.id ? 'PATCH' : 'POST';

      const res = await fetch('/api/company/offices', {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save office');
      }

      setEditing(null);
      await load();
    } catch (err: any) {
      console.error('Save office error:', err);
      setError(err?.message || 'Failed to save office');
    } finally {
      setSaving(false);
    }
  }

  async function del(id: number) {
    if (!confirm('Delete office?')) return;

    try {
      setError(null);

      const res = await fetch('/api/company/offices', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const text = await res.text();
      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete office');
      }

      await load();
    } catch (err: any) {
      console.error('Delete office error:', err);
      setError(err?.message || 'Failed to delete office');
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-2xl font-semibold text-gray-800">Offices</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage office locations and pin them on the map.
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <button
              onClick={startCreate}
              className="mb-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Add Office
            </button>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  Loading offices...
                </div>
              ) : offices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                  No offices yet. Add your first office.
                </div>
              ) : (
                offices.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-gray-800">
                          {o.name ?? `Office #${o.id}`}
                        </div>
                        <div className="mt-1 text-sm leading-5 text-gray-500">
                          {o.address}
                        </div>
                      </div>
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-indigo-500" />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => startEdit(o)}
                        className="flex-1 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(o.id)}
                        className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Office Map
              </h3>
            </div>

            <div className="p-3">
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <MapComponent
                  offices={offices}
                  editing={editing}
                  pos={pos}
                  setPos={setPos}
                  companyColors={companyColors}
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editing.id ? 'Edit Office' : 'Create Office'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update the office details and choose its location on the map.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="office-name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Office Name
                  </label>
                  <input
                    id="office-name"
                    value={editing.name ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    placeholder="Enter office name"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="office-address"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <input
                    id="office-address"
                    value={editing.address ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, address: e.target.value })
                    }
                    placeholder="Enter office address"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm text-gray-600">
                  Click on the map to set office coordinates.
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? 'Saving…' : 'Save Office'}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

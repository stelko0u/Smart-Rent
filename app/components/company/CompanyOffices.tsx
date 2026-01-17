'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: 400, width: '100%' }}>Loading map...</div>
});

export default function CompanyOffices({ companyId }: { companyId: number }) {
  const [offices, setOffices] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);

  const companyColors: Record<number, string> = {
    1: '#e11d48', // red
    2: '#2563eb', // blue
    3: '#16a34a', // green
  };
  async function load() {
    const res = await fetch('/api/company/offices', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return;
    const j = await res.json();
    setOffices(Array.isArray(j) ? j : []);
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
    setPos(o.latitude && o.longitude ? [o.latitude, o.longitude] : null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
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
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      await load();
    }
  }

  async function del(id: number) {
    if (!confirm('Delete office?')) return;
    const res = await fetch('/api/company/offices', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Offices</h2>
      <div className="flex gap-6">
        <div className="w-1/3">
          <button
            onClick={startCreate}
            className="mb-3 px-3 py-2 bg-indigo-600 text-white rounded"
          >
            Add office
          </button>
          {offices.map((o) => (
            <div key={o.id} className="p-2 border rounded mb-2">
              <div className="font-semibold">{o.name ?? `Office #${o.id}`}</div>
              <div className="text-sm">{o.address}</div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => startEdit(o)}
                  className="px-2 py-1 bg-yellow-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => del(o.id)}
                  className="px-2 py-1 bg-red-200 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

<div className="flex-1">
          <MapComponent
            offices={offices}
            editing={editing}
            pos={pos}
            setPos={setPos}
            companyColors={companyColors}
          />

          {editing && (
            <div className="mt-3">
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="Name"
                className="px-3 py-2 border rounded w-full mb-2"
              />
              <input
                value={editing.address}
                onChange={(e) =>
                  setEditing({ ...editing, address: e.target.value })
                }
                placeholder="Address"
                className="px-3 py-2 border rounded w-full mb-2"
              />
              <div className="mb-2 text-sm text-gray-600">
                Click on the map to set coordinates.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

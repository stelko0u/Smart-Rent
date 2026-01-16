'use client';

import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { CarFormValues } from 'types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editing: CarFormValues | null;
  onChange: (v: CarFormValues | null) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  busy: boolean;
  error: string | null;
};

type Office = { id: number; name?: string | null; address?: string | null };

export default function EditCarModal({
  isOpen,
  onClose,
  editing,
  onChange,
  onSubmit,
  busy,
  error,
}: Props) {
  const [offices, setOffices] = useState<Office[]>([]);

  useEffect(() => {
    fetch('/api/company/offices', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setOffices(Array.isArray(j.offices) ? j.offices : []))
      .catch(() => setOffices([]));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Edit Car"
      overlayClassName="
        fixed inset-0
        flex items-center justify-center
        bg-black/20
        backdrop-blur-lg
        backdrop-saturate-150
      "
      className="
        bg-white/70
        backdrop-blur-xl
        rounded-2xl
        p-6
        w-full
        max-w-md
        shadow-2xl
        outline-none
      "
    >
      <h2 className="text-lg font-semibold mb-4">Edit car</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {editing && (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Make */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-black/70">Make</span>
            <input
              className="px-3 py-2 rounded-lg border border-black/10 bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={editing.make}
              onChange={(e) => onChange({ ...editing, make: e.target.value })}
              required
            />
          </label>

          {/* Model */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-black/70">Model</span>
            <input
              className="px-3 py-2 rounded-lg border border-black/10 bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={editing.model}
              onChange={(e) => onChange({ ...editing, model: e.target.value })}
              required
            />
          </label>

          {/* Year */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-black/70">Year</span>
            <input
              type="number"
              className="px-3 py-2 rounded-lg border border-black/10 bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={String(editing.year)}
              onChange={(e) =>
                onChange({
                  ...editing,
                  year: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              required
            />
          </label>

          {/* Price per day */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-black/70">Price per day</span>
            <input
              type="number"
              className="px-3 py-2 rounded-lg border border-black/10 bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={String(editing.pricePerDay)}
              onChange={(e) =>
                onChange({
                  ...editing,
                  pricePerDay:
                    e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              required
            />
          </label>

          {/* Office select */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-black/70">Office</span>
            <select
              value={
                editing.officeId === null || editing.officeId === undefined
                  ? ''
                  : String(editing.officeId)
              }
              onChange={(e) =>
                onChange({
                  ...editing,
                  officeId: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
              className="px-3 py-2 rounded-lg border border-black/10 bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No specific office</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name ?? o.address ?? `Office #${o.id}`}
                </option>
              ))}
            </select>
          </label>

          {/* Actions */}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-black/5 hover:bg-black/10 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white
                         hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

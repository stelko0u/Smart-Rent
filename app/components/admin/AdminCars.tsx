"use client";

import React, { useEffect, useState } from "react";

type CarRow = {
  id: number;
  make: string;
  model: string;
  year?: number;
  pricePerDay?: number;
  company?: { id: number; name?: string | null } | null;
};

export default function AdminCars() {
  const [cars, setCars] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cars", { credentials: "include" });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const json = await res.json();
      setCars(Array.isArray(json.cars) ? json.cars : []);
    } catch (err: any) {
      setError(err.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete car?")) return;
    try {
      const res = await fetch("/api/admin/cars", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Delete failed (${res.status}) ${txt}`);
      }
      setCars((c) => c.filter((x) => x.id !== id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Cars</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : cars.length === 0 ? (
        <div>No cars</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2 border">ID</th>
                <th className="px-3 py-2 border">Make</th>
                <th className="px-3 py-2 border">Model</th>
                <th className="px-3 py-2 border">Year</th>
                <th className="px-3 py-2 border">Price / day</th>
                <th className="px-3 py-2 border">Company</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border">{c.id}</td>
                  <td className="px-3 py-2 border">{c.make}</td>
                  <td className="px-3 py-2 border">{c.model}</td>
                  <td className="px-3 py-2 border">{c.year ?? "—"}</td>
                  <td className="px-3 py-2 border">{c.pricePerDay ?? "—"}</td>
                  <td className="px-3 py-2 border">{c.company?.name ?? "—"}</td>
                  <td className="px-3 py-2 border">
                    <button className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded mr-2">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

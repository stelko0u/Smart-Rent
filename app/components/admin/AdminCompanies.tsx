"use client";

import React, { useEffect, useState } from "react";

type Company = {
  id: number;
  name?: string | null;
  email?: string | null;
  maintenancePercent?: number;
  ownerId?: number | null;
  createdAt?: string;
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
    window.addEventListener("company:created", handler);
    return () => window.removeEventListener("company:created", handler);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/companies", { credentials: "include" });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const json = await res.json();
      setCompanies(Array.isArray(json.companies) ? json.companies : []);
    } catch (err: any) {
      setError(err.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: Company) {
    setEditingId(c.id);
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
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
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}) ${txt}`);
      }
      await load();
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || "Save failed");
    }
  }

  async function del(id: number) {
    if (
      !confirm(
        "Are you sure you want to delete this company? This will also try to delete its owner user."
      )
    )
      return;
    setError(null);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Delete failed (${res.status}) ${txt}`);
      }
      await load();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Manage Companies</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : companies.length === 0 ? (
        <div>No companies</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2 border">ID</th>
                <th className="px-3 py-2 border">Name</th>
                <th className="px-3 py-2 border">Email</th>
                <th className="px-3 py-2 border">Maintenance %</th>
                <th className="px-3 py-2 border">OwnerId</th>
                <th className="px-3 py-2 border">Created</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border">{c.id}</td>
                  <td className="px-3 py-2 border">
                    {editingId === c.id ? (
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="px-2 py-1 border rounded w-48"
                      />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td className="px-3 py-2 border">
                    {editingId === c.id ? (
                      <input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="px-2 py-1 border rounded w-48"
                      />
                    ) : (
                      c.email
                    )}
                  </td>
                  <td className="px-3 py-2 border">
                    {editingId === c.id ? (
                      <input
                        type="number"
                        value={String(form.maintenancePercent)}
                        onChange={(e) => setForm({ ...form, maintenancePercent: e.target.value })}
                        className="px-2 py-1 border rounded w-20"
                      />
                    ) : (
                      (c.maintenancePercent ?? 0) + " %"
                    )}
                  </td>
                  <td className="px-3 py-2 border">{c.ownerId ?? "—"}</td>
                  <td className="px-3 py-2 border">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 border">
                    {editingId === c.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(c.id)}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 border rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(c)}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => del(c.id)}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded"
                        >
                          Delete
                        </button>
                      </>
                    )}
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

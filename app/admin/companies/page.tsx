"use client";
import React, { useEffect, useState } from "react";

type Company = {
  id: number;
  name?: string | null;
  email: string;
  maintenancePercent: number;
  ownerId: number;
  createdAt: string;
};

export default function ManageCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed loading");
      setCompanies(data?.companies || []);
    } catch (err: any) {
      setError(err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateMaintenance(id: number, value: number) {
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, maintenancePercent: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      await load();
    } catch (err: any) {
      setError(err?.message || "Update error");
    }
  }

  async function removeCompany(id: number) {
    if (!confirm("Delete company and its owner user? This action is irreversible.")) return;
    try {
      const res = await fetch("/api/admin/companies", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      await load();
    } catch (err: any) {
      setError(err?.message || "Delete error");
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Manage Companies</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {!loading && companies.length === 0 && <div>No companies found.</div>}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">% Maintenance</th>
              <th className="p-2 border">OwnerId</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border">{c.id}</td>
                <td className="p-2 border">{c.name ?? "-"}</td>
                <td className="p-2 border">{c.email}</td>
                <td className="p-2 border">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={c.maintenancePercent}
                    onBlur={(e) => {
                      const v = Number(e.currentTarget.value);
                      if (!Number.isFinite(v) || v < 0 || v > 100) {
                        setError("Maintenance must be 0-100");
                        return;
                      }
                      if (v !== c.maintenancePercent) updateMaintenance(c.id, v);
                    }}
                    className="w-20 border p-1"
                  />
                </td>
                <td className="p-2 border">{c.ownerId}</td>
                <td className="p-2 border">{new Date(c.createdAt).toLocaleString()}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => removeCompany(c.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

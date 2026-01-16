"use client";

import React, { useState } from "react";

export default function AdminAddCompany() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [maintenancePercent, setMaintenancePercent] = useState<number | "">(0);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        maintenancePercent: maintenancePercent === "" ? 0 : Number(maintenancePercent),
        password: String(password),
      };

      const res = await fetch("/api/admin/companies", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Create failed (${res.status})`);
      try {
        window.dispatchEvent(new CustomEvent("company:created"));
      } catch {}
      setOk("Company and owner user created");
      setName("");
      setEmail("");
      setMaintenancePercent(0);
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Add Company</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {ok && <div className="mb-3 text-green-600">{ok}</div>}
      <form onSubmit={submit} className="max-w-md flex flex-col gap-3">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border rounded"
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 border rounded"
          required
        />
        <input
          placeholder="Maintenance percent (0-100)"
          type="number"
          value={maintenancePercent === "" ? "" : String(maintenancePercent)}
          onChange={(e) =>
            setMaintenancePercent(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="px-3 py-2 border rounded"
        />
        <input
          placeholder="Password for owner user"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-3 py-2 border rounded"
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import { createCompany } from '@/lib/api/companyApi';

export default function AddCompanyPage() {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [maintenance, setMaintenance] = useState<number | ''>('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (maintenance === '') {
      setMsg('Maintenance percent is required');
      return;
    }

    try {
      setLoading(true);
      setMsg('Creating...');

      await createCompany({
        name: companyName,
        email,
        password,
        maintenancePercent: Number(maintenance),
      });

      setMsg('Company created');
      setCompanyName('');
      setEmail('');
      setPassword('');
      setMaintenance('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-xl font-semibold mb-4">Add Company</h2>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Company Name</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            type="text"
            required
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block text-sm">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block text-sm">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block text-sm">% Maintenance</label>
          <input
            value={maintenance}
            onChange={(e) =>
              setMaintenance(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            type="number"
            min={0}
            max={100}
            required
            className="w-full border p-2"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Company'}
          </button>
        </div>

        <div className="text-sm text-gray-700">{msg}</div>
      </form>
    </div>
  );
}

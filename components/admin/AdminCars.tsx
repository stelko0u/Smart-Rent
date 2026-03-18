'use client';

import React, { useEffect, useMemo, useState } from 'react';

type CarRow = {
  id: number;
  make: string;
  model: string;
  year?: number;
  pricePerDay?: number;
  companyId?: number;
  images?: Array<string>;
};

type Company = {
  id: number;
  name: string;
};

export default function AdminCars() {
  const [cars, setCars] = useState<CarRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [carsRes, companiesRes] = await Promise.all([
        fetch('/api/admin/cars', {
          credentials: 'include',
        }),
        fetch('/api/admin/companies', {
          credentials: 'include',
        }),
      ]);

      if (!carsRes.ok) {
        throw new Error(`Load cars failed (${carsRes.status})`);
      }

      if (!companiesRes.ok) {
        throw new Error(`Load companies failed (${companiesRes.status})`);
      }

      const carsJson = await carsRes.json();
      const companiesJson = await companiesRes.json();

      const carsData = Array.isArray(carsJson.cars) ? carsJson.cars : [];
      const companiesData = Array.isArray(companiesJson.companies)
        ? companiesJson.companies
        : [];

      console.log(carsData); // Проверете какви данни връща API-то за колите

      setCars(carsData);
      setCompanies(companiesData);
    } catch (err: any) {
      setError(err.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete car?')) return;

    try {
      const res = await fetch('/api/admin/cars', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Delete failed (${res.status}) ${txt}`);
      }

      setCars((prev) => prev.filter((car) => car.id !== id));
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  }

  const companyMap = useMemo(() => {
    return new Map(companies.map((company) => [company.id, company.name]));
  }, [companies]);

  const getCompanyName = (companyId?: number) => {
    if (!companyId) return 'No company';
    return companyMap.get(companyId) ?? 'Unknown company';
  };

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                Vehicle list
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                View, edit, and remove cars from the catalog.
              </p>
            </div>

            <button
              onClick={load}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-75 items-center justify-center px-6 py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
              <p className="text-sm font-semibold text-slate-700">
                Loading cars...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Please wait while data is being fetched.
              </p>
            </div>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex min-h-75 items-center justify-center px-6 py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-3xl shadow-sm">
                🚘
              </div>
              <h4 className="text-lg font-semibold text-slate-900">
                No cars found
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                There are currently no vehicles in the system.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Car</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-6 py-4">Price / day</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cars.map((car, index) => (
                  <tr
                    key={car.id}
                    className={`transition hover:bg-blue-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        #{car.id}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                          {car.images?.length ? (
                            <img
                              src={car.images[0]}
                              alt={`${car.make} ${car.model}`}
                              className="h-full w-full object-cover transition duration-300 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {car.make} {car.model}
                          </p>
                          
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {car.year ?? '—'}
                    </td>

                    <td className="px-6 py-4">
                      {car.pricePerDay ? (
                        <span className="inline-flex items-baseline rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
                          ${car.pricePerDay}
                          <span className="ml-1 text-sm font-medium text-emerald-600/80">
                            / day
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {getCompanyName(car.companyId)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100">
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(car.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import React, { useEffect, useState } from 'react';

type ReportItem = {
  reservationId: number | null;
  customerName: string;
  customerEmail: string;
  carLabel: string;
  amount: number;
  platformFee: number;
  companyEarnings: number;
  paidAt: string;
};

type ReportSummary = {
  totalRevenue: number;
  platformFee: number;
  companyEarnings: number;
  paymentsCount: number;
};

function money(value?: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

function defaultStart() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function defaultEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function CompanyReports() {
  const [startDate, setStartDate] = useState(defaultStart());
  const [endDate, setEndDate] = useState(defaultEnd());
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReport() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/company/reports?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load report');
      }

      setSummary(data.summary || null);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  function downloadPdf() {
    const url = `/api/company/reports?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&format=pdf`;
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-1">
            Месечен/периодичен отчет с PDF export.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 w-full border border-gray-300 rounded-xl px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 w-full border border-gray-300 rounded-xl px-3"
              />
            </div>

            <button
              onClick={loadReport}
              disabled={loading}
              className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load report'}
            </button>

            <button
              onClick={downloadPdf}
              className="h-11 px-4 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700"
            >
              Export PDF
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Payments</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {summary.paymentsCount}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Gross</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {money(summary.totalRevenue)}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Fee</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">
              {money(summary.platformFee)}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Net</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">
              {money(summary.companyEarnings)}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Payments in range
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Reservation
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Car
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Gross
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Net
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Paid at
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No payments in selected range.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={`${item.reservationId}-${idx}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-700">
                      {item.reservationId ? `#${item.reservationId}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <div>{item.customerName || '—'}</div>
                      {item.customerEmail && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.customerEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.carLabel || '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {money(item.amount)}
                    </td>
                    <td className="px-6 py-4 font-medium text-red-600">
                      {money(item.platformFee)}
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      {money(item.companyEarnings)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(item.paidAt).toLocaleDateString('bg-BG')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

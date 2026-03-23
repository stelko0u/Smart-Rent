'use client';

import React, { useEffect, useMemo, useState } from 'react';

type InvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  currency: string;
  total: number;
  amount_due: number;
  amount_paid: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  created: number;
  due_date: number | null;
  reservationId: number;
  customerEmail: string;
  customerName: string;
  grossAmount: number;
  platformFee: number;
  companyEarnings: number;
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value ?? 0);
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return '—';
  return new Date(timestamp * 1000).toLocaleDateString('bg-BG');
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'open':
      return 'bg-amber-100 text-amber-700';
    case 'void':
      return 'bg-gray-100 text-gray-600';
    case 'draft':
      return 'bg-blue-100 text-blue-700';
    case 'uncollectible':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function CompanyInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadInvoices() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/company/invoices', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load invoices');
      }

      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => b.created - a.created);
  }, [invoices]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Invoices</h2>
            <p className="text-sm text-gray-500 mt-1">
              Всички клиентски фактури, изпратени след card плащане.
            </p>
          </div>

          <button
            onClick={loadInvoices}
            disabled={loading}
            className="h-11 px-4 rounded-xl bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Invoices</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {sortedInvoices.length}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Gross total</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">
              {formatMoney(
                sortedInvoices.reduce(
                  (sum, item) => sum + (item.grossAmount || 0),
                  0,
                ),
                'eur',
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Platform fee</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">
              {formatMoney(
                sortedInvoices.reduce(
                  (sum, item) => sum + (item.platformFee || 0),
                  0,
                ),
                'eur',
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Net to company</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">
              {formatMoney(
                sortedInvoices.reduce(
                  (sum, item) => sum + (item.companyEarnings || 0),
                  0,
                ),
                'eur',
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="px-6 py-10 text-sm text-gray-500">
            Loading invoices...
          </div>
        ) : sortedInvoices.length === 0 ? (
          <div className="px-6 py-10 text-sm text-gray-500">
            Няма изпратени клиентски фактури.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-white">
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Reservation</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Gross</th>
                <th className="px-6 py-4">Fee</th>
                <th className="px-6 py-4">Net</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {sortedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-700">
                    {invoice.number || invoice.id}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {invoice.reservationId ? `#${invoice.reservationId}` : '—'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {invoice.customerName || '—'}
                    </div>
                    {invoice.customerEmail && (
                      <div className="text-xs text-gray-500 mt-1">
                        {invoice.customerEmail}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(invoice.status)}`}
                    >
                      {invoice.status || 'unknown'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {formatMoney(
                      invoice.grossAmount || invoice.total,
                      invoice.currency,
                    )}
                  </td>

                  <td className="px-6 py-4 text-red-600 font-medium">
                    {formatMoney(invoice.platformFee || 0, invoice.currency)}
                  </td>

                  <td className="px-6 py-4 text-green-600 font-medium">
                    {formatMoney(
                      invoice.companyEarnings || 0,
                      invoice.currency,
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(invoice.created)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.hosted_invoice_url && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Open
                        </a>
                      )}

                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

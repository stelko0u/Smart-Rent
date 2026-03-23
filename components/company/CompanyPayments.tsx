'use client';

import React, { useEffect, useState } from 'react';

interface Payment {
  source?: 'stripe' | 'database';
  id?: number;
  reservationId: number | null;
  paymentIntentId?: string;
  chargeId?: string | null;
  amount: number;
  platformFee: number;
  companyEarnings: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt?: string;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  carLabel?: string;
}

function money(value?: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

export default function CompanyPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPlatformFee, setTotalPlatformFee] = useState(0);
  const [source, setSource] = useState<'stripe' | 'database'>('stripe');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/company/payments', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load payments');
      }

      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setTotalEarnings(Number(data.totalEarnings || 0));
      setTotalRevenue(Number(data.totalRevenue || 0));
      setTotalPlatformFee(Number(data.totalPlatformFee || 0));
      setSource(data.source === 'database' ? 'database' : 'stripe');
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-gray-500">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
          <p className="text-gray-600 mt-1">
            Stripe-first payments list with database fallback
          </p>
        </div>

        <div
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            source === 'stripe'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          Source: {source === 'stripe' ? 'Stripe' : 'Database'}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Total revenue</div>
          <div className="text-3xl font-bold mt-2">{money(totalRevenue)}</div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-500">Platform fee</div>
          <div className="text-3xl font-bold mt-2 text-red-600">
            {money(totalPlatformFee)}
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="text-sm opacity-90">Net earnings</div>
          <div className="text-3xl font-bold mt-2">{money(totalEarnings)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Car
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No payments yet
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => (
                  <tr
                    key={`${payment.paymentIntentId || payment.id || index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">
                        {payment.paymentIntentId || `#${payment.id}`}
                      </div>
                      {payment.chargeId && (
                        <div className="text-xs text-gray-500 mt-1">
                          {payment.chargeId}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.reservationId
                        ? `#${payment.reservationId}`
                        : '—'}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>{payment.customerName || '—'}</div>
                      {payment.customerEmail && (
                        <div className="text-xs text-gray-500 mt-1">
                          {payment.customerEmail}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {payment.carLabel || '—'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {money(payment.amount)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {money(payment.platformFee)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {money(payment.companyEarnings)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod === 'CARD'
                        ? 'Online Card'
                        : payment.paymentMethod}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.paymentStatus)}`}
                      >
                        {payment.paymentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString('bg-BG')
                        : new Date(payment.createdAt).toLocaleDateString(
                            'bg-BG',
                          )}
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

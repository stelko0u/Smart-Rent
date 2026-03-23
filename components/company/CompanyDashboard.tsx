'use client';

import React, { useEffect, useState } from 'react';
import { BadgeDollar, Cars, Check, Clipboard, Clock } from '../icons';

interface DashboardStats {
  totalRevenue: number;
  platformFee: number;
  companyEarnings: number;
  totalReservations: number;
  pendingReservations: number;
  completedReservations: number;
  totalCars: number;
  maintenancePercent: number;
  balanceAvailable: number;
  balancePending: number;
  moneySource: 'stripe' | 'database';
}

interface RecentReservation {
  id: number;
  carMake: string;
  carModel: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  customerName: string;
}

function money(value?: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

export default function CompanyDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<
    RecentReservation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/company/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load dashboard data');
      }

      setStats(data.stats);
      setRecentReservations(data.recentReservations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
      case 'RETURNED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Stripe-first overview with database fallback
          </p>
        </div>

        <div
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            stats?.moneySource === 'stripe'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          Source: {stats?.moneySource === 'stripe' ? 'Stripe' : 'Database'}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
            <BadgeDollar className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-3xl font-bold">{money(stats?.totalRevenue)}</p>
          <p className="text-sm mt-2 opacity-80">Successful card payments</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Platform Fee</h3>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              {Number(stats?.maintenancePercent || 0).toFixed(2)}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {money(stats?.platformFee)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Real Stripe fee totals</p>
        </div>

        <div className="bg-linear-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Net Earnings</h3>
            <div className="p-2 bg-green-700 text-white rounded-full">
              <Check className="w-5 h-5 opacity-80" />
            </div>
          </div>
          <p className="text-3xl font-bold">{money(stats?.companyEarnings)}</p>
          <p className="text-sm mt-2 opacity-80">After platform fee</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">
              Stripe Balance
            </h3>
            <BadgeDollar className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            Available: {money(stats?.balanceAvailable)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pending: {money(stats?.balancePending)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clipboard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalReservations || 0}
              </p>
              <p className="text-sm text-gray-600">Total Reservations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pendingReservations || 0}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.completedReservations || 0}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Cars className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalCars || 0}
              </p>
              <p className="text-sm text-gray-600">Total Cars</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Reservations
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Latest bookings for your vehicles
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Car
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentReservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No reservations yet
                  </td>
                </tr>
              ) : (
                recentReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {reservation.carMake} {reservation.carModel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reservation.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        {new Date(reservation.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        {new Date(reservation.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {money(reservation.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}
                      >
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reservation.paymentStatus}
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

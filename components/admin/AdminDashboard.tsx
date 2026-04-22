'use client';

import { fetchDashboardStats } from '@/lib/api/adminApi';
import React, { useEffect, useState } from 'react';
import { DashboardStats } from '@/types/types';
import { useTranslation } from '@/providers/LanguageProvider';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch {
      setError(t('adminDashboard.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="p-4 sm:p-6">
        <div className="text-center py-8">{t('common.loading')}</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-4 sm:p-6">
        <div className="text-red-600 text-center py-8">{error}</div>
      </section>
    );
  }

  if (!stats) return null;

  return (
    <section className="space-y-5 p-4 sm:space-y-6 sm:p-6">
      <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">{t('adminDashboard.statisticsOverview')}</h2>

      {/* General statistics */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="text-sm text-gray-600 mb-1">{t('adminDashboard.totalCompanies')}</div>
          <div className="text-2xl font-bold text-blue-600 sm:text-3xl">
            {stats.totalCompanies}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="text-sm text-gray-600 mb-1">{t('adminDashboard.totalReservations')}</div>
          <div className="text-2xl font-bold text-green-600 sm:text-3xl">
            {stats.totalReservations}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="text-sm text-gray-600 mb-1">{t('adminDashboard.platformRevenue')}</div>
          <div className="text-2xl font-bold text-purple-600 sm:text-3xl">
            {stats.platformRevenue.toFixed(2)} €
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {t('adminDashboard.monthly')}: {stats.monthlyPlatformRevenue.toFixed(2)} €
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="text-sm text-gray-600 mb-1">{t('adminDashboard.companyRevenue')}</div>
          <div className="text-2xl font-bold text-orange-600 sm:text-3xl">
            {stats.totalRevenue.toFixed(2)} €
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {t('adminDashboard.monthly')}: {stats.monthlyRevenue.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Companies table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">{t('adminDashboard.companyStatistics')}</h3>
        </div>

        <div className="divide-y divide-gray-200 sm:hidden">
          {stats.companiesStats.map((company) => (
            <article key={company.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-gray-900">{company.name}</p>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {company.reservationsCount} {t('adminDashboard.reservations')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-gray-500">{t('adminDashboard.revenue')}</p>
                  <p className="mt-1 font-semibold text-green-600">{company.revenue} €</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-gray-500">{t('adminDashboard.platformFee')}</p>
                  <p className="mt-1 font-semibold text-purple-600">{company.platformFee} €</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-gray-500">{t('adminDashboard.monthlyRevenue')}</p>
                  <p className="mt-1 font-medium text-gray-800">{company.monthlyRevenue} €</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-gray-500">{t('adminDashboard.monthlyFee')}</p>
                  <p className="mt-1 font-medium text-gray-800">{company.monthlyPlatformFee} €</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="min-w-190 w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('adminDashboard.company')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('adminDashboard.reservations')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('adminDashboard.revenue')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('adminDashboard.platformFee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('adminDashboard.monthlyRevenue')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('adminDashboard.monthlyFee')}
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {stats.companiesStats.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {company.name}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.reservationsCount}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {company.revenue} €
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-purple-600">
                      {company.platformFee} €
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.monthlyRevenue} €
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.monthlyPlatformFee} €
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

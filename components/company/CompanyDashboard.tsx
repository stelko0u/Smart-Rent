'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BadgeDollar, Cars, Check, Clipboard, Clock } from '../icons';
import { MetricCard } from '../ui/MetricCard';
import {
  getCompanyDashboard,
  getCompanyPayments,
  getStripeLoginLink,
} from '@/lib/api/companyApi';
import { useTranslation } from '@/providers/LanguageProvider';
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

interface PaymentBreakdown {
  onlineRevenue: number;
  cashRevenue: number;
  onlineCount: number;
  cashCount: number;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'accent' | 'success' | 'surface';
  badge?: string;
}

function money(value?: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function normalizeStatus(status: string) {
  return status.replaceAll('_', ' ').toLowerCase();
}

function getStatusClassName(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'IN_PROGRESS':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'COMPLETED':
    case 'RETURNED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'CANCELLED':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

function getPaymentClassName(status: string) {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'SUCCEEDED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'PENDING':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'FAILED':
    case 'CANCELED':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

function isPaidPayment(payment: Payment) {
  const status = payment.paymentStatus.toUpperCase();
  return status === 'PAID' || status === 'SUCCEEDED';
}

function isOnlinePayment(paymentMethod: string) {
  const normalized = paymentMethod.toUpperCase();
  return normalized === 'CARD' || normalized === 'ONLINE';
}

function isCashPayment(paymentMethod: string) {
  const normalized = paymentMethod.toUpperCase();
  return normalized === 'CASH' || normalized === 'ON_SPOT';
}

function buildPaymentBreakdown(payments: Payment[]): PaymentBreakdown {
  return payments.reduce<PaymentBreakdown>(
    (accumulator, payment) => {
      if (!isPaidPayment(payment)) {
        return accumulator;
      }

      const amount = Number(payment.amount || 0);

      if (isOnlinePayment(payment.paymentMethod)) {
        accumulator.onlineRevenue += amount;
        accumulator.onlineCount += 1;
      } else if (isCashPayment(payment.paymentMethod)) {
        accumulator.cashRevenue += amount;
        accumulator.cashCount += 1;
      }

      return accumulator;
    },
    {
      onlineRevenue: 0,
      cashRevenue: 0,
      onlineCount: 0,
      cashCount: 0,
    },
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'surface',
  badge,
}: StatCardProps) {
  const variantClassName =
    variant === 'accent'
      ? 'border-transparent bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_20px_60px_rgba(99,102,241,0.28)]'
      : variant === 'success'
        ? 'border-transparent bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-[0_20px_60px_rgba(34,197,94,0.22)]'
        : 'border-gray-200 bg-white text-gray-900 shadow-sm';

  const mutedClassName =
    variant === 'surface' ? 'text-gray-500' : 'text-white/80';

  const iconWrapperClassName =
    variant === 'surface'
      ? 'bg-gray-100 text-gray-500'
      : 'bg-white/15 text-white';

  return (
    <div className={`rounded-3xl border p-4 sm:p-6 ${variantClassName}`}>
      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${mutedClassName}`}>{title}</p>
          <p className="mt-2 truncate text-3xl font-bold tracking-tight sm:mt-3 sm:text-4xl">{value}</p>
        </div>

        <div className={`shrink-0 rounded-2xl p-2.5 sm:p-3 ${iconWrapperClassName}`}>{icon}</div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm ${mutedClassName}`}>{subtitle}</p>
        {badge ? (
          <span
            className={
              variant === 'surface'
                ? 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600'
                : 'rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white'
            }
          >
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<
    RecentReservation[]
  >([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [dashboardData, paymentsData] = await Promise.all([
          getCompanyDashboard(),
          getCompanyPayments(),
        ]);

        setStats(dashboardData.stats);
        setRecentReservations(dashboardData.recentReservations);
        setPayments(paymentsData.payments);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : t('companyDashboard.failedLoad'),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  const collectionRate = useMemo(() => {
    if (!stats || stats.totalReservations === 0) {
      return 0;
    }

    return Math.round(
      (stats.completedReservations / stats.totalReservations) * 100,
    );
  }, [stats]);

  const paymentBreakdown = useMemo(() => {
    return buildPaymentBreakdown(payments);
  }, [payments]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-56 rounded-xl bg-gray-200" />
          <div className="h-4 w-80 max-w-full rounded-xl bg-gray-100" />
          <div className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-44 rounded-3xl border border-gray-100 bg-gray-50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        <h3 className="text-lg font-semibold">{t('companyDashboard.errorTitle')}</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              {t('companyDashboard.overview')}
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {t('companyDashboard.financialDashboard')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              {t('companyDashboard.financialDescription')}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const url = await getStripeLoginLink();
                  window.open(url, '_blank');
                } catch (err) {
                  console.error('Stripe login error:', err);
                }
              }}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-3 py-2 font-bold text-white transition-all duration-200 hover:scale-[1.01] sm:w-auto"
            >
              {t('companyDashboard.openStripe')}
            </button>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:min-w-90">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                {t('companyDashboard.dataSource')}
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {stats.moneySource === 'stripe'
                  ? t('companyDashboard.stripe')
                  : t('companyDashboard.database')}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {stats.moneySource === 'stripe'
                  ? t('companyDashboard.liveStripe')
                  : t('companyDashboard.fallbackRecords')}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                {t('companyDashboard.collectionRate')}
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-900">
                {t('companyDashboard.completedRate', { value: collectionRate })}
              </p>
              <p className="mt-1 text-sm text-emerald-700/80">
                {t('companyDashboard.collectionRateDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('companyDashboard.totalRevenue')}
          value={money(stats.totalRevenue)}
          subtitle={t('companyDashboard.totalRevenueSubtitle')}
          icon={<BadgeDollar className="h-7 w-7" />}
          variant="accent"
        />
        <StatCard
          title={t('companyDashboard.platformFee')}
          value={money(stats.platformFee)}
          subtitle={t('companyDashboard.platformFeeSubtitle')}
          icon={<Clipboard className="h-7 w-7" />}
          badge={`${stats.maintenancePercent.toFixed(2)}%`}
        />
        <StatCard
          title={t('companyDashboard.netEarnings')}
          value={money(stats.companyEarnings)}
          subtitle={t('companyDashboard.netEarningsSubtitle')}
          icon={<Check className="h-7 w-7" />}
          variant="success"
        />
        <StatCard
          title={t('companyDashboard.withdrawableBalance')}
          value={money(stats.companyEarnings)}
          subtitle={t('companyDashboard.withdrawableBalanceSubtitle')}
          icon={<BadgeDollar className="h-7 w-7" />}
          badge={
            stats.moneySource === 'stripe'
              ? t('companyDashboard.synced')
              : t('companyDashboard.internal')
          }
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('companyDashboard.onlinePayments')}
          value={`${paymentBreakdown.onlineRevenue.toFixed(2)} €`}
          icon={<BadgeDollar className="h-5 w-5 text-blue-600" />}
          accentClassName="bg-blue-50"
        />
        <MetricCard
          title={t('companyDashboard.cashPayments')}
          value={`${paymentBreakdown.cashRevenue.toFixed(2)} €`}
          icon={<BadgeDollar className="h-5 w-5 text-emerald-600" />}
          accentClassName="bg-emerald-50"
        />
        <MetricCard
          title={t('companyDashboard.onlinePaidCount')}
          value={paymentBreakdown.onlineCount}
          icon={<Check className="h-5 w-5 text-indigo-600" />}
          accentClassName="bg-indigo-50"
        />
        <MetricCard
          title={t('companyDashboard.cashPaidCount')}
          value={paymentBreakdown.cashCount}
          icon={<Check className="h-5 w-5 text-amber-600" />}
          accentClassName="bg-amber-50"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t('companyDashboard.totalReservations')}
          value={stats.totalReservations}
          icon={<Clipboard className="h-5 w-5 text-blue-600" />}
          accentClassName="bg-blue-50"
        />
        <MetricCard
          title={t('companyDashboard.pendingReservations')}
          value={stats.pendingReservations}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          accentClassName="bg-amber-50"
        />
        <MetricCard
          title={t('companyDashboard.completedReservations')}
          value={stats.completedReservations}
          icon={<Check className="h-5 w-5 text-emerald-600" />}
          accentClassName="bg-emerald-50"
        />
        <MetricCard
          title={t('companyDashboard.activeCars')}
          value={stats.totalCars}
          icon={<Cars className="h-5 w-5 text-violet-600" />}
          accentClassName="bg-violet-50"
        />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:px-8 sm:py-5">
            <h3 className="text-xl font-semibold text-gray-950">
              {t('companyDashboard.recentReservations')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('companyDashboard.recentReservationsDescription')}
            </p>
          </div>

          <div className="divide-y divide-gray-200 sm:hidden">
            {recentReservations.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                {t('companyDashboard.noReservations')}
              </div>
            ) : (
              recentReservations.map((reservation) => (
                <article key={reservation.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-gray-900">
                      {reservation.carMake} {reservation.carModel}
                    </p>
                    <span className="text-xs font-semibold text-gray-500">
                      {money(reservation.totalPrice)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">{reservation.customerName}</div>

                  <div className="text-xs text-gray-500">
                    {formatShortDate(reservation.startDate)} - {formatShortDate(reservation.endDate)}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStatusClassName(
                        reservation.status,
                      )}`}
                    >
                      {normalizeStatus(reservation.status)}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getPaymentClassName(
                        reservation.paymentStatus,
                      )}`}
                    >
                      {normalizeStatus(reservation.paymentStatus)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-215 w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 sm:px-8">
                    {t('companyDashboard.car')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    {t('companyDashboard.customer')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    {t('companyDashboard.rentalPeriod')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    {t('companyDashboard.amount')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    {t('companyDashboard.status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 sm:px-8">
                    {t('companyDashboard.payment')}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {recentReservations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500 sm:px-8"
                    >
                      {t('companyDashboard.noReservations')}
                    </td>
                  </tr>
                ) : (
                  recentReservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="transition-colors hover:bg-gray-50/80"
                    >
                      <td className="px-6 py-5 sm:px-8">
                        <div className="font-semibold text-gray-900">
                          {reservation.carMake} {reservation.carModel}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {reservation.customerName}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        <div>{formatShortDate(reservation.startDate)}</div>
                        <div className="mt-1 text-gray-400">
                          {formatShortDate(reservation.endDate)}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                        {money(reservation.totalPrice)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusClassName(
                            reservation.status,
                          )}`}
                        >
                          {normalizeStatus(reservation.status)}
                        </span>
                      </td>

                      <td className="px-6 py-5 sm:px-8">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getPaymentClassName(
                            reservation.paymentStatus,
                          )}`}
                        >
                          {normalizeStatus(reservation.paymentStatus)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-950">
              {t('companyDashboard.earningsSummary')}
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">{t('companyDashboard.grossRevenue')}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {money(stats.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">{t('companyDashboard.onlinePayments')}</span>
                <span className="text-sm font-semibold text-blue-700">
                  {money(paymentBreakdown.onlineRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">{t('companyDashboard.cashPayments')}</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {money(paymentBreakdown.cashRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">{t('companyDashboard.platformFee')}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {money(stats.platformFee)}
                </span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {t('companyDashboard.companyEarnings')}
                </span>
                <span className="text-base font-bold text-gray-950">
                  {money(stats.companyEarnings)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-950">
              {t('companyDashboard.stripeStatus')}
            </h3>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyDashboard.availableInStripe')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-950">
                  {money(stats.balanceAvailable)}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                  {t('companyDashboard.pendingInStripe')}
                </p>
                <p className="mt-2 text-2xl font-semibold text-amber-900">
                  {money(stats.balancePending)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-500">
              {t('companyDashboard.stripeReference')}
            </p>
            <p></p>
          </div>
        </div>
      </section>
    </div>
  );
}

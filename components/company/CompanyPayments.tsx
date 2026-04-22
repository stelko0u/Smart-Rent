'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BadgeDollar, Check, Clipboard, Clock } from '../icons';
import {
  CompanyPanelBadge,
  CompanyPanelCard,
  CompanyPanelEmptyState,
  CompanyPanelInfoCard,
  CompanyPanelPageHeader,
  CompanyPanelPagination,
  CompanyPanelSearch,
  CompanyPanelStatCard,
  CompanyPanelToolbar,
} from './CompanyPanelUI';
import { getCompanyPayments } from '@/lib/api/companyApi';
import { useTranslation } from '@/providers/LanguageProvider';

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

interface PaymentTotals {
  revenue: number;
  fee: number;
  net: number;
  paid: number;
  pending: number;
  onlineRevenue: number;
  cashRevenue: number;
  onlineCount: number;
  cashCount: number;
}

const PAGE_SIZE = 8;

function money(value?: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getPaymentTone(
  status: string,
): 'gray' | 'amber' | 'green' | 'red' | 'indigo' {
  switch (status) {
    case 'PAID':
    case 'SUCCEEDED':
      return 'green';
    case 'PENDING':
      return 'amber';
    case 'FAILED':
    case 'REFUNDED':
      return 'red';
    default:
      return 'gray';
  }
}

function normalizePaymentMethod(
  value: string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const normalized = value.toUpperCase();

  if (normalized === 'CARD') {
    return t('companyPayments.onlineCard');
  }

  if (normalized === 'CASH') {
    return t('companyPayments.cash');
  }

  if (normalized === 'ON_SPOT') {
    return t('companyPayments.cashOnSpot');
  }

  return value || t('companyPayments.unknown');
}

function shortId(value?: string | null) {
  if (!value) {
    return '—';
  }

  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(0, 14)}…${value.slice(-6)}`;
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

export default function CompanyPayments() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [source, setSource] = useState<'stripe' | 'database'>('stripe');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        setError(null);

        const data = await getCompanyPayments();
        setPayments(data.payments);
        setSource(data.source);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : t('companyPayments.failedLoad'),
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPayments();
  }, [t]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return payments;
    }

    return payments.filter((payment) =>
      [
        payment.paymentIntentId,
        payment.chargeId,
        payment.customerName,
        payment.customerEmail,
        payment.carLabel,
        payment.paymentStatus,
        payment.paymentMethod,
        payment.reservationId?.toString(),
        payment.id?.toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [payments, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAGE_SIZE),
  );

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredPayments.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPayments, currentPage]);

  const totals = useMemo(() => {
    return filteredPayments.reduce<PaymentTotals>(
      (accumulator, payment) => {
        accumulator.revenue += Number(payment.amount || 0);
        accumulator.fee += Number(payment.platformFee || 0);
        accumulator.net += Number(payment.companyEarnings || 0);

        if (payment.paymentStatus === 'PAID') {
          accumulator.paid += 1;
        }

        if (payment.paymentStatus === 'PENDING') {
          accumulator.pending += 1;
        }

        if (isPaidPayment(payment)) {
          const amount = Number(payment.amount || 0);

          if (isOnlinePayment(payment.paymentMethod)) {
            accumulator.onlineRevenue += amount;
            accumulator.onlineCount += 1;
          } else if (isCashPayment(payment.paymentMethod)) {
            accumulator.cashRevenue += amount;
            accumulator.cashCount += 1;
          }
        }

        return accumulator;
      },
      {
        revenue: 0,
        fee: 0,
        net: 0,
        paid: 0,
        pending: 0,
        onlineRevenue: 0,
        cashRevenue: 0,
        onlineCount: 0,
        cashCount: 0,
      },
    );
  }, [filteredPayments]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl bg-gray-200" />
          <div className="h-4 w-72 rounded-xl bg-gray-100" />
          <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-3xl border border-gray-100 bg-gray-50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyPanelPageHeader
        eyebrow={t('companyPayments.payments')}
        title={t('companyPayments.overviewTitle')}
        description={t('companyPayments.overviewDescription')}
        rightSlot={
          <div className="grid gap-3 sm:grid-cols-2">
            <CompanyPanelInfoCard
              label={t('companyPayments.dataSource')}
              value={
                source === 'stripe'
                  ? t('companyPayments.stripe')
                  : t('companyPayments.database')
              }
              description={t('companyPayments.sourceDescription')}
            />
            <CompanyPanelInfoCard
              label={t('companyPayments.netEarnings')}
              value={money(totals.net)}
              description={t('companyPayments.netDescription')}
              tone="success"
            />
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CompanyPanelStatCard
          title={t('companyPayments.revenue')}
          value={money(totals.revenue)}
          subtitle={t('companyPayments.revenueSubtitle')}
          icon={<BadgeDollar className="h-7 w-7" />}
          variant="accent"
        />
        <CompanyPanelStatCard
          title={t('companyPayments.onlinePayments')}
          value={money(totals.onlineRevenue)}
          subtitle={t('companyPayments.onlineSubtitle')}
          icon={<Check className="h-7 w-7" />}
          badge={`${totals.onlineCount}`}
        />
        <CompanyPanelStatCard
          title={t('companyPayments.cashPayments')}
          value={money(totals.cashRevenue)}
          subtitle={t('companyPayments.cashSubtitle')}
          icon={<BadgeDollar className="h-7 w-7" />}
          variant="success"
          badge={`${totals.cashCount}`}
        />
        <CompanyPanelStatCard
          title={t('companyPayments.paidRecords')}
          value={String(totals.paid)}
          subtitle={t('companyPayments.paidSubtitle')}
          icon={<Clock className="h-7 w-7" />}
          badge={`${totals.pending}`}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CompanyPanelStatCard
          title={t('companyPayments.platformFee')}
          value={money(totals.fee)}
          subtitle={t('companyPayments.feeSubtitle')}
          icon={<Clipboard className="h-7 w-7" />}
        />
        <CompanyPanelStatCard
          title={t('companyPayments.netEarnings')}
          value={money(totals.net)}
          subtitle={t('companyPayments.netDescription')}
          icon={<Check className="h-7 w-7" />}
          variant="success"
        />
        <CompanyPanelStatCard
          title={t('companyPayments.onlineShare')}
          value={
            totals.revenue > 0
              ? `${Math.round((totals.onlineRevenue / totals.revenue) * 100)}%`
              : '0%'
          }
          subtitle={t('companyPayments.shareSubtitle')}
          icon={<BadgeDollar className="h-7 w-7" />}
        />
        <CompanyPanelStatCard
          title={t('companyPayments.cashShare')}
          value={
            totals.revenue > 0
              ? `${Math.round((totals.cashRevenue / totals.revenue) * 100)}%`
              : '0%'
          }
          subtitle={t('companyPayments.shareSubtitle')}
          icon={<BadgeDollar className="h-7 w-7" />}
        />
      </section>

      <CompanyPanelCard
        title={t('companyPayments.paymentList')}
        description={t('companyPayments.paymentListDescription')}
      >
        <CompanyPanelToolbar
          rightSlot={
            <CompanyPanelSearch
              value={search}
              onChange={setSearch}
              placeholder={t('companyPayments.searchPlaceholder')}
            />
          }
        />

        {currentItems.length === 0 ? (
          <CompanyPanelEmptyState
            title={t('companyPayments.noPayments')}
            description={t('companyPayments.tryDifferentSearch')}
          />
        ) : (
          <div className="divide-y divide-gray-200">
            <div className="hidden gap-4 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 lg:grid lg:grid-cols-[1.8fr_0.8fr_1.2fr_1fr_0.9fr_1fr_0.8fr_0.9fr] sm:px-8">
              <div>{t('companyPayments.payments')}</div>
              <div>{t('companyPayments.reservation')}</div>
              <div>{t('companyPayments.customer')}</div>
              <div>{t('companyPayments.car')}</div>
              <div>{t('companyPayments.gross')}</div>
              <div>{t('companyPayments.feeNet')}</div>
              <div>{t('companyPayments.status')}</div>
              <div>{t('companyPayments.date')}</div>
            </div>

            {currentItems.map((payment, index) => (
              <article
                key={`${payment.paymentIntentId || payment.id || index}`}
                className="px-6 py-5 sm:px-8"
              >
                <div className="grid gap-4 lg:grid-cols-[1.8fr_0.8fr_1.2fr_1fr_0.9fr_1fr_0.8fr_0.9fr] lg:items-center">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Payment
                    </p>
                    <div
                      className="truncate text-base font-semibold text-gray-900"
                      title={payment.paymentIntentId || `#${payment.id || '—'}`}
                    >
                      {shortId(
                        payment.paymentIntentId || `#${payment.id || '—'}`,
                      )}
                    </div>
                    <div
                      className="mt-1 truncate text-sm text-gray-500"
                      title={payment.chargeId || t('companyPayments.noChargeRef')}
                    >
                      {shortId(payment.chargeId || t('companyPayments.noChargeRef'))}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {normalizePaymentMethod(payment.paymentMethod, t)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Reservation
                    </p>
                    <div className="text-sm font-medium text-gray-700">
                      {payment.reservationId
                        ? `#${payment.reservationId}`
                        : '—'}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Customer
                    </p>
                    <div className="truncate text-sm font-medium text-gray-900">
                      {payment.customerName || '—'}
                    </div>
                    <div className="truncate text-sm text-gray-500">
                          {payment.customerEmail || t('companyPayments.noEmail')}
                        </div>
                      </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Car
                    </p>
                    <div className="wrap-break-words text-sm text-gray-700">
                      {payment.carLabel || '—'}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Gross
                    </p>
                    <div className="text-sm font-semibold text-gray-900">
                      {money(payment.amount)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Fee / Net
                    </p>
                    <div className="text-sm font-medium text-red-600">
                        {t('companyPayments.fee')} {money(payment.platformFee)}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-emerald-600">
                        {t('companyPayments.net')} {money(payment.companyEarnings)}
                      </div>
                    </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Status
                    </p>
                    <CompanyPanelBadge
                      tone={getPaymentTone(payment.paymentStatus)}
                    >
                      {payment.paymentStatus}
                    </CompanyPanelBadge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 lg:hidden">
                      Date
                    </p>
                    <div className="text-sm text-gray-600">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <CompanyPanelPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </CompanyPanelCard>
    </div>
  );
}


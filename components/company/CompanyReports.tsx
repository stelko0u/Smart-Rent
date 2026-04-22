'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeDollar, ChartLine, Check, Clipboard } from '../icons';
import {
  CompanyPanelCard,
  CompanyPanelEmptyState,
  CompanyPanelInfoCard,
  CompanyPanelPageHeader,
  CompanyPanelPagination,
  CompanyPanelSearch,
  CompanyPanelStatCard,
  CompanyPanelToolbar,
} from './CompanyPanelUI';
import { getCompanyReport, getCompanyReportPdfUrl } from '@/lib/api/companyApi';
import { useTranslation } from '@/providers/LanguageProvider';

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

const PAGE_SIZE = 8;

function money(value?: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function defaultStart() {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function defaultEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function CompanyReports() {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(defaultStart());
  const [endDate, setEndDate] = useState(defaultEnd());
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getCompanyReport({
        startDate,
        endDate,
      });

      setSummary(data.summary);
      setItems(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('companyReports.failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, t]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  function downloadPdf() {
    const url = getCompanyReportPdfUrl({
      startDate,
      endDate,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) =>
      [
        item.reservationId?.toString(),
        item.customerName,
        item.customerEmail,
        item.carLabel,
        item.paidAt,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  return (
    <div className="space-y-6">
      <CompanyPanelPageHeader
        eyebrow={t('companyReports.reports')}
        title={t('companyReports.title')}
        description={t('companyReports.description')}
        rightSlot={
          <div className="grid gap-3 sm:grid-cols-2">
            <CompanyPanelInfoCard
              label={t('companyReports.periodStart')}
              value={startDate}
              description={t('companyReports.startDate')}
            />
            <CompanyPanelInfoCard
              label={t('companyReports.periodEnd')}
              value={endDate}
              description={t('companyReports.endDate')}
              tone="success"
            />
          </div>
        }
      />

      <CompanyPanelCard
        title={t('companyReports.reportFilters')}
        description={t('companyReports.reportFiltersDescription')}
      >
        <div className="grid gap-4 px-6 py-5 md:grid-cols-4 md:items-end sm:px-8">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('companyReports.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('companyReports.endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadReport()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? t('companyReports.loading') : t('companyReports.loadReport')}
          </button>

          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            {t('companyReports.exportPdf')}
          </button>
        </div>

        {error ? (
          <div className="px-6 pb-5 sm:px-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          </div>
        ) : null}
      </CompanyPanelCard>

      {summary ? (
        <section className="grid gap-4 xl:grid-cols-4">
          <CompanyPanelStatCard
            title={t('companyReports.paymentsCount')}
            value={String(summary.paymentsCount)}
            subtitle={t('companyReports.paymentsCountSubtitle')}
            icon={<ChartLine className="h-7 w-7" />}
            variant="accent"
          />
          <CompanyPanelStatCard
            title={t('companyReports.grossRevenue')}
            value={money(summary.totalRevenue)}
            subtitle={t('companyReports.grossRevenueSubtitle')}
            icon={<BadgeDollar className="h-7 w-7" />}
          />
          <CompanyPanelStatCard
            title={t('companyReports.platformFee')}
            value={money(summary.platformFee)}
            subtitle={t('companyReports.platformFeeSubtitle')}
            icon={<Clipboard className="h-7 w-7" />}
          />
          <CompanyPanelStatCard
            title={t('companyReports.netEarnings')}
            value={money(summary.companyEarnings)}
            subtitle={t('companyReports.netEarningsSubtitle')}
            icon={<Check className="h-7 w-7" />}
            variant="success"
          />
        </section>
      ) : null}

      <CompanyPanelCard
        title={t('companyReports.paymentsInRange')}
        description={t('companyReports.paymentsInRangeDescription')}
      >
        <CompanyPanelToolbar
          rightSlot={
            <CompanyPanelSearch
              value={search}
              onChange={setSearch}
              placeholder={t('companyReports.searchPlaceholder')}
            />
          }
        />

        <div className="divide-y divide-gray-200 sm:hidden">
          {currentItems.length === 0 ? (
            <CompanyPanelEmptyState
              title={t('companyReports.noPaymentsInRange')}
              description={t('companyReports.noPaymentsInRangeDescription')}
            />
          ) : (
            currentItems.map((item, index) => (
              <article
                key={`${item.reservationId || 'report-mobile'}-${index}`}
                className="space-y-3 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.reservationId ? `#${item.reservationId}` : '—'}
                  </p>
                  <span className="text-xs text-gray-500">{formatDate(item.paidAt)}</span>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-gray-900">{item.customerName || '—'}</p>
                  <p className="mt-0.5 break-all text-gray-500">
                    {item.customerEmail || t('companyReports.noEmail')}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                  {item.carLabel || '—'}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-500">{t('companyReports.gross')}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{money(item.amount)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-500">{t('companyReports.feeNet')}</p>
                    <p className="mt-1 font-medium text-red-600">
                      {t('companyReports.fee')} {money(item.platformFee)}
                    </p>
                    <p className="font-semibold text-emerald-600">
                      {t('companyReports.net')} {money(item.companyEarnings)}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 sm:px-8">
                  {t('companyReports.reservation')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyReports.customer')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyReports.car')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyReports.gross')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyReports.feeNet')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 sm:px-8">
                  {t('companyReports.paidAt')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <CompanyPanelEmptyState
                      title={t('companyReports.noPaymentsInRange')}
                      description={t('companyReports.noPaymentsInRangeDescription')}
                    />
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr
                    key={`${item.reservationId || 'report'}-${index}`}
                    className="transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-6 py-5 text-sm text-gray-600 sm:px-8">
                      {item.reservationId ? `#${item.reservationId}` : '—'}
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-gray-900">
                        {item.customerName || '—'}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {item.customerEmail || t('companyReports.noEmail')}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      {item.carLabel || '—'}
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      {money(item.amount)}
                    </td>

                    <td className="px-6 py-5 text-sm">
                      <div className="font-medium text-red-600">
                        {t('companyReports.fee')} {money(item.platformFee)}
                      </div>
                      <div className="mt-1 font-semibold text-emerald-600">
                        {t('companyReports.net')} {money(item.companyEarnings)}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600 sm:px-8">
                      {formatDate(item.paidAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <CompanyPanelPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </CompanyPanelCard>
    </div>
  );
}

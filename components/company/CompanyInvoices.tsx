'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BadgeDollar, Check, Clipboard, Clock } from '../icons';
import {
  CompanyPanelBadge,
  CompanyPanelCard,
  CompanyPanelEmptyState,
  CompanyPanelInfoCard,
  CompanyPanelMetricCard,
  CompanyPanelPageHeader,
  CompanyPanelPagination,
  CompanyPanelSearch,
  CompanyPanelStatCard,
  CompanyPanelToolbar,
} from './CompanyPanelUI';
import { getCompanyInvoices } from '@/lib/api/companyApi';
import { useTranslation } from '@/providers/LanguageProvider';

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

const PAGE_SIZE = 8;

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value ?? 0);
}

function formatDate(timestamp: number | null) {
  if (!timestamp) return '—';

  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp * 1000));
}

function getStatusTone(
  status: string | null,
): 'gray' | 'amber' | 'green' | 'red' | 'blue' {
  switch (status) {
    case 'paid':
      return 'green';
    case 'open':
      return 'amber';
    case 'uncollectible':
      return 'red';
    case 'draft':
      return 'blue';
    default:
      return 'gray';
  }
}

export default function CompanyInvoices() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadInvoices() {
    try {
      setLoading(true);
      setError(null);

      const nextInvoices = await getCompanyInvoices();
      setInvoices(nextInvoices);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('companyInvoices.failedLoad'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    const sorted = [...invoices].sort((a, b) => b.created - a.created);

    if (!query) {
      return sorted;
    }

    return sorted.filter((invoice) =>
      [
        invoice.id,
        invoice.number,
        invoice.status,
        invoice.customerName,
        invoice.customerEmail,
        invoice.reservationId.toString(),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [invoices, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / PAGE_SIZE),
  );

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredInvoices.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredInvoices, currentPage]);

  const summary = useMemo(() => {
    return filteredInvoices.reduce(
      (accumulator, invoice) => {
        accumulator.gross += invoice.grossAmount || invoice.total || 0;
        accumulator.fee += invoice.platformFee || 0;
        accumulator.net += invoice.companyEarnings || 0;

        if (invoice.status === 'paid') {
          accumulator.paid += 1;
        }

        return accumulator;
      },
      {
        gross: 0,
        fee: 0,
        net: 0,
        paid: 0,
      },
    );
  }, [filteredInvoices]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-44 rounded-xl bg-gray-200" />
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
        eyebrow={t('companyInvoices.invoices')}
        title={t('companyInvoices.title')}
        description={t('companyInvoices.description')}
        rightSlot={
          <div className="grid gap-3 sm:grid-cols-2">
            <CompanyPanelInfoCard
              label={t('companyInvoices.totalInvoices')}
              value={String(filteredInvoices.length)}
              description={t('companyInvoices.totalInvoicesDesc')}
            />
            <CompanyPanelInfoCard
              label={t('companyInvoices.netAmount')}
              value={formatMoney(summary.net, 'EUR')}
              description={t('companyInvoices.netAmountDesc')}
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

      <section className="grid gap-4 xl:grid-cols-4">
        <CompanyPanelStatCard
          title={t('companyInvoices.grossTotal')}
          value={formatMoney(summary.gross, 'EUR')}
          subtitle={t('companyInvoices.grossSubtitle')}
          icon={<BadgeDollar className="h-7 w-7" />}
          variant="accent"
        />
        <CompanyPanelStatCard
          title={t('companyInvoices.platformFee')}
          value={formatMoney(summary.fee, 'EUR')}
          subtitle={t('companyInvoices.platformFeeSubtitle')}
          icon={<Clipboard className="h-7 w-7" />}
        />
        <CompanyPanelStatCard
          title={t('companyInvoices.netToCompany')}
          value={formatMoney(summary.net, 'EUR')}
          subtitle={t('companyInvoices.netToCompanySubtitle')}
          icon={<Check className="h-7 w-7" />}
          variant="success"
        />
        <CompanyPanelStatCard
          title={t('companyInvoices.paidInvoices')}
          value={String(summary.paid)}
          subtitle={t('companyInvoices.paidInvoicesSubtitle')}
          icon={<Clock className="h-7 w-7" />}
        />
      </section>

      <CompanyPanelCard
        title={t('companyInvoices.invoiceList')}
        description={t('companyInvoices.invoiceListDescription')}
        rightSlot={
          <button
            type="button"
            onClick={() => void loadInvoices()}
            className="inline-flex h-11 items-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {t('companyInvoices.refresh')}
          </button>
        }
      >
        <CompanyPanelToolbar
          rightSlot={
            <CompanyPanelSearch
              value={search}
              onChange={setSearch}
              placeholder={t('companyInvoices.searchPlaceholder')}
            />
          }
        />

        <div className="divide-y divide-gray-200 sm:hidden">
          {currentItems.length === 0 ? (
            <CompanyPanelEmptyState
              title={t('companyInvoices.noInvoices')}
              description={t('companyInvoices.noInvoicesDescription')}
            />
          ) : (
            currentItems.map((invoice) => (
              <article key={invoice.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {invoice.number || invoice.id}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t('companyInvoices.created')} {formatDate(invoice.created)}
                    </p>
                  </div>
                  <CompanyPanelBadge tone={getStatusTone(invoice.status)}>
                    {invoice.status || t('companyInvoices.unknownStatus')}
                  </CompanyPanelBadge>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    #{invoice.reservationId} - {invoice.customerName || '—'}
                  </p>
                  <p className="mt-0.5 break-all text-gray-500">
                    {invoice.customerEmail || t('companyInvoices.noEmail')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-500">{t('companyInvoices.gross')}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatMoney(invoice.grossAmount || invoice.total, invoice.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-500">{t('companyInvoices.feeNet')}</p>
                    <p className="mt-1 font-medium text-red-600">
                      {t('companyInvoices.fee')} {formatMoney(invoice.platformFee || 0, invoice.currency)}
                    </p>
                    <p className="font-semibold text-emerald-600">
                      {t('companyInvoices.net')} {formatMoney(invoice.companyEarnings || 0, invoice.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {invoice.hosted_invoice_url ? (
                    <a
                      href={invoice.hosted_invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      {t('companyInvoices.open')}
                    </a>
                  ) : null}

                  {invoice.invoice_pdf ? (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      {t('companyInvoices.pdf')}
                    </a>
                  ) : null}
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
                  {t('companyInvoices.invoice')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyInvoices.reservation')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyInvoices.customer')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyInvoices.status')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyInvoices.gross')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t('companyInvoices.feeNet')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 sm:px-8">
                  {t('companyInvoices.actions')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <CompanyPanelEmptyState
                      title={t('companyInvoices.noInvoices')}
                      description={t('companyInvoices.noInvoicesDescription')}
                    />
                  </td>
                </tr>
              ) : (
                currentItems.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-6 py-5 sm:px-8">
                      <div className="font-semibold text-gray-900">
                        {invoice.number || invoice.id}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {t('companyInvoices.created')} {formatDate(invoice.created)}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {t('companyInvoices.due')} {formatDate(invoice.due_date)}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      #{invoice.reservationId}
                    </td>

                    <td className="px-6 py-5">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customerName || '—'}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {invoice.customerEmail || t('companyInvoices.noEmail')}
                        </div>
                      </td>

                    <td className="px-6 py-5">
                      <CompanyPanelBadge tone={getStatusTone(invoice.status)}>
                        {invoice.status || t('companyInvoices.unknownStatus')}
                      </CompanyPanelBadge>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      {formatMoney(
                        invoice.grossAmount || invoice.total,
                        invoice.currency,
                      )}
                    </td>

                    <td className="px-6 py-5 text-sm">
                      <div className="font-medium text-red-600">
                        {t('companyInvoices.fee')}{' '}
                        {formatMoney(
                          invoice.platformFee || 0,
                          invoice.currency,
                        )}
                      </div>
                      <div className="mt-1 font-semibold text-emerald-600">
                        {t('companyInvoices.net')}{' '}
                        {formatMoney(
                          invoice.companyEarnings || 0,
                          invoice.currency,
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 sm:px-8">
                      <div className="flex flex-wrap gap-2">
                        {invoice.hosted_invoice_url ? (
                          <a
                            href={invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            {t('companyInvoices.open')}
                          </a>
                        ) : null}

                        {invoice.invoice_pdf ? (
                          <a
                            href={invoice.invoice_pdf}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                          >
                            {t('companyInvoices.pdf')}
                          </a>
                        ) : null}
                      </div>
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
          totalItems={filteredInvoices.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </CompanyPanelCard>
    </div>
  );
}

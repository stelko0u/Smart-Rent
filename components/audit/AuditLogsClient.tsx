'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminAuditTable } from '@/components/audit/AdminAuditTable';
import { CompanyAuditTable } from '@/components/audit/CompanyAuditTable';
import { buildAuditCsv, downloadAuditCsv } from '@/components/audit/auditCsv';
import { getAdminAuditLogs, getCompanyAuditLogs } from '@/lib/api/auditApi';
import type {
  AuditEntityType,
  AuditLogListFilters,
  AuditLogListResult,
  AuditOperation,
  AuditStatus,
} from '@/types/audit';
import { useTranslation } from '@/providers/LanguageProvider';

interface AuditLogsClientProps {
  mode: 'admin' | 'company';
  title: string;
  description: string;
  showCompanyColumn?: boolean;
  initialData: AuditLogListResult;
  initialFilters: AuditLogListFilters;
}

type Fetcher = (
  filters: Partial<AuditLogListFilters>,
) => Promise<AuditLogListResult>;

function getFetcher(mode: 'admin' | 'company'): Fetcher {
  return mode === 'admin' ? getAdminAuditLogs : getCompanyAuditLogs;
}

function buildCsvFileName(mode: 'admin' | 'company'): string {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');

  return `${mode}-audit-${timestamp}.csv`;
}

export function AuditLogsClient({
  mode,
  title,
  description,
  showCompanyColumn = false,
  initialData,
  initialFilters,
}: AuditLogsClientProps) {
  const { t } = useTranslation();
  const translatedTitle = title.includes('.') ? t(title) : title;
  const translatedDescription = description.includes('.')
    ? t(description)
    : description;
  const fetcher = useMemo(() => getFetcher(mode), [mode]);

  const [filters, setFilters] = useState<AuditLogListFilters>(initialFilters);
  const [data, setData] = useState<AuditLogListResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFilters = useCallback(
    <K extends keyof AuditLogListFilters>(
      key: K,
      value: AuditLogListFilters[K],
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
        page: key === 'page' ? current.page : 1,
      }));
    },
    [],
  );

  const loadData = useCallback(
    async (nextFilters: AuditLogListFilters) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher(nextFilters);
        setData(result);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        setError(t('audit.failedToLoad'));
      } finally {
        setLoading(false);
      }
    },
    [fetcher, t],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData(filters);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filters, loadData]);

  const canGoPrev = data.page > 1;
  const canGoNext = data.page < data.totalPages;

  const handleExportCsv = useCallback(() => {
    const csv = buildAuditCsv(data.logs);
    downloadAuditCsv(csv, buildCsvFileName(mode));
  }, [data.logs, mode]);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {translatedTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {translatedDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadData(filters)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {t('audit.refresh')}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t('audit.exportCsv')}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('audit.search')}
            </span>
            <input
              value={filters.search}
              onChange={(event) => updateFilters('search', event.target.value)}
              placeholder={t('audit.searchPlaceholder')}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('audit.entity')}
            </span>
            <select
              value={filters.entityType}
              onChange={(event) =>
                updateFilters(
                  'entityType',
                  event.target.value as AuditEntityType | 'ALL',
                )
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="ALL">{t('audit.all')}</option>
              <option value="USER">{t('audit.users')}</option>
              <option value="CAR">{t('audit.cars')}</option>
              <option value="COMPANY">{t('audit.companies')}</option>
              <option value="OFFICE">{t('audit.offices')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('audit.operationType')}
            </span>
            <select
              value={filters.operation}
              onChange={(event) =>
                updateFilters(
                  'operation',
                  event.target.value as AuditOperation | 'ALL',
                )
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="ALL">{t('audit.all')}</option>
              <option value="CREATE">{t('audit.create')}</option>
              <option value="UPDATE">{t('audit.update')}</option>
              <option value="DELETE">{t('audit.delete')}</option>
              <option value="BAN">{t('audit.ban')}</option>
              <option value="UNBAN">{t('audit.unban')}</option>
              <option value="PROFILE_UPDATE">{t('audit.profileUpdate')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('audit.status')}
            </span>
            <select
              value={filters.status}
              onChange={(event) =>
                updateFilters(
                  'status',
                  event.target.value as AuditStatus | 'ALL',
                )
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="ALL">{t('audit.all')}</option>
              <option value="SUCCESS">{t('audit.success')}</option>
              <option value="FAILURE">{t('audit.failure')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('audit.fromDate')}
            </span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                updateFilters('dateFrom', event.target.value)
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('audit.toDate')}
            </span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilters('dateTo', event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {t('audit.perPage')}
            </span>
            <select
              value={filters.pageSize}
              onChange={(event) =>
                updateFilters('pageSize', Number(event.target.value))
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            {t('audit.totalRecords', { count: data.total })}
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            {t('audit.page', { page: data.page, totalPages: data.totalPages })}
          </div>
          {loading ? (
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              {t('audit.loading')}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {mode === 'admin' || showCompanyColumn ? (
        <AdminAuditTable logs={data.logs} />
      ) : (
        <CompanyAuditTable logs={data.logs} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-600">
          {t('audit.shownRecords', { shown: data.logs.length, total: data.total })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrev || loading}
            onClick={() => updateFilters('page', Math.max(1, filters.page - 1))}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('audit.previous')}
          </button>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
            {data.page}
          </div>

          <button
            type="button"
            disabled={!canGoNext || loading}
            onClick={() =>
              updateFilters('page', Math.min(data.totalPages, filters.page + 1))
            }
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('audit.next')}
          </button>
        </div>
      </div>
    </div>
  );
}

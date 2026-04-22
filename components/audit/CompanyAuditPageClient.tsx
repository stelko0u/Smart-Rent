'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CompanyAuditTable } from '@/components/audit/CompanyAuditTable';
import { getCompanyAuditLogs } from '@/lib/api/auditApi';
import type { AuditLogListFilters, AuditLogListResult } from '@/types/audit';
import { useTranslation } from '@/providers/LanguageProvider';

const INITIAL_FILTERS: AuditLogListFilters = {
  page: 1,
  pageSize: 300,
  search: '',
  entityType: 'ALL',
  operation: 'ALL',
  status: 'ALL',
  dateFrom: '',
  dateTo: '',
};

export function CompanyAuditPageClient() {
  const { t } = useTranslation();
  const [data, setData] = useState<AuditLogListResult>({
    logs: [],
    total: 0,
    page: 1,
    pageSize: 300,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await getCompanyAuditLogs(INITIAL_FILTERS);
      setData(nextData);
    } catch (err) {
      console.error('Failed to load company audit logs:', err);
      setError(t('audit.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('audit.companyAuditLogs')}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t('audit.companyAuditSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadLogs()}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {t('audit.refresh')}
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          {t('audit.loading')}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {!loading && !error ? <CompanyAuditTable logs={data.logs} /> : null}
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AdminAuditTable } from '@/components/audit/AdminAuditTable';
import { getAdminAuditLogs } from '@/lib/api/auditApi';
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

export function AdminAuditPageClient() {
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
      const nextData = await getAdminAuditLogs(INITIAL_FILTERS);
      setData(nextData);
    } catch (err) {
      console.error('Failed to load admin audit logs:', err);
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
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('audit.adminAuditLogs')}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t('audit.adminAuditSubtitle')}
        </p>
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

      {!loading && !error ? <AdminAuditTable logs={data.logs} /> : null}
    </div>
  );
}

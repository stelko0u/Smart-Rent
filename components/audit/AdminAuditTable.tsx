'use client';

import React, { useMemo, useState } from 'react';
import { AuditMetadataModal } from '@/components/audit/AuditMetadataModal';
import {
  buildModalTitle,
  formatDateTime,
  getActorLabel,
  getEntityLabel,
  getLocationLabel,
  getOperationClasses,
  getOperationLabel,
  getStatusClasses,
  getStatusLabel,
} from '@/components/audit/shared';
import type {
  AuditEntityType,
  AuditLogRecord,
  AuditOperation,
  AuditStatus,
} from '@/types/audit';
import { useTranslation } from '@/providers/LanguageProvider';

interface AdminAuditTableProps {
  logs: AuditLogRecord[];
}

type EntityFilter = 'ALL' | AuditEntityType;
type StatusFilter = 'ALL' | AuditStatus;
type OperationFilter = 'ALL' | AuditOperation;

interface SelectedLogState {
  id: number;
  title: string;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
}

export function AdminAuditTable({ logs }: AdminAuditTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [operationFilter, setOperationFilter] =
    useState<OperationFilter>('ALL');
  const [selectedLog, setSelectedLog] = useState<SelectedLogState | null>(null);

  const filteredLogs = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (entityFilter !== 'ALL' && log.entityType !== entityFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && log.status !== statusFilter) {
        return false;
      }

      if (operationFilter !== 'ALL' && log.operation !== operationFilter) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const haystack = [
        log.action,
        log.entityType,
        log.operation,
        log.status,
        log.actorEmail,
        log.actorDisplayName,
        log.actorRole,
        log.ipAddress,
        log.country,
        log.region,
        log.city,
        log.errorMessage,
        String(log.targetEntityId ?? ''),
        String(log.companyId ?? ''),
        JSON.stringify(log.metadata),
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchValue);
    });
  }, [entityFilter, logs, operationFilter, search, statusFilter]);

  return (
    <>
      <section className="space-y-4">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 md:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {t('audit.auditLogs')}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t('audit.auditLogsSubtitle')}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="flex min-w-45 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('audit.search')}
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('audit.auditSearchPlaceholder')}
                    className="h-10 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  />
                </label>

                <label className="flex min-w-40 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('audit.entity')}
                  </span>
                  <select
                    value={entityFilter}
                    onChange={(event) =>
                      setEntityFilter(event.target.value as EntityFilter)
                    }
                    className="h-10 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="ALL">{t('audit.all')}</option>
                    <option value="USER">{t('audit.users')}</option>
                    <option value="CAR">{t('audit.cars')}</option>
                    <option value="COMPANY">{t('audit.companies')}</option>
                    <option value="OFFICE">{t('audit.offices')}</option>
                  </select>
                </label>

                <label className="flex min-w-40 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('audit.operationType')}
                  </span>
                  <select
                    value={operationFilter}
                    onChange={(event) =>
                      setOperationFilter(event.target.value as OperationFilter)
                    }
                    className="h-10 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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

                <label className="flex min-w-40 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('audit.status')}
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="h-10 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="ALL">{t('audit.all')}</option>
                    <option value="SUCCESS">{t('audit.success')}</option>
                    <option value="FAILURE">{t('audit.failure')}</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                {t('audit.totalRecords', { count: logs.length })}
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                {t('audit.filteredRecords', { count: filteredLogs.length })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-950">
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.date')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.eventType')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.entity')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.action')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.user')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.company')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    IP
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.geolocation')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.status')}
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                    {t('audit.details')}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      {t('audit.noRecords')}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`align-top transition ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                      } hover:bg-sky-50/60`}
                    >
                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="min-w-37.5 leading-6">
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getOperationClasses(
                            log.operation,
                          )}`}
                        >
                          {getOperationLabel(log.operation, t)}
                        </span>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">
                            {getEntityLabel(log.entityType, t)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t('audit.id')}: {log.targetEntityId ?? '-'}
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="min-w-55 max-w-70 leading-6">
                          {log.action}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="min-w-52.5 space-y-1">
                          <div className="font-semibold text-slate-900">
                            {getActorLabel(log, t)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t('audit.role')}: {log.actorRole ?? '-'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t('audit.userId')}: {log.actorUserId ?? '-'}
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="min-w-17.5 font-medium">
                          {log.companyId ?? '-'}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="min-w-32.5 max-w-37.5 break-all rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                          {log.ipAddress || t('audit.noData')}
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <div className="min-w-42.5 space-y-1">
                          <div className="font-medium text-slate-900">
                            {getLocationLabel(log, t)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {t('audit.provider')}: {log.locationProvider ?? '-'}
                          </div>
                        </div>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            log.status,
                          )}`}
                        >
                          {getStatusLabel(log.status, t)}
                        </span>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLog({
                              id: log.id,
                              title: buildModalTitle(log, t),
                              metadata: log.metadata,
                              errorMessage: log.errorMessage,
                            })
                          }
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        >
                          {t('audit.details')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AuditMetadataModal
        isOpen={selectedLog !== null}
        title={selectedLog?.title ?? ''}
        metadata={selectedLog?.metadata ?? {}}
        errorMessage={selectedLog?.errorMessage ?? null}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}

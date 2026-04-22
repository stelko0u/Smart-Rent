'use client';

import {
  deleteCompany,
  fetchCompanies,
  updateCompany,
} from '@/lib/api/adminApi';
import { Company } from '@/types/types';
import React, { useEffect, useMemo, useState } from 'react';
import DeleteCompanyModal from '../modals/DeleteCompanyModal';
import { useTranslation } from '@/providers/LanguageProvider';

const PAGE_SIZE = 8;

export default function AdminCompanies() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name?: string; email?: string; maintenancePercent?: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [deleteCompanyName, setDeleteCompanyName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('company:created', handler);
    return () => window.removeEventListener('company:created', handler);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const companies = await fetchCompanies();
      setCompanies(companies);
      setPage(1);
    } catch (err: unknown) {
      console.error('Load companies error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: Company) {
    setEditingId(c.id);
    setForm({
      name: c.name ?? '',
      email: c.email ?? '',
      maintenancePercent: c.maintenancePercent ?? 0,
    });
  }

  async function saveEdit(id: number) {
    setError(null);
    try {
      const payload = {
        id,
        name: form.name ?? '',
        email: form.email ?? '',
        maintenancePercent: Number(form.maintenancePercent),
      };
      await updateCompany(payload);
      await load();
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function confirmDelete() {
    if (!deleteCompanyId) return;

    setError(null);
    try {
      await deleteCompany(deleteCompanyId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      closeDeleteModal();
    }
  }

  function openDeleteModal(id: number, name: string) {
    setDeleteCompanyId(id);
    setDeleteCompanyName(name);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setDeleteCompanyId(null);
    setDeleteCompanyName(null);
    setShowDeleteModal(false);
  }

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return companies;
    }

    return companies.filter((company) => {
      const createdAt = company.createdAt
        ? new Date(company.createdAt).toLocaleDateString()
        : '';

      return [
        String(company.id),
        company.name ?? '',
        company.email ?? '',
        String(company.ownerId ?? ''),
        String(company.maintenancePercent ?? ''),
        createdAt,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [companies, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredCompanies.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('adminSidebar.manageCompanies')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('adminCompanies.description')}
          </p>
        </div>

        <div className="w-full lg:w-80">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('adminCompanies.searchPlaceholder')}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-55 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
              <p className="text-sm font-medium text-slate-600">
                {t('adminCompanies.loading')}
              </p>
            </div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex min-h-55 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <p className="text-base font-semibold text-slate-700">
                {t('adminCompanies.noCompanies')}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t('adminCompanies.noCompaniesDescription')}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="divide-y divide-slate-200 sm:hidden">
              {pageItems.map((c) => (
                <article key={c.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t('common.id')}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">#{c.id}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {(c.maintenancePercent ?? 0).toFixed(2)}%
                    </span>
                  </div>

                  {editingId === c.id ? (
                    <div className="space-y-2">
                      <input
                        value={form.name}
                        onChange={(event) =>
                          setForm({ ...form, name: event.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder={t('adminAddCompany.companyNamePlaceholder')}
                      />
                      <input
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        placeholder="company@email.com"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={String(form.maintenancePercent)}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            maintenancePercent: Number(event.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-base font-semibold text-slate-900">{c.name || '—'}</p>
                      <p className="mt-1 text-sm text-slate-600 break-all">{c.email || '—'}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-xs text-slate-500">{t('adminCompanies.ownerId')}</p>
                      <p className="font-medium text-slate-800">{c.ownerId ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-xs text-slate-500">{t('adminCompanies.created')}</p>
                      <p className="font-medium text-slate-800">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  {editingId === c.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                      >
                        {t('adminCompanies.edit')}
                      </button>
                      <button
                        onClick={() => openDeleteModal(c.id, c.name)}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
                      >
                        {t('adminCars.delete')}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      {t('common.id')}
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      {t('adminCompanies.name')}
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      {t('common.email')}
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      {t('adminAddCompany.maintenancePercent')}
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      {t('adminCompanies.ownerId')}
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      {t('adminCompanies.created')}
                    </th>
                    <th className="px-5 py-4 font-semibold text-slate-600">
                      {t('adminCars.actions')}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {pageItems.map((c, index) => (
                    <tr
                      key={c.id}
                      className={`transition hover:bg-slate-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          #{c.id}
                        </span>
                      </td>

                      <td className="px-5 py-4 min-w-47.5">
                        {editingId === c.id ? (
                          <input
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder={t('adminAddCompany.companyNamePlaceholder')}
                          />
                        ) : (
                          <span className="font-medium text-slate-900">
                            {c.name || '—'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 min-w-47.5">
                        {editingId === c.id ? (
                          <input
                            value={form.email}
                            onChange={(e) =>
                              setForm({ ...form, email: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            placeholder="company@email.com"
                          />
                        ) : (
                          <span className="text-slate-600">
                            {c.email || '—'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 min-w-42.5">
                        {editingId === c.id ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={String(form.maintenancePercent)}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                maintenancePercent: Number(e.target.value),
                              })
                            }
                            className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            {(c.maintenancePercent ?? 0).toFixed(2)}%
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {c.ownerId ?? '—'}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="px-5 py-4">
                        {editingId === c.id ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => saveEdit(c.id)}
                              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                            >
                              {t('common.save')}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="inline-flex items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEdit(c)}
                              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                              {t('adminCompanies.edit')}
                            </button>
                            <button
                              onClick={() => openDeleteModal(c.id, c.name)}
                              className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
                            >
                              {t('adminCars.delete')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-slate-500">
                {t('adminCompanies.showing', {
                  from: filteredCompanies.length === 0 ? 0 : pageStart + 1,
                  to: Math.min(pageStart + PAGE_SIZE, filteredCompanies.length),
                  total: filteredCompanies.length,
                })}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('adminCompanies.previous')}
                </button>
                <span className="text-sm text-slate-500">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('adminCompanies.next')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <DeleteCompanyModal
        isOpen={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onConfirm={confirmDelete}
        companyName={deleteCompanyName || ''}
      />
    </section>
  );
}

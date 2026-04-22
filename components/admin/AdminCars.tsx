'use client';

import { deleteCar, fetchCarsAndCompanies } from '@/lib/api/adminApi';
import { CarRow, Company } from '@/types/types';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DeleteCarModal from '../modals/DeleteCarModal';
import { useTranslation } from '@/providers/LanguageProvider';

const PAGE_SIZE = 10;

export default function AdminCars() {
  const { t } = useTranslation();
  const [cars, setCars] = useState<CarRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCarId, setDeleteCarId] = useState<number | null>(null);
  const [deleteCarName, setDeleteCarName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { cars, companies } = await fetchCarsAndCompanies();
      setCars(cars);
      setCompanies(companies);
      setPage(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('adminCars.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  function openDeleteModal(id: number, name: string) {
    setDeleteCarId(id);
    setDeleteCarName(name);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setDeleteCarId(null);
    setDeleteCarName(null);
    setShowDeleteModal(false);
  }

  async function confirmDelete() {
    if (!deleteCarId) return;

    setError(null);
    try {
      await deleteCar(deleteCarId);
      setCars((prev) => prev.filter((car) => car.id !== deleteCarId));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t('adminCars.deleteFailed'),
      );
    } finally {
      closeDeleteModal();
    }
  }

  const companyMap = useMemo(() => {
    return new Map(companies.map((company) => [company.id, company.name]));
  }, [companies]);

  const getCompanyName = (companyId?: number) => {
    if (!companyId) return t('adminCars.noCompany');
    return companyMap.get(companyId) ?? t('adminCars.unknownCompany');
  };

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return cars;
    }

    return cars.filter((car) => {
      const companyName = car.companyId
        ? (companyMap.get(car.companyId) ?? t('adminCars.unknownCompany'))
        : t('adminCars.noCompany');

      return [
        String(car.id),
        car.make,
        car.model,
        String(car.year ?? ''),
        String(car.pricePerDay ?? ''),
        companyName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [cars, companyMap, search, t]);

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageCars = filteredCars.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                {t('adminCars.vehicleList')}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t('adminCars.description')}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('adminCars.searchPlaceholder')}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 sm:w-72"
              />
              <button
                onClick={load}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow"
              >
                {t('audit.refresh')}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-75 items-center justify-center px-6 py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
              <p className="text-sm font-semibold text-slate-700">
                {t('adminCars.loadingCars')}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t('adminCars.loadingDescription')}
              </p>
            </div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="flex min-h-75 items-center justify-center px-6 py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-18 w-18 items-center justify-center rounded-3xl border border-slate-200 bg-slate-100 text-3xl shadow-sm">
                🚘
              </div>
              <h4 className="text-lg font-semibold text-slate-900">
                {t('adminCars.noCars')}
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                {t('adminCars.noCarsDescription')}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200 sm:hidden">
              {pageCars.map((car) => (
                <article key={car.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      #{car.id}
                    </span>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {getCompanyName(car.companyId)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                      {car.images?.length ? (
                        <Image
                          src={car.images[0]}
                          alt={`${car.make} ${car.model}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
                          {t('adminCars.noImage')}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {car.make} {car.model}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {car.year ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-xs font-medium text-slate-500">
                      {t('adminCars.pricePerDay')}
                    </span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {car.pricePerDay
                        ? `$${car.pricePerDay} ${t('adminCars.perDay')}`
                        : '—'}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      openDeleteModal(car.id, `${car.make} ${car.model}`)
                    }
                    className="inline-flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
                  >
                    {t('adminCars.delete')}
                  </button>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-215 w-full">
                <thead className="bg-gray-100">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">{t('common.id')}</th>
                    <th className="px-6 py-4">{t('adminCars.car')}</th>
                    <th className="px-6 py-4">{t('vehicle.year')}</th>
                    <th className="px-6 py-4">{t('adminCars.pricePerDay')}</th>
                    <th className="px-6 py-4">{t('adminCars.company')}</th>
                    <th className="px-6 py-4 text-right">
                      {t('adminCars.actions')}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pageCars.map((car, index) => (
                    <tr
                      key={car.id}
                      className={`transition hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                          #{car.id}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                            {car.images?.length ? (
                              <Image
                                src={car.images[0]}
                                alt={`${car.make} ${car.model}`}
                                fill
                                className="object-cover transition duration-300 hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                                {t('adminCars.noImage')}
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {car.make} {car.model}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {car.year ?? '—'}
                      </td>

                      <td className="px-6 py-4">
                        {car.pricePerDay ? (
                          <span className="inline-flex items-baseline rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
                            ${car.pricePerDay}
                            <span className="ml-1 text-sm font-medium text-emerald-600/80">
                              {t('adminCars.perDay')}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {getCompanyName(car.companyId)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openDeleteModal(
                                car.id,
                                `${car.make} ${car.model}`,
                              )
                            }
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100"
                          >
                            {t('adminCars.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && filteredCars.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-500">
              {t('adminCars.showing', {
                from: pageStart + 1,
                to: Math.min(pageStart + PAGE_SIZE, filteredCars.length),
                total: filteredCars.length,
              })}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('adminCars.previous')}
              </button>
              <span className="text-sm text-slate-500">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={safePage >= totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('adminCars.next')}
              </button>
            </div>
          </div>
        )}
      </div>
      <DeleteCarModal
        isOpen={showDeleteModal}
        onRequestClose={closeDeleteModal}
        onConfirm={confirmDelete}
        carName={deleteCarName || ''}
      />
    </section>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, Clock, User } from '../icons';
import {
  CompanyPanelBadge,
  CompanyPanelCard,
  CompanyPanelEmptyState,
  CompanyPanelInfoCard,
  CompanyPanelMetricCard,
  CompanyPanelPageHeader,
  CompanyPanelPagination,
  CompanyPanelSearch,
  CompanyPanelTabs,
  CompanyPanelToolbar,
} from './CompanyPanelUI';
import { getCompanyReservations } from '@/lib/api/companyApi';
import { ConfirmCashPaymentButton } from '@/components/company/ConfirmCashPaymentButton';

interface Reservation {
  id: number;
  carId: number;
  carMake: string;
  carModel: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
}

type ReservationFilter =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const PAGE_SIZE = 8;

function formatMoney(value: number) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function normalizeLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

function getStatusTone(
  status: string,
): 'gray' | 'blue' | 'amber' | 'green' | 'red' {
  switch (status) {
    case 'CONFIRMED':
      return 'blue';
    case 'IN_PROGRESS':
      return 'amber';
    case 'COMPLETED':
    case 'RETURNED':
      return 'green';
    case 'CANCELLED':
      return 'red';
    default:
      return 'gray';
  }
}

function getPaymentTone(
  status: string,
): 'gray' | 'blue' | 'amber' | 'green' | 'red' {
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

export default function CompanyReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<ReservationFilter>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReservations() {
      try {
        setLoading(true);
        setError(null);

        const nextReservations = await getCompanyReservations();
        setReservations(nextReservations);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to load reservations',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReservations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesFilter =
        filter === 'all' ? true : reservation.status === filter.toUpperCase();

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        reservation.id.toString(),
        reservation.carMake,
        reservation.carModel,
        reservation.customerName,
        reservation.customerEmail,
        reservation.customerPhone,
        reservation.status,
        reservation.paymentStatus,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [reservations, filter, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReservations.length / PAGE_SIZE),
  );

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredReservations.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredReservations, currentPage]);

  const totalRevenue = useMemo(
    () =>
      filteredReservations.reduce(
        (sum, reservation) => sum + Number(reservation.totalPrice || 0),
        0,
      ),
    [filteredReservations],
  );

  const confirmedCount = useMemo(
    () =>
      reservations.filter((reservation) => reservation.status === 'CONFIRMED')
        .length,
    [reservations],
  );

  const completedCount = useMemo(
    () =>
      reservations.filter((reservation) =>
        ['COMPLETED', 'RETURNED'].includes(reservation.status),
      ).length,
    [reservations],
  );

  const pendingCount = useMemo(
    () =>
      reservations.filter((reservation) =>
        ['PENDING', 'IN_PROGRESS'].includes(reservation.status),
      ).length,
    [reservations],
  );

  if (loading) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-56 rounded-xl bg-gray-200" />
          <div className="h-4 w-80 rounded-xl bg-gray-100" />
          <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-3xl border border-gray-100 bg-gray-50 cursor-pointer"
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
        eyebrow="Reservations"
        title="Reservation management"
        description="Track bookings, payment state and customer details in one clean workspace."
        rightSlot={
          <div className="grid gap-3 sm:grid-cols-2">
            <CompanyPanelInfoCard
              label="Live records"
              value={reservations.length.toString()}
              description="All reservations for your company fleet."
            />
            <CompanyPanelInfoCard
              label="Filtered value"
              value={formatMoney(totalRevenue)}
              description="Revenue shown for the active filter."
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
        <CompanyPanelMetricCard
          title="Total reservations"
          value={reservations.length}
          icon={<Clipboard className="h-5 w-5 text-blue-600" />}
          accentClassName="bg-blue-50"
        />
        <CompanyPanelMetricCard
          title="Pending / active"
          value={pendingCount}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          accentClassName="bg-amber-50"
        />
        <CompanyPanelMetricCard
          title="Confirmed"
          value={confirmedCount}
          icon={<Check className="h-5 w-5 text-indigo-600" />}
          accentClassName="bg-indigo-50"
        />
        <CompanyPanelMetricCard
          title="Completed"
          value={completedCount}
          icon={<User className="h-5 w-5 text-emerald-600" />}
          accentClassName="bg-emerald-50"
        />
      </section>

      <CompanyPanelCard
        title="Reservation list"
        description="Consistent table layout with search, filters and pagination."
      >
        <CompanyPanelToolbar
          leftSlot={
            <CompanyPanelTabs<ReservationFilter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          }
          rightSlot={
            <CompanyPanelSearch
              value={search}
              onChange={setSearch}
              placeholder="Search by customer, car, email or reservation ID"
            />
          }
        />

        <div className="divide-y divide-gray-200 sm:hidden">
          {currentItems.length === 0 ? (
            <CompanyPanelEmptyState
              title="No reservations found"
              description="Try changing the current filter or search query."
            />
          ) : (
            currentItems.map((reservation) => (
              <article key={reservation.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">#{reservation.id}</p>
                    <p className="text-sm text-gray-600">
                      {reservation.carMake} {reservation.carModel}
                    </p>
                  </div>
                  <CompanyPanelBadge tone={getStatusTone(reservation.status)}>
                    {normalizeLabel(reservation.status)}
                  </CompanyPanelBadge>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-gray-900">{reservation.customerName}</p>
                  <p className="mt-0.5 break-all text-gray-500">{reservation.customerEmail}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-500">Period</p>
                    <p className="mt-1 font-medium text-gray-700">
                      {formatDate(reservation.startDate)}
                    </p>
                    <p className="text-gray-500">to {formatDate(reservation.endDate)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="text-gray-500">Amount</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatMoney(reservation.totalPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {reservation.paymentMethod === 'ON_SPOT' &&
                  reservation.paymentStatus !== 'PAID' &&
                  reservation.status !== 'CANCELLED' ? (
                    <ConfirmCashPaymentButton
                      reservationId={reservation.id}
                      initialPaymentStatus={reservation.paymentStatus}
                      initialReservationStatus={reservation.status}
                    />
                  ) : (
                    <span
                      className={
                        reservation.paymentStatus === 'PAID'
                          ? 'inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                          : reservation.paymentStatus === 'PENDING'
                            ? 'inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'
                            : 'inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700'
                      }
                    >
                      {reservation.paymentStatus}
                    </span>
                  )}
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
                  Reservation
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 sm:px-8">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <CompanyPanelEmptyState
                      title="No reservations found"
                      description="Try changing the current filter or search query."
                    />
                  </td>
                </tr>
              ) : (
                currentItems.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-6 py-5 sm:px-8">
                      <div className="font-semibold text-gray-900">
                        #{reservation.id}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {reservation.carMake} {reservation.carModel}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Created {formatDate(reservation.createdAt)}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.customerName}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {reservation.customerEmail}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {reservation.customerPhone || 'No phone'}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">
                      <div>{formatDate(reservation.startDate)}</div>
                      <div className="mt-1 text-gray-400">
                        to {formatDate(reservation.endDate)}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                      {formatMoney(reservation.totalPrice)}
                    </td>

                    <td className="px-6 py-5">
                      {/* <span className="text-sm text-slate-500">
                          {reservation.paymentMethod === 'ON_SPOT'
                            ? 'On spot'
                            : reservation.paymentMethod}
                        </span> */}
                      <div className="flex flex-col gap-2">
                        {reservation.paymentMethod === 'ON_SPOT' &&
                        reservation.paymentStatus !== 'PAID' &&
                        reservation.status !== 'CANCELLED' ? (
                          <ConfirmCashPaymentButton
                            reservationId={reservation.id}
                            initialPaymentStatus={reservation.paymentStatus}
                            initialReservationStatus={reservation.status}
                          />
                        ) : (
                          <span
                            className={
                              reservation.paymentStatus === 'PAID'
                                ? 'inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                                : reservation.paymentStatus === 'PENDING'
                                  ? 'inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'
                                  : 'inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700'
                            }
                          >
                            {reservation.paymentStatus}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        {reservation.paymentMethod === 'CARD'
                          ? 'Online card'
                          : reservation.paymentMethod === 'ON_SPOT'
                            ? 'On spot'
                            : reservation.paymentMethod}
                      </div>
                    </td>

                    <td className="px-6 py-5 sm:px-8">
                      <CompanyPanelBadge
                        tone={getStatusTone(reservation.status)}
                      >
                        {normalizeLabel(reservation.status)}
                      </CompanyPanelBadge>
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
          totalItems={filteredReservations.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </CompanyPanelCard>
    </div>
  );
}

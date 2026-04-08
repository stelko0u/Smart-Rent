'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUserReservations,
  type PaginatedUserReservationsResponse,
  type UserReservation,
} from '@/lib/api/reservationApi';
import { Clipboard } from '../icons';

interface RentedCarsProps {
  userId: number;
}

const ITEMS_PER_PAGE = 5;

function getStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= totalPages - 2) {
    return [
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
}

export default function RentedCars({ userId }: RentedCarsProps) {
  const router = useRouter();

  const [reservations, setReservations] = useState<UserReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;

    async function loadReservations() {
      try {
        setLoading(true);
        setError(null);

        const data: PaginatedUserReservationsResponse =
          await getUserReservations({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          });

        if (!isMounted) {
          return;
        }

        setReservations(data.reservations);
        setTotalItems(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        setError(
          err instanceof Error ? err.message : 'Failed to load reservations',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReservations();

    return () => {
      isMounted = false;
    };
  }, [currentPage, userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [userId]);

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-8 shadow">
        <div className="text-center text-gray-500">Loading rentals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-8 shadow">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b p-6">
        <h2 className="text-xl font-semibold text-gray-800">My Rentals</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your car reservations
        </p>
      </div>

      <div className="divide-y">
        {reservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clipboard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p>No rentals yet</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-white transition hover:bg-indigo-700"
            >
              Browse Cars
            </button>
          </div>
        ) : (
          <>
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="cursor-pointer p-6 transition hover:bg-gray-50"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {reservation.car?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reservation.car.images[0]}
                      alt={`${reservation.car.make} ${reservation.car.model}`}
                      className="h-24 w-full rounded-lg object-cover sm:w-32"
                    />
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400 sm:w-32">
                      No image
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {reservation.car
                            ? `${reservation.car.make} ${reservation.car.model}`
                            : `Car #${reservation.carId}`}
                        </h3>

                        {reservation.car?.year ? (
                          <p className="text-sm text-gray-600">
                            {reservation.car.year}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          reservation.status,
                        )}`}
                      >
                        {reservation.status}
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 sm:gap-4">
                      <div>
                        <span className="font-medium">Pick-up:</span>{' '}
                        {new Date(reservation.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Drop-off:</span>{' '}
                        {new Date(reservation.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div className="text-lg font-semibold text-indigo-600">
                        €{reservation.totalPrice}
                      </div>

                      {reservation.paymentStatus ? (
                        <div className="text-sm text-gray-500 sm:text-right">
                          <div>Payment: {reservation.paymentStatus}</div>
                          <div>
                            Payment Method: {reservation.paymentMethod ?? '-'}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-4 border-t p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{' '}
                {totalItems} rentals
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                {pageNumbers[0] > 1 ? (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 ? (
                      <span className="px-1 text-sm text-gray-400">...</span>
                    ) : null}
                  </>
                ) : null}

                {pageNumbers.map((page) => {
                  const isActive = page === currentPage;

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {pageNumbers[pageNumbers.length - 1] < totalPages ? (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 ? (
                      <span className="px-1 text-sm text-gray-400">...</span>
                    ) : null}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                ) : null}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

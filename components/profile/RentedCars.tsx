'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
interface Reservation {
  id: number;
  carId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
}

interface Props {
  userId: number;
}

export default function RentedCars({ userId }: Props) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReservations();
  }, [userId]);

  const loadReservations = async () => {
    try {
      const res = await fetch('/api/user/reservations', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load reservations');
      }

      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">Loading rentals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">My Rentals</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and manage your car reservations
        </p>
      </div>

      <div className="divide-y">
        {reservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>No rentals yet</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Browse Cars
            </button>
          </div>
        ) : (
          reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="p-6 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => router.push(`/reservation/${reservation.id}`)}
            >
              <div className="flex gap-4">
                {reservation.car?.images?.[0] && (
                  <img
                    src={reservation.car.images[0]}
                    alt={`${reservation.car.make} ${reservation.car.model}`}
                    className="w-32 h-24 object-cover rounded-lg"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {reservation.car?.make} {reservation.car?.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {reservation.car?.year}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                    >
                      {reservation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-medium">Pick-up:</span>{' '}
                      {new Date(reservation.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Drop-off:</span>{' '}
                      {new Date(reservation.endDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-indigo-600">
                      ${reservation.totalPrice}
                    </div>
                    {reservation.paymentStatus && (
                      <span className="text-sm text-gray-500">
                        Payment: {reservation.paymentStatus}
                        <br />
                        Payment Method: {reservation.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

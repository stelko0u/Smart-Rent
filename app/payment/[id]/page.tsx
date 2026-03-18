'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../../../components/payments/PaymentForm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface ReservationData {
  id: number;
  carMake: string;
  carModel: string;
  carImage: string | null;
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: number;
  totalAmount: number;
  status: string;
  paymentMethod: string | null;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationData | null>(null);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true);
        console.log('Fetching reservation:', reservationId);

        const reservationResponse = await fetch(
          `/api/reservations/${reservationId}`,
          {
            credentials: 'include',
          },
        );

        console.log('Response status:', reservationResponse.status);

        if (!reservationResponse.ok) {
          const errorData = await reservationResponse.json().catch(() => ({}));
          console.error('Error response:', errorData);
          throw new Error(errorData.error || 'Failed to load reservation');
        }

        const data = await reservationResponse.json();
        console.log('Full API response:', data);

        if (!data.reservation) {
          throw new Error('No reservation data in response');
        }

        setReservation(data.reservation);
        console.log('Reservation set:', data.reservation);
      } catch (err) {
        console.error('Error loading reservation:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Error connecting to the server. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };

    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <h2 className="text-lg font-semibold text-slate-900">
            Preparing your checkout
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please wait while we load your payment details.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 shadow-xl shadow-red-100/40">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            Payment Error
          </h2>
          <p className="mb-6 text-sm leading-6 text-slate-600">{error}</p>
          <button
            onClick={() => router.push('/profile')}
            className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">
            No reservation found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Unable to load reservation details.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="order-2 lg:order-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 md:p-8">
            <div className="mb-8">
              <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Secure Checkout
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Complete Your Payment
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Reservation #{reservationId}
              </p>
            </div>

            <Elements stripe={stripePromise}>
              <CheckoutForm reservationId={Number(reservationId)} />
            </Elements>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 md:p-8 lg:sticky lg:top-8">
            <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review your reservation before completing payment.
            </p>

            <div className="mt-6 space-y-5">
              {/* Car Image */}
              {reservation.carImage && (
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={reservation.carImage}
                    alt={`${reservation.carMake} ${reservation.carModel}`}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              {/* Reservation Details */}
              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Reservation ID</span>
                  <span className="font-semibold text-slate-900">
                    #{reservation.id}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Vehicle</span>
                  <span className="font-semibold text-slate-900">
                    {reservation.carMake} {reservation.carModel}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(reservation.startDate).toLocaleDateString(
                      'en-GB',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      },
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">End Date</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(reservation.endDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-900">
                    {reservation.days} day{reservation.days !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    {reservation.status}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    €{reservation.pricePerDay.toFixed(2)} × {reservation.days}{' '}
                    day{reservation.days !== 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-900">
                    €{reservation.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-base font-semibold text-slate-900">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    €{reservation.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                🔒 Your payment is processed securely via Stripe
              </div>

              {/* Calculation Info */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-medium text-slate-900">
                  Calculation:
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {reservation.days} days × €
                  {reservation.pricePerDay} = €
                  {reservation.totalAmount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

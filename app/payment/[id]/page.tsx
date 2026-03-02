'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../../components/payments/PaymentForm';
import { useParams, useRouter } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface ReservationDetails {
  id: number;
  carMake: string;
  carModel: string;
  carImage: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  days: number;
  pricePerDay: number;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = parseInt(params.id as string);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId) return;
    loadReservationAndCreateIntent();
  }, [reservationId]);

  const loadReservationAndCreateIntent = async () => {
    try {
      setLoading(true);

      // Load reservation details
      const resRes = await fetch(`/api/reservations/${reservationId}`, {
        credentials: 'include',
      });

      if (!resRes.ok) {
        throw new Error('Reservation not found');
      }

      const resData = await resRes.json();
      setReservation(resData.reservation);

      // Create payment intent
      const paymentRes = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reservationId }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const paymentData = await paymentRes.json();
      setClientSecret(paymentData.clientSecret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2 text-center">
            Payment Error
          </h2>
          <p className="text-gray-700 text-center mb-6">{error}</p>
          <button
            onClick={() => router.push('/profile?tab=reservations')}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Go to My Reservations
          </button>
        </div>
      </div>
    );
  }

  if (!reservation || !clientSecret) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Complete Payment
                  </h1>
                  <p className="text-sm text-gray-500">
                    Secure payment powered by Stripe
                  </p>
                </div>
              </div>

              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#4f46e5',
                        borderRadius: '12px',
                      },
                    },
                  }}
                >
                  <CheckoutForm reservationId={reservationId} />
                </Elements>
              )}

              <div className="mt-8 pt-6 border-t">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Secure Payment
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Your payment information is encrypted and secure. We never
                      store your card details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Reservation Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Reservation Summary
              </h3>

              {/* Car Image */}
              {reservation.carImage && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={reservation.carImage}
                    alt={`${reservation.carMake} ${reservation.carModel}`}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Vehicle
                  </p>
                  <p className="font-semibold text-gray-800">
                    {reservation.carMake} {reservation.carModel}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Pick-up
                    </p>
                    <p className="font-medium text-sm text-gray-800">
                      {new Date(reservation.startDate).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Drop-off
                    </p>
                    <p className="font-medium text-sm text-gray-800">
                      {new Date(reservation.endDate).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Duration
                  </p>
                  <p className="font-medium text-gray-800">
                    {reservation.days} {reservation.days === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    €{reservation.pricePerDay} × {reservation.days} days
                  </span>
                  <span className="text-gray-800">
                    €{reservation.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                  <span className="text-gray-800">Total</span>
                  <span className="text-indigo-600">
                    €{reservation.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800">
                  ✓ You will receive a confirmation email after successful
                  payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

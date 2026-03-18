'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Successfully from '../../../components/icons/Successfully';

function ReservationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('id');
  const confirmed = searchParams.get('confirmed');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/profile');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const isConfirmed = confirmed === 'true';

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-bounce">
          <Successfully />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {isConfirmed ? 'Reservation Confirmed!' : 'Payment Successful!'}
        </h1>
        {isConfirmed ? (
          <div className="mb-6">
            <p className="text-gray-700 text-lg mb-2">
              Your reservation has been successfully confirmed!
            </p>
            <p className="text-gray-600 text-sm">
              You can now view your reservation details in your profile.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-gray-700 text-lg mb-2">
              Your payment has been processed successfully!
            </p>
            <p className="text-gray-600 text-sm">
              Please check your email and confirm your reservation to complete
              the process.
            </p>
          </div>
        )}

        {reservationId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Reservation Number</p>
            <p className="text-2xl font-bold text-indigo-600">
              #{reservationId}
            </p>
          </div>
        )}

        {!isConfirmed && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Important:</strong> Check your email and click the
                  confirmation link to activate your reservation.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Redirecting to your profile in{' '}
            <span className="font-bold text-indigo-600 text-lg">
              {countdown}
            </span>{' '}
            seconds...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/profile')}
            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md hover:shadow-lg cursor-pointer"
          >
            Go to Profile Now
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            Back to Home
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? Contact us at{' '}
            <a
              href="mailto:smartrentalpro@abv.bg"
              className="text-indigo-600 hover:underline"
            >
              smartrentalpro@abv.bg
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReservationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <ReservationSuccessContent />
    </Suspense>
  );
}

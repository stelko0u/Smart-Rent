'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('');
  const [reservationId, setReservationId] = useState<number | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentId = urlParams.get('payment_intent');
      const redirectStatus = urlParams.get('redirect_status');
      const reservationIdParam = urlParams.get('reservationId');

      console.log('=== Payment Success Page ===');
      console.log('Full URL:', window.location.href);
      console.log('Payment intent ID:', paymentIntentId);
      console.log('Redirect status:', redirectStatus);
      console.log('Reservation ID:', reservationIdParam);

      // CHANGE: Проверка за payment_intent също
      if (!paymentIntentId) {
        setStatus('error');
        setMessage('Payment information is missing.');
        return;
      }

      if (!reservationIdParam) {
        setStatus('error');
        setMessage('Reservation information is missing.');
        return;
      }

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            reservationId: Number(reservationIdParam),
            paymentIntentId,
            redirectStatus,
          }),
        });

        const data = await response.json();
        console.log('Confirm response:', data);

        if (data.ok) {
          setStatus('success');
          setMessage(
            'Payment confirmed successfully! Your reservation is complete.',
          );
          setReservationId(data.reservationId);

          setTimeout(() => {
            router.push('/profile');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Error confirming payment');
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
        setStatus('error');
        setMessage('Error connecting to the server');
      }
    };

    confirmPayment();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Processing Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {reservationId && (
              <p className="text-sm text-gray-500">
                Reservation ID: #{reservationId}
              </p>
            )}
            <div className="mt-6">
              <div className="animate-pulse text-sm text-gray-500">
                Redirecting to your profile...
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                To Profile
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                To Home Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

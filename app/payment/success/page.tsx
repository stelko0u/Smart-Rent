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
      // Get URL params directly from window.location
      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentId = urlParams.get('payment_intent');
      const redirectStatus = urlParams.get('redirect_status');

      console.log('=== Payment Success Page ===');
      console.log('Full URL:', window.location.href);
      console.log('URL Search:', window.location.search);
      console.log('Payment intent ID:', paymentIntentId);
      console.log('Redirect status:', redirectStatus);

      if (!paymentIntentId) {
        console.error('No payment intent ID found in URL');
        console.error('URL params:', Array.from(urlParams.entries()));
        setStatus('error');
        setMessage(
          'Липсва информация за плащането. Моля, проверете вашите резервации в профила.',
        );
        return;
      }

      if (redirectStatus !== 'succeeded') {
        console.error('Payment not succeeded, status:', redirectStatus);
        setStatus('error');
        setMessage(
          `Плащането не беше успешно. Статус: ${redirectStatus || 'неизвестен'}`,
        );
        return;
      }

      console.log(
        'Calling /api/payments/confirm with paymentIntentId:',
        paymentIntentId,
      );

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ paymentIntentId }),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.ok) {
          setStatus('success');
          setMessage(
            'Плащането е потвърдено успешно! Резервацията е завършена.',
          );
          setReservationId(data.reservationId);

          // Redirect to profile after 3 seconds
          setTimeout(() => {
            router.push('/profile');
          }, 3000);
        } else {
          console.error('Confirm API returned error:', data);
          setStatus('error');
          setMessage(data.error || 'Грешка при потвърждаване на плащането');
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
        setStatus('error');
        setMessage('Грешка при свързване със сървъра');
      }
    };

    // Wait for client-side hydration
    const timer = setTimeout(() => {
      confirmPayment();
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Обработка на плащането...
            </h2>
            <p className="text-gray-600">
              Моля, изчакайте докато потвърдим вашето плащане
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Успешно плащане!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {reservationId && (
              <p className="text-sm text-gray-500">
                Номер на резервация: #{reservationId}
              </p>
            )}
            <div className="mt-6">
              <div className="animate-pulse text-sm text-gray-500">
                Пренасочване към профила...
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Грешка</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/profile')}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Към профила
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Към началната страница
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

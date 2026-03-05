'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

function CheckoutForm({ reservationId }: { reservationId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not loaded');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    console.log('=== STARTING PAYMENT PROCESS ===');
    console.log('Reservation ID:', reservationId);

    try {
      const returnUrl = `${window.location.origin}/payment/success`;
      console.log('Return URL:', returnUrl);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      console.log('Stripe response:', { error, paymentIntent });

      if (error) {
        console.error('Payment error:', error);
        setErrorMessage(error.message || 'Грешка при плащането');
        setIsProcessing(false);

        // Mark payment as failed
        try {
          await fetch('/api/payments/failed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: Number(reservationId),
              reason: error.message,
            }),
          });
        } catch (err) {
          console.error('Failed to mark payment as failed:', err);
        }
        return;
      }

      // If payment succeeded without redirect
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded immediately:', paymentIntent.id);

        // Call confirm endpoint
        try {
          const confirmResponse = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          });

          const confirmData = await confirmResponse.json();
          console.log('Confirm response:', confirmData);

          if (confirmData.ok) {
            // Redirect to success page manually
            router.push(
              `/payment/success?payment_intent=${paymentIntent.id}&redirect_status=succeeded`,
            );
          } else {
            setErrorMessage('Грешка при потвърждаване на плащането');
            setIsProcessing(false);
          }
        } catch (err) {
          console.error('Error confirming payment:', err);
          setErrorMessage('Грешка при потвърждаване на плащането');
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorMessage('Неочаквана грешка при плащането');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Обработка...
          </>
        ) : (
          'Плати сега'
        )}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        console.log('Creating payment intent for reservation:', reservationId);

        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reservationId: Number(reservationId) }),
        });

        const data = await response.json();
        console.log('Payment intent response:', data);

        if (data.ok && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setReservation(data.reservation);
        } else {
          setError(data.error || 'Грешка при създаване на плащането');
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Грешка при свързване със сървъра');
      } finally {
        setLoading(false);
      }
    };

    if (reservationId) {
      createPaymentIntent();
    }
  }, [reservationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Зареждане на плащането...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Грешка</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/profile')}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Обратно към профила
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Завършване на плащането
          </h1>
          <p className="text-gray-600 mb-8">Резервация #{reservationId}</p>

          {reservation && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Начална дата:</span>
                <span className="font-semibold">
                  {new Date(reservation.startDate).toLocaleDateString('bg-BG')}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Крайна дата:</span>
                <span className="font-semibold">
                  {new Date(reservation.endDate).toLocaleDateString('bg-BG')}
                </span>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                <span className="text-gray-600 text-lg">Обща сума:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {reservation.totalPrice} EUR
                </span>
              </div>
            </div>
          )}

          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance }}
          >
            <CheckoutForm reservationId={reservationId} />
          </Elements>
        </div>
      </div>
    </div>
  );
}

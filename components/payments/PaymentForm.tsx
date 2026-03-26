'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { createPaymentIntent } from '@/lib/api/paymentApi';

type CheckoutFormProps = {
  reservationId: number;
};

type PaymentIntentState = {
  clientSecret: string | null;
  amount: number | null;
};

export default function CheckoutForm({ reservationId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentState>({
    clientSecret: null,
    amount: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reservationId) {
      setLoading(false);
      setError('Invalid reservation.');
      return;
    }

    let isActive = true;

    const loadPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await createPaymentIntent(reservationId);

        if (!isActive) return;

        setPaymentIntent({
          clientSecret: data.clientSecret,
          amount: data.amount,
        });
      } catch (err) {
        if (!isActive) return;

        const message =
          err instanceof Error ? err.message : 'Failed to initialize payment';

        setError(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadPaymentIntent();

    return () => {
      isActive = false;
    };
  }, [reservationId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements || !paymentIntent.clientSecret) {
      setError('Payment form is not ready yet.');
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setError('Card element not loaded.');
      return;
    }

    try {
      setProcessing(true);

      const result = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: { card },
        },
      );

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        router.push(
          `/payment/success?reservationId=${reservationId}&payment_intent=${result.paymentIntent.id}&redirect_status=succeeded`,
        );
        return;
      }

      setError('Payment was not completed.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';

      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const cardOptions = useMemo(
    () => ({
      hidePostalCode: true,
      style: {
        base: {
          fontSize: '16px',
          color: '#1f2937',
          '::placeholder': {
            color: '#9ca3af',
          },
        },
        invalid: {
          color: '#ef4444',
        },
      },
    }),
    [],
  );

  const submitDisabled =
    loading || processing || !stripe || !paymentIntent.clientSecret;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {paymentIntent.amount !== null && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Total Amount:</span>
            <span className="text-2xl font-bold text-indigo-600">
              €{paymentIntent.amount}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Card Details
        </label>
        <CardElement options={cardOptions} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay €${paymentIntent.amount ?? '0.00'}`
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Your payment is secured by Stripe. Test card: 4242 4242 4242 4242
      </p>
    </form>
  );
}

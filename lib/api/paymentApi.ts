export type ConfirmPaymentPayload = {
  reservationId: number;
  paymentIntentId: string;
  redirectStatus?: string | null;
};

export type ConfirmPaymentResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  reservationId?: number;
};

export type CreatePaymentIntentResponse = {
  clientSecret: string;
  amount: number;
};

export async function confirmPayment(
  payload: ConfirmPaymentPayload,
): Promise<ConfirmPaymentResponse> {
  const res = await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data: ConfirmPaymentResponse = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Error confirming payment');
  }

  if (!data?.ok) {
    throw new Error(data?.error || 'Error confirming payment');
  }

  return data;
}

export async function createPaymentIntent(
  reservationId: number,
): Promise<CreatePaymentIntentResponse> {
  const res = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ reservationId }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to initialize payment');
  }

  if (!data?.clientSecret) {
    throw new Error('Missing payment client secret');
  }

  return {
    clientSecret: data.clientSecret,
    amount: Number(data.amount ?? 0),
  };
}

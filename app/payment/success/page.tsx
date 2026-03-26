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

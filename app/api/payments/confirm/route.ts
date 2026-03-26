import { NextResponse } from 'next/server';
import { confirmStripePayment } from '@/lib/services/payments/confirmStripePaymentService';
import { handleConfirmPaymentError } from '@/lib/errors/handleErrorPaymentError';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentIntentId = String(body?.paymentIntentId || '');

    const result = await confirmStripePayment(paymentIntentId);

    return NextResponse.json(result);
  } catch (err) {
    return handleConfirmPaymentError(err);
  }
}

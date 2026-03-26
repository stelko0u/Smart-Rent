import { NextResponse } from 'next/server';
import { createPaymentIntentForReservation } from '@/lib/services/payments/createPaymentIntentService';
import { handleCreatePaymentIntentError } from '@/lib/errors/handleErrorPaymentError';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reservationId = Number(body?.reservationId);

    const result = await createPaymentIntentForReservation(reservationId);

    return NextResponse.json(result);
  } catch (err) {
    return handleCreatePaymentIntentError(err);
  }
}

import { NextResponse } from 'next/server';
import { markPaymentFailed } from '@/lib/services/payments/markPaymentFailedService';
import { handleMarkPaymentFailedError } from '@/lib/errors/handleMarkPaymentFailedError';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const reservationId = Number(body?.reservationId);
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : null;

    const result = await markPaymentFailed({
      reservationId,
      reason,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleMarkPaymentFailedError(err);
  }
}

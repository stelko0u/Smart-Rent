import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { query } from '@/lib/db';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const reservationId = paymentIntent.metadata.reservationId;

    if (reservationId) {
      try {
        // Update reservation status to paid
        await query(
          `UPDATE "Reservation" 
           SET status = 'paid', 
               "paymentIntentId" = $1,
               "paidAt" = NOW(),
               "updatedAt" = NOW()
           WHERE id = $2`,
          [paymentIntent.id, parseInt(reservationId)],
        );

        console.log(`Reservation ${reservationId} marked as paid`);
      } catch (error) {
        console.error('Error updating reservation:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}

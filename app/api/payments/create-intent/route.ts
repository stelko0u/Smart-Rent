import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/lib/auth';
import { query } from '@/app/lib/db';
import { stripe } from '@/app/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Missing reservationId' },
        { status: 400 },
      );
    }

    console.log('💰 Creating payment intent for reservation:', reservationId);

    // Get reservation with car price
    const rows = await query(
      `SELECT 
        r.*,
        c."pricePerDay"
      FROM "Reservation" r 
      JOIN "Car" c ON r."carId" = c.id 
      WHERE r.id = $1 AND r."userId" = $2`,
      [reservationId, user.id],
    );

    if (rows.length === 0) {
      console.log('❌ Reservation not found');
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 },
      );
    }

    const reservation = rows[0];

    // Calculate days (+1 to include both start and end date)
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate total
    const pricePerDay = parseFloat(reservation.pricePerDay);
    const totalAmount = days * pricePerDay;

    console.log('📊 Payment calculation:', {
      days,
      pricePerDay,
      totalAmount,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
    });

    // Stripe expects amount in cents
    const amountInCents = Math.round(totalAmount * 100);

    console.log('💳 Creating Stripe PaymentIntent:', {
      amount: amountInCents,
      currency: 'eur',
      reservationId,
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        reservationId: String(reservationId),
        userId: String(user.id),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
    });
  } catch (error: any) {
    console.error('❌ create-intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 },
    );
  }
}

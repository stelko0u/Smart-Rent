import { NextResponse } from 'next/server';
import { reservationService } from '../../../lib/api';
import stripe from '../../../lib/stripe';

export async function POST(req: Request) {
  try {
    const { reservationId, paymentMethodId } = await req.json();

    if (!reservationId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Reservation ID and Payment Method are required' },
        { status: 400 }
      );
    }

    // Get reservation details
    const reservation = await reservationService.getById(reservationId) as any;

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (reservation.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Only confirmed reservations can be paid' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = days * reservation.car_price;

    try {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          reservationId: reservationId.toString(),
        userId: reservation.userId.toString(),
        carId: reservation.carId.toString(),
        totalAmount: totalAmount.toString(),
        days: days.toString(),
        pricePerDay: reservation.car_price.toString(),
        currency: 'usd'
        }
      });

      // Update reservation with payment details
      await reservationService.updateStatus(reservationId, 'COMPLETED');

      // TODO: Send payment confirmation email
      console.log('Payment successful:', {
        reservationId,
        amount: totalAmount,
        days,
        pricePerDay: reservation.car_price
      });

      return NextResponse.json({
        success: true,
        paymentIntent,
        reservation: {
          ...reservation,
          status: 'COMPLETED',
          paymentIntentId: paymentIntent.id
        }
      });

    } catch (error: any) {
      console.error('Payment processing error:', error);
      return NextResponse.json(
        { error: error.message || 'Payment failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment failed' },
      { status: 500 }
    );
  }
}
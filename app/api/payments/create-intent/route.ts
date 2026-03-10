import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  ReservationRepository,
  CarRepository,
} from '../../../lib/repositories';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservationId } = body;

    if (!reservationId) {
      return NextResponse.json(
        { ok: false, error: 'Missing reservation ID' },
        { status: 400 },
      );
    }

    // Fetch reservation to get the total price
    const reservation = await ReservationRepository.findById(reservationId);

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: 'Reservation not found' },
        { status: 404 },
      );
    }

    // Get car details
    const car = await CarRepository.findById(reservation.carId);

    if (!car) {
      return NextResponse.json(
        { ok: false, error: 'Car not found' },
        { status: 404 },
      );
    }

    // Calculate total price dynamically using same logic as reservation
    const startDate = new Date(reservation.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(reservation.endDate);
    endDate.setHours(23, 59, 59, 999);

    const diffTime = endDate.getTime() - startDate.getTime();
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const totalPrice = days * car.pricePerDay;

    console.log('Payment Intent Calculation:', {
      reservationId,
      carMake: car.make,
      carModel: car.model,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
      pricePerDay: car.pricePerDay,
      totalPrice,
      calculation: `${days} days × $${car.pricePerDay} = $${totalPrice}`,
    });

    // Create Stripe Payment Intent with correct amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        reservationId: reservationId.toString(),
        totalPrice: totalPrice.toString(),
        carId: car.id.toString(),
        carMake: car.make || '',
        carModel: car.model || '',
        days: days.toString(),
        pricePerDay: car.pricePerDay.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // console.log('Payment Intent Created:', {
    //   id: paymentIntent.id,
    //   amount: paymentIntent.amount,
    //   amountInDollars: paymentIntent.amount / 100,
    // });

    return NextResponse.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalPrice,
      days,
      pricePerDay: car.pricePerDay,
      car: {
        make: car.make,
        model: car.model,
      },
    });
  } catch (err) {
    console.error('Create Payment Intent Error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create payment intent',
        details: (err as Error)?.message,
      },
      { status: 500 },
    );
  }
}

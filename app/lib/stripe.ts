import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function processPayment(amount: number, paymentMethodId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
    });

    return { success: true, paymentIntent };
  } catch (error) {
    console.error('Payment processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment failed' };
  }
}

export default stripe;
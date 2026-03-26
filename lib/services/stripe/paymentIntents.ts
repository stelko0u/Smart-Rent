import { stripe } from '@/lib/services/stripe/stripe';

export async function getPaymentIntentOrThrow(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

export async function getChargeIdForPaymentIntent(
  paymentIntentId: string,
): Promise<string> {
  const charges = await stripe.charges.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  return charges.data[0]?.id || '';
}

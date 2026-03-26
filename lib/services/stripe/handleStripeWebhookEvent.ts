import Stripe from 'stripe';
import { handlePaymentIntentSucceeded } from '@/lib/services/stripe/handlePaymentIntentSucceeded';

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(paymentIntent);
      break;
    }

    default:
      break;
  }
}

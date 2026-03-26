import { stripe } from '@/lib/services/stripe/stripe';

export async function getStripeAccountOrThrow(accountId: string) {
  return stripe.accounts.retrieve(accountId);
}

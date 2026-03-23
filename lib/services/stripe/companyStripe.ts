import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripeClient() {
  if (stripeClient) return stripeClient;

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error('stripe_not_configured');
  }

  stripeClient = new Stripe(stripeSecret);
  return stripeClient;
}

export async function createCompanyStripeAccount(input: {
  email: string;
  companyName: string;
}) {
  const stripe = getStripeClient();

  const account = await stripe.accounts.create({
    type: 'express',
    email: input.email,
    business_type: 'company',
    company: {
      name: input.companyName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      source: 'autorent_admin_onboarding',
    },
  });

  console.log({
    id: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    capabilities: account.capabilities,
    requirements: account.requirements,
  });

  return account.id;
}

export async function createCompanyStripeOnboardingLink(accountId: string) {
  const stripe = getStripeClient();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/company/stripe/refresh`,
    return_url: `${baseUrl}/company/stripe/return`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

export async function getStripeAccountStatus(accountId: string) {
  const stripe = getStripeClient();
  return stripe.accounts.retrieve(accountId);
}

export async function rollbackStripeAccount(accountId: string) {
  if (!accountId) return;

  try {
    const stripe = getStripeClient();
    await stripe.accounts.del(accountId);
  } catch (err) {
    console.warn('Stripe rollback failed:', err);
  }
}

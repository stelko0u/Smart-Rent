import { stripe } from '@/lib/services/stripe/stripe';
import { getStripeAccountOrThrow } from '@/lib/services/stripe/stripeAccounts';
import { getReservationCarCompanyForPaymentOrThrow } from '@/lib/services/payments/paymentContextService';
import {
  calculateReservationPricingOrThrow,
  getReservationDateRangeOrThrow,
} from '@/lib/services/payments/paymentPricingService';

export async function createPaymentIntentForReservation(reservationId: number) {
  if (!reservationId || Number.isNaN(reservationId)) {
    throw new Error('MISSING_RESERVATION_ID');
  }

  const { reservation, car, company } =
    await getReservationCarCompanyForPaymentOrThrow(reservationId);

  const connectedAccount = await getStripeAccountOrThrow(
    company.stripeAccountId!,
  );

  const chargesEnabled = connectedAccount.charges_enabled === true;
  const payoutsEnabled = connectedAccount.payouts_enabled === true;

  const disabledReason = connectedAccount.requirements?.disabled_reason ?? null;

  const currentlyDue = connectedAccount.requirements?.currently_due ?? [];
  const pastDue = connectedAccount.requirements?.past_due ?? [];

  if (!chargesEnabled || !payoutsEnabled) {
    const error = new Error('STRIPE_ACCOUNT_NOT_READY');
    (error as any).stripeDetails = {
      accountId: connectedAccount.id,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted: connectedAccount.details_submitted,
      disabledReason,
      currentlyDue,
      pastDue,
      capabilities: connectedAccount.capabilities,
    };
    throw error;
  }

  const { startDate, endDate } = getReservationDateRangeOrThrow(
    reservation.startDate,
    reservation.endDate,
  );

  const pricing = calculateReservationPricingOrThrow({
    startDate,
    endDate,
    pricePerDay: car.pricePerDay,
    maintenancePercent: company.maintenancePercent,
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pricing.amount,
    currency: 'eur',
    transfer_data: {
      destination: company.stripeAccountId!,
    },
    application_fee_amount: pricing.applicationFeeAmount,
    on_behalf_of: company.stripeAccountId!,
    metadata: {
      reservationId: String(reservationId),
      companyId: String(company.id),
      companyStripeAccountId: company.stripeAccountId!,
      totalPrice: String(pricing.totalPrice),
      carId: String(car.id),
      carMake: car.make || '',
      carModel: car.model || '',
      days: String(pricing.days),
      pricePerDay: String(car.pricePerDay),
      maintenancePercent: String(pricing.maintenancePercent),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return {
    ok: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: pricing.totalPrice,
    platformFee: Number((pricing.applicationFeeAmount / 100).toFixed(2)),
    companyStripeAccountId: company.stripeAccountId,
    days: pricing.days,
    pricePerDay: car.pricePerDay,
    maintenancePercent: pricing.maintenancePercent,
    car: {
      make: car.make,
      model: car.model,
    },
  };
}

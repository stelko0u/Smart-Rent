import { ReservationRepository } from '@/lib/repository/ReservationRepository';
import {
  getChargeIdForPaymentIntent,
  getPaymentIntentOrThrow,
} from '@/lib/services/stripe/paymentIntents';
import { getReservationCarCompanyForPaymentOrThrow } from '@/lib/services/payments/paymentContextService';
import { saveConfirmedPayment } from '@/lib/services/payments/saveConfirmedPayment';
import { tryCreateAndSendCustomerInvoice } from '@/lib/services/payments/customerInvoiceService';

export async function confirmStripePayment(paymentIntentId: string) {
  if (!paymentIntentId || !paymentIntentId.trim()) {
    throw new Error('MISSING_PAYMENT_INTENT_ID');
  }

  const paymentIntent = await getPaymentIntentOrThrow(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    const error = new Error('PAYMENT_NOT_SUCCESSFUL');
    (error as any).paymentStatus = paymentIntent.status;
    throw error;
  }

  const reservationId = Number(paymentIntent.metadata.reservationId);

  if (!reservationId || Number.isNaN(reservationId)) {
    throw new Error('INVALID_RESERVATION_ID');
  }

  const { reservation, car, company } =
    await getReservationCarCompanyForPaymentOrThrow(reservationId);

  const totalAmount = Number((paymentIntent.amount / 100).toFixed(2));
  const applicationFeeAmount = paymentIntent.application_fee_amount || 0;
  const platformFee = Number((applicationFeeAmount / 100).toFixed(2));
  const companyEarnings = Number((totalAmount - platformFee).toFixed(2));

  const reservationTotalPrice = Number(reservation.totalPrice || 0);
  const metadataTotalPrice = Number(paymentIntent.metadata.totalPrice || 0);

  const totalPrice =
    metadataTotalPrice > 0 ? metadataTotalPrice : reservationTotalPrice;

  const chargeId = await getChargeIdForPaymentIntent(paymentIntentId);

  const { savedPayment, wasAlreadyPaid } = await saveConfirmedPayment({
    reservationId,
    companyId: Number(car.companyId),
    paymentIntentId,
    chargeId,
    totalAmount,
    totalPrice,
    platformFee,
    companyEarnings,
  });

  await ReservationRepository.update(reservationId, {
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'CARD',
  });

  let stripeInvoice: any = null;
  let invoiceEmailSent = false;
  let invoiceWarning: string | null = null;

  if (!wasAlreadyPaid) {
    const invoiceResult = await tryCreateAndSendCustomerInvoice({
      company,
      reservation,
      car,
      paymentIntentId,
      chargeId,
      totalAmount,
      platformFee,
      companyEarnings,
      paidAt: savedPayment?.paidAt || new Date(),
    });

    stripeInvoice = invoiceResult.stripeInvoice;
    invoiceEmailSent = invoiceResult.invoiceEmailSent;
    invoiceWarning = invoiceResult.invoiceWarning;
  }

  return {
    ok: true,
    message: wasAlreadyPaid
      ? 'Payment was already confirmed.'
      : 'Payment confirmed and reservation is now confirmed.',
    payment: savedPayment,
    reservationId,
    invoice: stripeInvoice
      ? {
          id: stripeInvoice.id,
          number: stripeInvoice.number,
          hosted_invoice_url: stripeInvoice.hosted_invoice_url,
          invoice_pdf: stripeInvoice.invoice_pdf,
        }
      : null,
    invoiceEmailSent,
    invoiceWarning,
  };
}

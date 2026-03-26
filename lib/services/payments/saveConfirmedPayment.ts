import { PaymentsRepository } from '@/lib/repository/PaymentsRepository';

type SaveConfirmedPaymentInput = {
  reservationId: number;
  companyId: number;
  paymentIntentId: string;
  chargeId: string;
  totalAmount: number;
  totalPrice: number;
  platformFee: number;
  companyEarnings: number;
};

export async function saveConfirmedPayment({
  reservationId,
  companyId,
  paymentIntentId,
  chargeId,
  totalAmount,
  totalPrice,
  platformFee,
  companyEarnings,
}: SaveConfirmedPaymentInput) {
  const existingPayment =
    await PaymentsRepository.findByReservation(reservationId);

  if (existingPayment) {
    if (
      existingPayment.paymentStatus === 'PAID' &&
      existingPayment.stripePaymentIntentId === paymentIntentId
    ) {
      return {
        savedPayment: existingPayment,
        wasAlreadyPaid: true,
      };
    }

    const savedPayment = await PaymentsRepository.update(existingPayment.id, {
      paymentStatus: 'PAID' as const,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      paidAt: new Date(),
      amount: totalAmount,
      totalPrice,
      platformFee,
      companyEarnings,
      paymentMethod: 'CARD' as const,
    });

    return {
      savedPayment,
      wasAlreadyPaid: false,
    };
  }

  const savedPayment = await PaymentsRepository.create({
    reservationId,
    companyId,
    amount: totalAmount,
    totalPrice,
    platformFee,
    companyEarnings,
    paymentStatus: 'PAID' as const,
    paymentMethod: 'CARD' as const,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: chargeId,
    paidAt: new Date(),
  });

  return {
    savedPayment,
    wasAlreadyPaid: false,
  };
}

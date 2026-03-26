export function getReservationDateRangeOrThrow(
  startDateInput: string | Date,
  endDateInput: string | Date,
) {
  const startDate = new Date(startDateInput);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(endDateInput);
  endDate.setHours(23, 59, 59, 999);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('INVALID_RESERVATION_DATES');
  }

  return { startDate, endDate };
}

export function calculateReservationPricingOrThrow(input: {
  startDate: Date;
  endDate: Date;
  pricePerDay: number | string | null | undefined;
  maintenancePercent: number | string | null | undefined;
}) {
  const diffTime = input.endDate.getTime() - input.startDate.getTime();
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const pricePerDay = Number(input.pricePerDay || 0);
  const totalPrice = Number((days * pricePerDay).toFixed(2));

  if (totalPrice <= 0) {
    const error = new Error('INVALID_TOTAL_PRICE');
    (error as any).pricingDebug = {
      days,
      pricePerDay: input.pricePerDay,
      totalPrice,
    };
    throw error;
  }

  const maintenancePercent = Number(input.maintenancePercent || 0);
  const amount = Math.round(totalPrice * 100);
  const applicationFeeAmount = Math.round(amount * (maintenancePercent / 100));

  return {
    days,
    pricePerDay,
    totalPrice,
    maintenancePercent,
    amount,
    applicationFeeAmount,
  };
}

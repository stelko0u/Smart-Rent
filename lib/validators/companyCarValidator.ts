import type { CarType, FuelType, TransmissionType } from '@/types/types';

type Input = {
  make: string | null;
  model: string | null;
  year: number | null;
  pricePerDay: number | null;
  power: number | null;
  displacement: number | null;
  carType: CarType | null;
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
};

export function validateCompanyCarInput(input: Input) {
  if (!input.make || !input.model) {
    throw new Error('MISSING_MAKE_OR_MODEL');
  }

  if (!input.year || Number.isNaN(Number(input.year))) {
    throw new Error('INVALID_YEAR');
  }

  if (
    !input.pricePerDay ||
    Number.isNaN(Number(input.pricePerDay)) ||
    Number(input.pricePerDay) <= 0
  ) {
    throw new Error('INVALID_PRICE');
  }

  if (!input.carType) {
    throw new Error('INVALID_CAR_TYPE');
  }

  if (!input.transmissionType) {
    throw new Error('INVALID_TRANSMISSION');
  }

  if (!input.fuelType) {
    throw new Error('INVALID_FUEL_TYPE');
  }

  if (
    !input.power ||
    Number.isNaN(Number(input.power)) ||
    Number(input.power) <= 0
  ) {
    throw new Error('INVALID_POWER');
  }

  if (
    !input.displacement ||
    Number.isNaN(Number(input.displacement)) ||
    Number(input.displacement) <= 0
  ) {
    throw new Error('INVALID_DISPLACEMENT');
  }
}

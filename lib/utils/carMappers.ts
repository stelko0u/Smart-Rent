import type { CarType, TransmissionType, FuelType } from '@/types/types';

export function mapCarType(input?: string | null): CarType | null {
  if (!input) return null;
  const v = input.toString().trim().toLowerCase();
  const map: Record<string, CarType> = {
    sedan: 'SEDAN',
    hatchback: 'HATCHBACK',
    suv: 'SUV',
    coupe: 'COUPE',
    convertible: 'CONVERTIBLE',
    wagon: 'WAGON',
    van: 'VAN',
    pickup: 'PICKUP',
    other: 'OTHER',
  };
  return map[v] ?? null;
}

export function mapTransmissionType(
  input?: string | null,
): TransmissionType | null {
  if (!input) return null;
  const v = input.toString().trim().toLowerCase();
  const map: Record<string, TransmissionType> = {
    manual: 'MANUAL',
    automatic: 'AUTOMATIC',
    other: 'OTHER',
  };
  return map[v] ?? null;
}

export function mapFuelType(input?: string | null): FuelType | null {
  if (!input) return null;
  const v = input.toString().trim().toLowerCase();
  const map: Record<string, FuelType> = {
    petrol: 'PETROL',
    diesel: 'DIESEL',
    electricity: 'ELECTRICITY',
  };
  return map[v] ?? null;
}

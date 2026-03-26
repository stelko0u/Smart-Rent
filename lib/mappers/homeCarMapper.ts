import type { HomeCar } from '@/types/home';
import type { CarRow } from '@/lib/repository/car/carBrowseRepository';

function toSafeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function extractImage(images: unknown): string {
  if (!Array.isArray(images) || images.length === 0) {
    return '';
  }

  return toSafeString(images[0]);
}

function extractLocation(car: CarRow): string {
  return toSafeString(car.officeName) || toSafeString(car.officeAddress);
}

export function mapCarToHomeCar(car: CarRow): HomeCar {
  const make = toSafeString(car.make);
  const model = toSafeString(car.model);

  return {
    id: toSafeNumber(car.id),
    name: `${make} ${model}`.trim(),
    make,
    model,
    bodyType: toSafeString(car.carType),
    year: toSafeNumber(car.year),
    horsepower: toSafeNumber(car.power),
    transmission: toSafeString(car.transmissionType),
    fuelType: toSafeString(car.fuelType),
    location: extractLocation(car),
    pricePerDay: toSafeNumber(car.pricePerDay),
    img: extractImage(car.images),
    companyName: car.companyName ?? null,
  };
}

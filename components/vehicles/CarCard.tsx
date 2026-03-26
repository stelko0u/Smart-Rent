'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/providers/LanguageProvider';
import type { HomeCar } from '@/types/home';

type CarCardProps = {
  car: HomeCar;
};

function formatLabel(value?: string) {
  if (!value) return '-';

  const normalized = value.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function translateEnum(
  t: (key: string) => string,
  baseKey: string,
  value?: string,
) {
  if (!value) return '-';

  const normalizedValue = value.toLowerCase();
  const fullKey = `${baseKey}.${normalizedValue}`;
  const translated = t(fullKey);

  if (translated !== fullKey) {
    return translated;
  }

  return formatLabel(value);
}

export default function CarCard({ car }: CarCardProps) {
  const { t } = useTranslation();

  const imageSrc = car.img || null;
  const carTitle =
    car.name?.trim() ||
    `${car.make ?? ''} ${car.model ?? ''}`.trim() ||
    'Автомобил';

  const bodyTypeLabel = translateEnum(t, 'vehicle.bodyTypes', car.bodyType);
  const transmissionLabel = translateEnum(
    t,
    'vehicle.transmissions',
    car.transmission,
  );
  const fuelTypeLabel = translateEnum(t, 'vehicle.fuelTypes', car.fuelType);

  return (
    <Link
      href={`/car/${car.id}`}
      className="group overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-56 w-full overflow-hidden bg-gray-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={carTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Няма снимка
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900">
              {carTitle}
            </h3>
            <p className="mt-1 truncate text-sm text-gray-500">
              {car.make} {car.model}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {car.year || '-'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="rounded-2xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">{t('vehicle.bodyType')}</p>
            <p className="font-medium text-gray-800">{bodyTypeLabel}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">{t('vehicle.fuelType')}</p>
            <p className="font-medium text-gray-800">{fuelTypeLabel}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">{t('vehicle.transmission')}</p>
            <p className="font-medium text-gray-800">{transmissionLabel}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400">{t('vehicle.horsepower')}</p>
            <p className="font-medium text-gray-800">
              {car.horsepower ? `${car.horsepower} ${t('vehicle.hp')}` : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">{t('vehicle.location')}</p>
            <p className="truncate text-sm font-medium text-gray-800">
              {car.location || '-'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-gray-900">
              €{Number(car.pricePerDay ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">{t('vehicle.pricePerDay')}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

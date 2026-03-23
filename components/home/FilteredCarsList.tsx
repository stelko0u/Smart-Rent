'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCarSearch } from '@/providers/CarSearchProvider';

export default function FilteredCarsList() {
  const { filteredCars } = useCarSearch();

  if (!filteredCars.length) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Няма намерени автомобили
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Опитай да промениш филтрите или изчисти част от тях.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
      {filteredCars.map((car) => (
        <Link
          key={car.id}
          href={`/cars/${car.id}`}
          className="group overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="relative h-56 w-full overflow-hidden bg-gray-100">
            {car.img ? (
              <Image
                src={car.img}
                alt={car.name}
                fill
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
              <div>
                <h3 className="text-lg font-bold text-gray-900">{car.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {car.companyName || 'Компания'}
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {car.year || '-'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="rounded-2xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-400">Купе</p>
                <p className="font-medium text-gray-800">
                  {car.bodyType || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-400">Гориво</p>
                <p className="font-medium text-gray-800">
                  {car.fuelType || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-400">Скорости</p>
                <p className="font-medium text-gray-800">
                  {car.transmission || '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-400">Конски сили</p>
                <p className="font-medium text-gray-800">
                  {car.horsepower || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
              <div>
                <p className="text-xs text-gray-400">Локация</p>
                <p className="text-sm font-medium text-gray-800">
                  {car.location || '-'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  €{car.pricePerDay.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">на ден</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

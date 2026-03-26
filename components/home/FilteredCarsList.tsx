'use client';

import { useCarSearch } from '@/providers/CarSearchProvider';
import CarCard from '../vehicles/CarCard';

export default function FilteredCarsList() {
  const { filteredCars } = useCarSearch();
  const normalize = (value?: string) => value?.toLowerCase() || '';

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
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}

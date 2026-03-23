'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { HomeCar, SearchFilters } from '@/types/home';

type CarSearchContextType = {
  cars: HomeCar[];
  filteredCars: HomeCar[];
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => void;
  resetFilters: () => void;
  uniqueMakes: string[];
  uniqueLocations: string[];
  uniqueBodyTypes: string[];
  uniqueTransmissions: string[];
  uniqueFuelTypes: string[];
};

const defaultFilters: SearchFilters = {
  query: '',
  make: '',
  location: '',
  bodyType: '',
  transmission: '',
  fuelType: '',
  minPrice: '',
  maxPrice: '',
  minHorsepower: '',
  maxHorsepower: '',
  yearFrom: '',
  yearTo: '',
  startDate: '',
  endDate: '',
};

const CarSearchContext = createContext<CarSearchContextType | null>(null);

function normalizeValue(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .trim();
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean).map((v) => v.trim()))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function CarSearchProvider({
  cars,
  children,
}: {
  cars: HomeCar[];
  children: React.ReactNode;
}) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);

  const setFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const q = normalizeValue(filters.query);

      if (q) {
        const haystack = [
          car.name,
          car.make,
          car.model,
          car.bodyType,
          car.transmission,
          car.fuelType,
          car.location,
          car.companyName ?? '',
          car.year,
          car.horsepower,
          car.pricePerDay,
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      if (filters.make && car.make !== filters.make) return false;
      if (filters.location && car.location !== filters.location) return false;
      if (filters.bodyType && car.bodyType !== filters.bodyType) return false;
      if (filters.transmission && car.transmission !== filters.transmission)
        return false;
      if (filters.fuelType && car.fuelType !== filters.fuelType) return false;

      if (filters.minPrice && car.pricePerDay < Number(filters.minPrice))
        return false;
      if (filters.maxPrice && car.pricePerDay > Number(filters.maxPrice))
        return false;

      if (
        filters.minHorsepower &&
        car.horsepower < Number(filters.minHorsepower)
      ) {
        return false;
      }

      if (
        filters.maxHorsepower &&
        car.horsepower > Number(filters.maxHorsepower)
      ) {
        return false;
      }

      if (filters.yearFrom && car.year < Number(filters.yearFrom)) return false;
      if (filters.yearTo && car.year > Number(filters.yearTo)) return false;

      return true;
    });
  }, [cars, filters]);

  const uniqueMakes = useMemo(
    () => uniqueSorted(cars.map((c) => c.make)),
    [cars],
  );
  const uniqueLocations = useMemo(
    () => uniqueSorted(cars.map((c) => c.location)),
    [cars],
  );
  const uniqueBodyTypes = useMemo(
    () => uniqueSorted(cars.map((c) => c.bodyType)),
    [cars],
  );
  const uniqueTransmissions = useMemo(
    () => uniqueSorted(cars.map((c) => c.transmission)),
    [cars],
  );
  const uniqueFuelTypes = useMemo(
    () => uniqueSorted(cars.map((c) => c.fuelType)),
    [cars],
  );

  return (
    <CarSearchContext.Provider
      value={{
        cars,
        filteredCars,
        filters,
        setFilter,
        resetFilters,
        uniqueMakes,
        uniqueLocations,
        uniqueBodyTypes,
        uniqueTransmissions,
        uniqueFuelTypes,
      }}
    >
      {children}
    </CarSearchContext.Provider>
  );
}

export function useCarSearch() {
  const ctx = useContext(CarSearchContext);

  if (!ctx) {
    throw new Error('useCarSearch must be used inside CarSearchProvider');
  }

  return ctx;
}

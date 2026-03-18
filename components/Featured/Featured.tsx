'use client';

import React from 'react';
import CarCard from '../vehicles/CarCard';

type Car = {
  id: number;
  name: string;
  type: string;
  pricePerDay: number;
  img: string;
};

type FeaturedProps = {
  cars: Car[];
};

export default function Featured({ cars }: FeaturedProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cars.length > 0 ? (
        cars.map((car) => <CarCard key={car.id} car={car} />)
      ) : (
        <div className="col-span-full text-center py-12 text-gray-500">
          No cars available
        </div>
      )}
    </div>
  );
}

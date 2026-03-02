'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface CarCardProps {
  car: {
    id: number;
    name: string;
    type: string;
    pricePerDay: number;
    img: string;
  };
  showReserveButton?: boolean;
}

export default function CarCard({
  car,
  showReserveButton = true,
}: CarCardProps) {
  const router = useRouter();

  const handleReserveClick = () => {
    router.push(`/reservation/${car.id}`);
  };

  const handleDetailsClick = () => {
    router.push(`/car/${car.id}`);
  };

  return (
    <article
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
      onClick={() => router.push(`/car/${car.id}`)}
    >
      <div className="h-62 bg-gray-100 flex items-center justify-center text-gray-500">
        {car.img.length > 0 ? (
          <img
            src={car.img}
            alt={car.name}
            /* Тук добавихме object-center (или сложи object-bottom, ако колата е в долната част на оригиналната снимка) */
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="text-blue-800 text-xl"
            role="img"
            aria-label="No image"
          >
            No image
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{car.name}</h3>
            <p className="text-sm text-gray-500">{car.type}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-indigo-600">${car.pricePerDay}</div>
            <div className="text-xs text-gray-400">/ day</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/payment/${car.id}`);
            }}
          >
            Rent now
          </button>
        </div>
      </div>
    </article>
  );
}

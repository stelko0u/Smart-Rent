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
    <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative">
      <div className="relative h-44 bg-gray-100 flex items-center justify-center text-gray-500">
        <img
          src={car.img}
          alt={car.name}
          className="w-full h-full object-cover absolute inset-0"
        />
        {!car.img && (
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0l4.586 4.586a2 2 0 002.828 0z"
            />
          </svg>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 hover:opacity-100 transition-all duration-300">
          <div className="h-full flex items-center justify-center">
            <div className="text-white text-center p-4">
              <h3 className="text-lg font-bold">{car.name}</h3>
              <p className="text-sm text-gray-200 mb-2">{car.type}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{car.name}</h3>
          <p className="text-sm text-gray-500">{car.type}</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-indigo-600">{car.pricePerDay}</div>
          <div className="text-xs text-gray-400">/ day</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex gap-2">
          {showReserveButton && (
            <button
              onClick={handleReserveClick}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition duration-200 transform hover:scale-105"
            >
              Reserve Now
            </button>
          )}
          <button
            onClick={handleDetailsClick}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
}

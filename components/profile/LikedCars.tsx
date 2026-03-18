'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images: string[];
  carType: string;
  transmissionType: string;
}

interface Props {
  userId: number;
}

export default function LikedCars({ userId }: Props) {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      const res = await fetch('/api/user/favorites', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load favorites');
      }

      const data = await res.json();
      setCars(data.favorites || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (carId: number) => {
    try {
      const res = await fetch(`/api/user/favorites/${carId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setCars(cars.filter((car) => car.id !== carId));
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">Loading favorites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Liked Cars</h2>
        <p className="text-sm text-gray-600 mt-1">
          Cars you've saved for later
        </p>
      </div>

      <div className="p-6">
        {cars.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p>No liked cars yet</p>
            <p className="text-sm mt-2">Browse cars and save your favorites!</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Browse Cars
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {cars.map((car) => (
              <div
                key={car.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
              >
                <div className="relative">
                  {car.images?.[0] && (
                    <img
                      src={car.images[0]}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => router.push(`/car/${car.id}`)}
                    />
                  )}
                  <button
                    onClick={() => handleRemoveFavorite(car.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-red-500 hover:text-white transition shadow-lg"
                    title="Remove from favorites"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-4">
                  <h3
                    className="font-semibold text-lg text-gray-900 mb-1 cursor-pointer hover:text-indigo-600"
                    onClick={() => router.push(`/car/${car.id}`)}
                  >
                    {car.make} {car.model}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{car.year}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>{car.carType}</span>
                    <span>•</span>
                    <span>{car.transmissionType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-indigo-600">
                      ${car.pricePerDay}
                      <span className="text-sm font-normal text-gray-600">
                        /day
                      </span>
                    </div>

                    <button
                      onClick={() => router.push(`/reservation/${car.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                    >
                      Rent Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

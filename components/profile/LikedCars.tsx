'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getFavoriteCars,
  removeFavoriteCar,
  type FavoriteCar,
} from '@/lib/api/userApi';
import { FullHeart } from '../icons';

interface Props {
  userId: number;
}

export default function LikedCars({ userId }: Props) {
  const router = useRouter();
  const [cars, setCars] = useState<FavoriteCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError(null);

        const favorites = await getFavoriteCars();

        if (!isActive) return;
        setCars(favorites);
      } catch (err) {
        if (!isActive) return;

        const message =
          err instanceof Error ? err.message : 'Failed to load favorites';

        setError(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadFavorites();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const handleRemoveFavorite = async (carId: number) => {
    if (removingId === carId) return;

    try {
      setRemovingId(carId);
      await removeFavoriteCar(carId);
      setCars((prev) => prev.filter((car) => car.id !== carId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-8 shadow">
        <div className="text-center text-gray-500">Loading favorites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-8 shadow">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b p-6">
        <h2 className="text-xl font-semibold text-gray-800">Liked Cars</h2>
        <p className="mt-1 text-sm text-gray-600">
          Cars you&apos;ve saved for later
        </p>
      </div>

      <div className="p-6">
        {cars.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-300"
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
            <p className="mt-2 text-sm">Browse cars and save your favorites!</p>

            <button
              onClick={() => router.push('/')}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
            >
              Browse Cars
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {cars.map((car) => (
              <div
                key={car.id}
                className="group overflow-hidden rounded-lg border transition hover:shadow-lg"
              >
                <div className="relative">
                  {car.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={car.images[0]}
                      alt={`${car.make} ${car.model}`}
                      className="h-48 w-full cursor-pointer object-cover"
                      onClick={() => router.push(`/car/${car.id}`)}
                    />
                  )}

                  <button
                    onClick={() => handleRemoveFavorite(car.id)}
                    disabled={removingId === car.id}
                    className="absolute right-3 top-3 rounded-full  p-2 shadow-lg  bg-red-500 hover:bg-red-700 hover:scale-105 transition-all cursor-pointer hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    title="Remove from favorites"
                    type="button"
                  >
                    <FullHeart className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4">
                  <h3
                    className="mb-1 cursor-pointer text-lg font-semibold text-gray-900 hover:text-indigo-600"
                    onClick={() => router.push(`/car/${car.id}`)}
                  >
                    {car.make} {car.model}
                  </h3>

                  <p className="mb-3 text-sm text-gray-600">{car.year}</p>

                  <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
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
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition hover:bg-indigo-700"
                      type="button"
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

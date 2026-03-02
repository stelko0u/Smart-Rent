'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ImageSlider from '../../components/vehicles/ImageSlider';
import { Car as CarType } from '../../types/types';
import Engine from '../../components/icons/Engine';
import GasPump from '../../components/icons/GasPump';
import Transmission from '../../components/icons/Transmission';
import Car from '../../components/icons/Car';
import Cube from '../../components/icons/Cube';
import ReviewsList from '../../components/vehicles/ReviewsList';

export default function CarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params?.id as string;
  const [car, setCar] = useState<CarType | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;

    async function loadCar() {
      try {
        const res = await fetch(`/api/cars/${carId}`);
        if (!res.ok) {
          throw new Error('Failed to load car details');
        }
        const data = await res.json();
        setCar(data.car);
      } catch (err: any) {
        setError(err.message || 'Failed to load car');
      } finally {
        setLoading(false);
      }
    }

    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?carId=${carId}`);
        if (!res.ok) {
          throw new Error('Failed to load reviews');
        }
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err: any) {
        console.error('Failed to load reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    }

    loadCar();
    loadReviews();
  }, [carId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Car not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-250 md:max-w-350 mx-auto px-4 py-8 ">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ImageSlider
              images={car.images || []}
              carName={`${car.make} ${car.model}`}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {car.make} {car.model}
            </h1>
            <p className="text-xl text-gray-600 mb-6">{car.year}</p>
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-indigo-600">
                €{car.pricePerDay}
                <span className="text-lg font-normal text-gray-600">
                  {' '}
                  / day
                </span>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-600">
                Specifications
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Car className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.carType || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Transmission className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.transmissionType || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GasPump className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.fuelType || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Engine className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.power || 'N/A'} HP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Cube className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">
                    {car.displacement || 'N/A'} cc
                  </span>
                </div>
              </div>
            </div>
            {car.company && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Rental Company
                </h3>
                <p className="text-gray-900">{car.company.name}</p>
              </div>
            )}
            <button
              onClick={() => router.push(`/reservation/${car.id}`)}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              Reserve Now
            </button>
          </div>
        </div>

        <div className="mt-8">
          <ReviewsList reviews={reviews} loading={reviewsLoading} />
        </div>
      </div>
    </div>
  );
}

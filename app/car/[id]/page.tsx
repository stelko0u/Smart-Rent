'use client';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import ImageSlider from '../../../components/vehicles/ImageSlider';
import { Car as CarType } from '../../../types/types';
import Engine from '../../../components/icons/Engine';
import GasPump from '../../../components/icons/GasPump';
import Transmission from '../../../components/icons/Transmission';
import Car from '../../../components/icons/Car';
import Cube from '../../../components/icons/Cube';
import ReviewsList from '../../../components/vehicles/ReviewsList';
import { getLoggedInUser } from '@/lib/api/userApi';
import { fetchOfficeByCarId } from '@/lib/api/carApi';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

function LocationPinIcon({ className = 'w-6 h-6 text-gray-500' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export default function CarDetailPage() {
  const CarLocationMap = dynamic(
    () => import('@/components/vehicles/CarLocationMap'),
    {
      ssr: false,
    },
  );

  const router = useRouter();
  const params = useParams();
  const carId = params?.id as string;

  const [car, setCar] = useState<CarType | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAddReview, setCanAddReview] = useState(false);
  const [activeReservationId, setActiveReservationId] = useState<number | null>(
    null,
  );
  const [user, setUser] = useState<any | null>(null);
  const [office, setOffice] = useState<any | null>(null);

  const searchParams = useSearchParams();
  const shouldOpenReviewForm = searchParams.get('review') === '1';

  useEffect(() => {
    async function fetchUser() {
      const loggedInUser = await getLoggedInUser();
      setUser(loggedInUser);
    }

    fetchUser();
  }, []);

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

    async function loadOffice() {
      try {
        const officeData = await fetchOfficeByCarId(Number(carId));
        setOffice(officeData);
      } catch (err) {
        console.error('Failed to load office details:', err);
      }
    }

    loadCar();
    loadReviews();
    loadOffice();
  }, [carId]);

  useEffect(() => {
    async function checkReviewEligibility() {
      const token = localStorage.getItem('token');

      if (!token) {
        setCanAddReview(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/reviews/check-eligibility?carId=${carId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.ok) {
          const data = await res.json();
          setCanAddReview(data.canAddReview);
          setActiveReservationId(data.reservationId);
        }
      } catch (error) {
        console.error('Error checking review eligibility:', error);
      }
    }

    if (carId && !reviewsLoading) {
      checkReviewEligibility();
    }
  }, [carId, reviewsLoading]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please sign in to submit a review');
      router.push('/signin');
      return;
    }

    if (!activeReservationId) {
      throw new Error('No active reservation found');
    }

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        carId: parseInt(carId),
        rating,
        comment,
        reservationId: activeReservationId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit review');
    }

    const newReview = await res.json();
    setReviews((prev) => [newReview, ...prev]);
    setCanAddReview(false);
  };

  const locationLabel =
    office?.city ||
    office?.town ||
    office?.municipality ||
    office?.address ||
    (office?.latitude && office?.longitude
      ? `${office.latitude}, ${office.longitude}`
      : 'N/A');

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

                <div className="flex items-center gap-2">
                  <LocationPinIcon className="text-gray-500 w-6 h-6" />
                  <span className="text-sm text-gray-600">{locationLabel}</span>
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

        {office && (
          <div className="my-5">
            <CarLocationMap lat={office.latitude} lng={office.longitude} />
          </div>
        )}

        <div className="mt-8">
          <ReviewsList
            reviews={reviews}
            loading={reviewsLoading}
            canAddReview={canAddReview}
            initialOpen={shouldOpenReviewForm}
            onSubmitReview={handleSubmitReview}
          />
        </div>
      </div>
    </div>
  );
}

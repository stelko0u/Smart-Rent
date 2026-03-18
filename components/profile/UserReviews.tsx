'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Review {
  id: number;
  carId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
}

interface Props {
  userId: number;
}

export default function UserReviews({ userId }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    try {
      const res = await fetch('/api/user/reviews', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to load reviews');
      }

      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">Loading reviews...</div>
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
        <h2 className="text-xl font-semibold text-gray-800">My Reviews</h2>
        <p className="text-sm text-gray-600 mt-1">
          Reviews you've written for rented cars
        </p>
      </div>

      <div className="divide-y">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
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
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <p>No reviews yet</p>
            <p className="text-sm mt-2">
              Rent a car and share your experience!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex gap-4">
                {review.car?.images?.[0] && (
                  <img
                    src={review.car.images[0]}
                    alt={`${review.car.make} ${review.car.model}`}
                    className="w-24 h-20 object-cover rounded-lg cursor-pointer"
                    onClick={() => router.push(`/car/${review.carId}`)}
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3
                        className="font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                        onClick={() => router.push(`/car/${review.carId}`)}
                      >
                        {review.car?.make} {review.car?.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 text-sm mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

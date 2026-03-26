'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserReviews, type UserReview } from '@/lib/api/userApi';

interface Props {
  userId: number;
}

export default function UserReviews({ userId }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getUserReviews();

        if (!isActive) return;
        setReviews(data);
      } catch (err) {
        if (!isActive) return;

        const message =
          err instanceof Error ? err.message : 'Failed to load reviews';

        setError(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
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
      <div className="rounded-lg bg-white p-8 shadow">
        <div className="text-center text-gray-500">Loading reviews...</div>
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
        <h2 className="text-xl font-semibold text-gray-800">My Reviews</h2>
        <p className="mt-1 text-sm text-gray-600">
          Reviews you've written for rented cars
        </p>
      </div>

      <div className="divide-y">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
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
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <p>No reviews yet</p>
            <p className="mt-2 text-sm">
              Rent a car and share your experience!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6 transition hover:bg-gray-50">
              <div className="flex gap-4">
                {review.car?.images?.[0] && (
                  <img
                    src={review.car.images[0]}
                    alt={`${review.car.make} ${review.car.model}`}
                    className="h-20 w-24 cursor-pointer rounded-lg object-cover"
                    onClick={() => router.push(`/car/${review.carId}`)}
                  />
                )}

                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3
                        className="cursor-pointer font-semibold text-gray-900 hover:text-indigo-600"
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
                    <p className="mt-2 text-sm text-gray-700">
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

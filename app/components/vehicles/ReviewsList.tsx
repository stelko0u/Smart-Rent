'use client';

import React from 'react';
import { EmptyStar, FullStar } from '@/app/components/icons';

interface Review {
  id?: number;
  rating: number;
  comment: string;
  createdAt?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface ReviewsListProps {
  reviews: Review[];
  loading: boolean;
}

export default function ReviewsList({ reviews, loading }: ReviewsListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Reviews</h2>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Reviews</h2>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <div key={review.id ?? idx} className="border rounded p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  {review.user?.name
                    ? review.user.name.trim().charAt(0).toUpperCase()
                    : 'A'}
                </div>

                <div className="flex flex-col">
                  <div className="font-semibold text-gray-900 flex items-center justify-between gap-1">
                    {review.user?.name || 'Anonymous'}
                    <span className="text-sm text-gray-500 ml-1">
                      &lt;{review.user?.email}&gt;
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString()
                      : ''}
                  </div>
                </div>
              </div>

              <div className="flex gap-1 mt-3">
                {Array.from({ length: 5 }).map((_, index) =>
                  index < (review.rating ?? 0) ? (
                    <FullStar key={index} className="text-yellow-400 w-5 h-5" />
                  ) : (
                    <EmptyStar key={index} className="text-gray-300 w-5 h-5" />
                  ),
                )}
              </div>

              <p className="text-gray-700 mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No reviews yet.</p>
      )}
    </div>
  );
}

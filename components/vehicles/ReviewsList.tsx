'use client';

import React, { useEffect, useState } from 'react';
import { EmptyStar, FullStar } from '@/components/icons';

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
  canAddReview?: boolean;
  initialOpen?: boolean;
  onSubmitReview?: (rating: number, comment: string) => Promise<void>;
}

export default function ReviewsList({
  reviews,
  loading,
  canAddReview = false,
  initialOpen = false,
  onSubmitReview,
}: ReviewsListProps) {
  const [showReviewForm, setShowReviewForm] = useState(initialOpen);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialOpen && canAddReview) {
      setShowReviewForm(true);
    }
  }, [initialOpen, canAddReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0 || !comment.trim()) {
      alert('Please select a rating and write a comment');
      return;
    }

    if (onSubmitReview) {
      setSubmitting(true);
      try {
        await onSubmitReview(rating, comment);
        setRating(0);
        setComment('');
        setShowReviewForm(false);
      } catch (error: any) {
        console.error('Error submitting review:', error);
        alert(error.message || 'Error submitting review');
      } finally {
        setSubmitting(false);
      }
    }
  };

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Reviews</h2>

        {canAddReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Write Review
          </button>
        )}
      </div>

      {showReviewForm && (
        <div className="mb-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">
            Add Your Review
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform"
                    >
                      {starValue <= (hoveredRating || rating) ? (
                        <FullStar className="text-yellow-400 w-8 h-8 cursor-pointer hover:scale-110 transition-transform" />
                      ) : (
                        <EmptyStar className="text-gray-300 w-8 h-8 cursor-pointer hover:scale-110 transition-transform" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Share your experience with this car..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || rating === 0 || !comment.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setComment('');
                }}
                disabled={submitting}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <div
              key={review.id ?? idx}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {review.user?.name
                    ? review.user.name.trim().charAt(0).toUpperCase()
                    : 'A'}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {review.user?.name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString(
                              'bg-BG',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              },
                            )
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 my-2">
                    {Array.from({ length: 5 }).map((_, index) =>
                      index < (review.rating ?? 0) ? (
                        <FullStar
                          key={index}
                          className="text-yellow-400 w-5 h-5"
                        />
                      ) : (
                        <EmptyStar
                          key={index}
                          className="text-gray-300 w-5 h-5"
                        />
                      ),
                    )}
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">
            No reviews yet. Be the first to review!
          </p>
        </div>
      )}
    </div>
  );
}

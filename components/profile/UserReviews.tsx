/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { EmptyStar, FullStar } from '../icons';
import type { ReviewWithCar } from '@/lib/repository/ReviewRepository';

interface UserReviewsProps {
  reviews?: ReviewWithCar[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}

function buildPageHref(page: number) {
  return `/profile?tab=reviews&page=${page}`;
}

function formatReviewDate(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;

  return date.toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function PaginationLink({
  page,
  label,
  isActive = false,
  isDisabled = false,
}: {
  page: number;
  label: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
}) {
  if (isDisabled) {
    return (
      <span className="inline-flex min-w-10 items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={buildPageHref(page)}
      className={`inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition ${
        isActive
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {label}
    </Link>
  );
}

export default function UserReviews({
  reviews = [],
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
}: UserReviewsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FullStar
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="border-b p-6">
        <h2 className="text-xl font-semibold text-gray-800">My Reviews</h2>
        <p className="mt-1 text-sm text-gray-600">
          Reviews you&apos;ve written for rented cars
        </p>
        {totalCount > 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            Total reviews: {totalCount}
          </p>
        ) : null}
      </div>

      <div className="divide-y">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <EmptyStar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p>No reviews yet</p>
            <p className="mt-2 text-sm">
              Rent a car and share your experience!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6 transition hover:bg-gray-50">
              <div className="flex gap-4">
                {review.car?.images?.[0] ? (
                  <Link href={`/car/${review.carId}`} className="shrink-0">
                    <img
                      src={review.car.images[0]}
                      alt={`${review.car.make} ${review.car.model}`}
                      className="h-20 w-24 rounded-lg object-cover"
                    />
                  </Link>
                ) : (
                  <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                    No image
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/car/${review.carId}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {review.car?.make} {review.car?.model}
                      </Link>
                      <p className="text-sm text-gray-600">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>

                    <div>{renderStars(review.rating)}</div>
                  </div>

                  {review.comment ? (
                    <p className="mt-2 text-sm leading-6 text-gray-700">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm italic text-gray-400">
                      No comment added
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-col gap-4 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <PaginationLink
              page={currentPage - 1}
              label="Previous"
              isDisabled={currentPage <= 1}
            />

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <PaginationLink
                  key={page}
                  page={page}
                  label={page}
                  isActive={page === currentPage}
                />
              ),
            )}

            <PaginationLink
              page={currentPage + 1}
              label="Next"
              isDisabled={currentPage >= totalPages}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

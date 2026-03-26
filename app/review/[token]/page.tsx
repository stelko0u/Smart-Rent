'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getReviewPageData,
  submitReviewFromLink,
  type ReviewPageData,
} from '@/lib/api/reviewApi';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getRatingLabel(value: number) {
  switch (value) {
    case 1:
      return 'Много слабо';
    case 2:
      return 'Слабо';
    case 3:
      return 'Добре';
    case 4:
      return 'Много добре';
    case 5:
      return 'Отлично';
    default:
      return 'Избери оценка';
  }
}

type StarProps = {
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

function Star({ active, onClick, onMouseEnter, onMouseLeave }: StarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="transition-transform hover:scale-110"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-10 w-10 ${active ? 'fill-yellow-400' : 'fill-gray-200'}`}
      >
        <path d="M12 2.5l2.93 5.94 6.56.95-4.74 4.62 1.12 6.53L12 17.77l-5.87 3.08 1.12-6.53L2.51 9.39l6.56-.95L12 2.5z" />
      </svg>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-10 text-center text-white shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-lg font-medium">
          Зареждане на страницата за ревю...
        </p>
      </div>
    </div>
  );
}

function InvalidState({
  message,
  onHome,
}: {
  message: string;
  onHome: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl md:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
          ⚠️
        </div>
        <h1 className="mb-3 text-3xl font-bold text-slate-900">
          Невалиден линк
        </h1>
        <p className="mb-8 text-slate-600">{message}</p>
        <button
          onClick={onHome}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Към началната страница
        </button>
      </div>
    </div>
  );
}

function CannotReviewState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl md:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
          ⏳
        </div>
        <h1 className="mb-3 text-3xl font-bold text-slate-900">
          Все още не може да оставиш ревю
        </h1>
        <p className="text-slate-600">
          Ревю може да се остави след като резервацията е приключила.
        </p>
      </div>
    </div>
  );
}

function ReviewCompletedState({
  data,
  vehicleTitle,
  onOpenCar,
}: {
  data: ReviewPageData;
  vehicleTitle: string;
  onOpenCar: () => void;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-10">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {data.car.imageUrl ? (
          <div className="relative h-72 w-full overflow-hidden bg-slate-200">
            <img
              src={data.car.imageUrl}
              alt={vehicleTitle}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-sm uppercase tracking-[0.25em] text-white/80">
                Smart Rent
              </p>
              <h1 className="mt-2 text-3xl font-bold">{vehicleTitle}</h1>
            </div>
          </div>
        ) : (
          <div className="bg-linear-to-r from-indigo-600 to-violet-600 px-8 py-12 text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-white/80">
              Smart Rent
            </p>
            <h1 className="mt-2 text-3xl font-bold">{vehicleTitle}</h1>
          </div>
        )}

        <div className="p-8 text-center md:p-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            ✅
          </div>
          <h2 className="mb-3 text-3xl font-bold text-slate-900">
            Благодарим ти!
          </h2>
          <p className="mb-2 text-lg text-slate-600">
            {data.alreadyReviewed
              ? 'За тази кола вече има оставено ревю от теб.'
              : 'Ревюто ти беше изпратено успешно.'}
          </p>
          <p className="mb-8 text-slate-500">
            Радваме се, че отдели време да споделиш впечатленията си.
          </p>

          <div className="mb-8 grid gap-4 rounded-2xl bg-slate-50 p-5 text-left sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Автомобил</p>
              <p className="font-semibold text-slate-900">{vehicleTitle}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Резервация</p>
              <p className="font-semibold text-slate-900">
                #{data.reservation.id}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCar}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Виж автомобила
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || '');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewPageData | null>(null);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const vehicleTitle = useMemo(() => {
    if (!data) return '';
    return `${data.car.make} ${data.car.model} (${data.car.year})`;
  }, [data]);

  const currentRating = hoveredRating || rating;

  const loadReviewData = useCallback(async () => {
    if (!token) {
      setPageError('Invalid review link');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError(null);

      const payload = await getReviewPageData(token);
      setData(payload);
    } catch (err: any) {
      setPageError(err?.message || 'Failed to load review page');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitError(null);

      if (rating < 1 || rating > 5) {
        setSubmitError('Моля избери оценка.');
        return;
      }

      if (!comment.trim()) {
        setSubmitError('Моля напиши коментар.');
        return;
      }

      try {
        setSubmitting(true);

        await submitReviewFromLink(token, {
          rating,
          comment: comment.trim(),
        });

        setSubmitted(true);
      } catch (err: any) {
        setSubmitError(err?.message || 'Failed to submit review');
      } finally {
        setSubmitting(false);
      }
    },
    [token, rating, comment],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (pageError || !data) {
    return (
      <InvalidState
        message={pageError || 'Линкът за ревю е невалиден или е изтекъл.'}
        onHome={() => router.push('/')}
      />
    );
  }

  if (submitted || data.alreadyReviewed) {
    return (
      <ReviewCompletedState
        data={data}
        vehicleTitle={vehicleTitle}
        onOpenCar={() => router.push(`/car/${data.car.id}`)}
      />
    );
  }

  if (!data.canReview) {
    return <CannotReviewState />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-80 bg-slate-200">
            {data.car.imageUrl ? (
              <img
                src={data.car.imageUrl}
                alt={vehicleTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-80 items-center justify-center bg-linear-to-br from-slate-200 to-slate-300">
                <div className="text-center text-slate-600">
                  <div className="mb-3 text-6xl">🚗</div>
                  <p className="text-lg font-medium">{vehicleTitle}</p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-white/75">
                Smart Rent
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                {vehicleTitle}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
                Благодарим ти, че използва Smart Rent. Сподели как премина
                наемът и помогни на следващите клиенти.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Клиент</p>
                  <p className="font-semibold text-slate-900">
                    {data.reservation.firstName} {data.reservation.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Резервация</p>
                  <p className="font-semibold text-slate-900">
                    #{data.reservation.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Начало</p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(data.reservation.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Край</p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(data.reservation.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <label className="text-lg font-semibold text-slate-900">
                    Как би оценил автомобила?
                  </label>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                    {getRatingLabel(currentRating)}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-1 md:gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starValue = index + 1;

                      return (
                        <Star
                          key={starValue}
                          active={starValue <= currentRating}
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoveredRating(starValue)}
                          onMouseLeave={() => setHoveredRating(0)}
                        />
                      );
                    })}
                  </div>

                  <div className="mt-3 text-sm text-slate-500">
                    Натисни звезда от 1 до 5.
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label
                  htmlFor="comment"
                  className="mb-3 block text-lg font-semibold text-slate-900"
                >
                  Разкажи малко повече
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={7}
                  className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  placeholder="Например: автомобилът беше чист, комуникацията беше добра, вземането и връщането минаха лесно..."
                  required
                />
                <p className="mt-2 text-sm text-slate-500">
                  Напиши честно мнение, за да помогнеш и на други клиенти.
                </p>
              </div>

              {submitError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Изпращане...' : 'Изпрати ревю'}
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/car/${data.car.id}`)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Към автомобила
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

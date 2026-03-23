'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type ReviewData = {
  reservation: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    imageUrl?: string | null;
  };
  alreadyReviewed: boolean;
  canReview: boolean;
};

function Star({
  active,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
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

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || '');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewData | null>(null);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/review-link/${encodeURIComponent(token)}`,
          {
            cache: 'no-store',
          },
        );

        const payload = await res.json();

        if (!res.ok || !payload.ok) {
          throw new Error(payload.error || 'Invalid review link');
        }

        setData(payload);
        console.log('review data:', payload);
      } catch (err: any) {
        setError(err.message || 'Failed to load review page');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      load();
    }
  }, [token]);

  const vehicleTitle = useMemo(() => {
    if (!data) return '';
    return `${data.car.make} ${data.car.model} (${data.car.year})`;
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      alert('Моля избери оценка.');
      return;
    }

    if (!comment.trim()) {
      alert('Моля напиши коментар.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`/api/review-link/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || 'Failed to submit review');
      }

      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">
        <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 px-8 py-10 text-center text-white shadow-2xl">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-lg font-medium">
            Зареждане на страницата за ревю...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-8 md:p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            ⚠️
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Невалиден линк
          </h1>
          <p className="text-slate-600 mb-8">
            {error || 'Линкът за ревю е невалиден или е изтекъл.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Към началната страница
          </button>
        </div>
      </div>
    );
  }

  if (submitted || data.alreadyReviewed) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 py-10 px-4">
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

          <div className="p-8 md:p-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
              ✅
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Благодарим ти!
            </h2>
            <p className="text-slate-600 text-lg mb-2">
              {data.alreadyReviewed
                ? 'За тази кола вече има оставено ревю от теб.'
                : 'Ревюто ти беше изпратено успешно.'}
            </p>
            <p className="text-slate-500 mb-8">
              Радваме се, че отдели време да споделиш впечатленията си.
            </p>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 text-left sm:grid-cols-2 mb-8">
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
              onClick={() => router.push(`/car/${data.car.id}`)}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Виж автомобила
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data.canReview) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-8 md:p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            ⏳
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Все още не може да оставиш ревю
          </h1>
          <p className="text-slate-600">
            Ревю може да се остави след като резервацията е приключила.
          </p>
        </div>
      </div>
    );
  }

  const currentRating = hoveredRating || rating;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 py-8 px-4 md:py-12">
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
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-white/75">
                Smart Rent
              </p>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold">
                {vehicleTitle}
              </h1>
              <p className="mt-3 max-w-xl text-sm md:text-base text-white/85">
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 resize-none"
                  placeholder="Например: автомобилът беше чист, комуникацията беше добра, вземането и връщането минаха лесно..."
                  required
                />
                <p className="mt-2 text-sm text-slate-500">
                  Напиши честно мнение, за да помогнеш и на други клиенти.
                </p>
              </div>

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

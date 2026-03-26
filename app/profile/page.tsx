'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { differenceInCalendarDays } from 'date-fns';

import Calendar from '@/components/reservations/Calendar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  createReservation,
  getReservationPageData,
  type ReservationCar,
  type ReservationPeriod,
} from '@/lib/api/reservationApi';

type PaymentMethod = 'CARD' | 'ON_SPOT';

type CurrentUser = {
  id: number;
  email?: string;
  name?: string;
  phone?: string;
};

type ReservationFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  paymentMethod: PaymentMethod;
};

const INITIAL_FORM_STATE: ReservationFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  paymentMethod: 'CARD',
};

export default function ReservationPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params?.id as string;

  const [car, setCar] = useState<ReservationCar | null>(null);
  const [reservations, setReservations] = useState<ReservationPeriod[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [form, setForm] = useState<ReservationFormState>(INITIAL_FORM_STATE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { userData } = useCurrentUser<CurrentUser>();

  const setFormField = useCallback(
    <K extends keyof ReservationFormState>(
      field: K,
      value: ReservationFormState[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const loadPageData = useCallback(async () => {
    if (!carId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getReservationPageData(carId);
      setCar(data.car);
      setReservations(data.reservations);
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [carId]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (!userData) return;

    setForm((prev) => {
      const next = { ...prev };

      const fullName = userData.name?.trim() || '';
      const nameParts = fullName.split(/\s+/).filter(Boolean);

      if (!next.firstName && nameParts.length > 0) {
        next.firstName = nameParts[0];
      }

      if (!next.lastName && nameParts.length > 1) {
        next.lastName = nameParts.slice(1).join(' ');
      }

      if (!next.email && userData.email) {
        next.email = userData.email;
      }

      if (!next.phone && userData.phone) {
        next.phone = userData.phone;
      }

      return next;
    });
  }, [userData]);

  const days = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    return differenceInCalendarDays(selectedEndDate, selectedStartDate) + 1;
  }, [selectedStartDate, selectedEndDate]);

  const total = useMemo(() => {
    if (!car || days <= 0) return 0;
    return days * car.pricePerDay;
  }, [car, days]);

  const isFormValid = useMemo(() => {
    return Boolean(
      selectedStartDate &&
      selectedEndDate &&
      car &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      form.phone.trim(),
    );
  }, [selectedStartDate, selectedEndDate, car, form]);

  const handleDateSelect = useCallback(
    (start: Date | null, end: Date | null) => {
      setSelectedStartDate(start);
      setSelectedEndDate(end);
      setError(null);
    },
    [],
  );

  const handleContinue = useCallback(async () => {
    if (!car || !selectedStartDate || !selectedEndDate) {
      setError('Please select reservation dates');
      return;
    }

    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const data = await createReservation({
        carId: car.id,
        startDate: selectedStartDate.toISOString(),
        endDate: selectedEndDate.toISOString(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        paymentMethod: form.paymentMethod,
      });

      const reservationId = data?.reservation?.id;
      const nextStep = data?.flow?.nextStep;

      if (!reservationId) {
        throw new Error('Reservation created without ID');
      }

      if (form.paymentMethod === 'CARD') {
        if (nextStep === 'PAYMENT_PAGE') {
          router.push(`/payment/${reservationId}`);
          return;
        }

        router.push(
          `/reservation/success?id=${reservationId}&step=check-email`,
        );
        return;
      }

      router.push(`/reservation/success?id=${reservationId}&step=created`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  }, [car, selectedStartDate, selectedEndDate, form, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading reservation details...
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error || 'Car not found'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 transition hover:text-gray-900"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-2xl font-bold text-gray-800">
                {car.make} {car.model}
              </h2>

              {car.images?.[0] && (
                <img
                  src={car.images[0]}
                  alt={`${car.make} ${car.model}`}
                  className="mb-4 h-64 w-full rounded-xl object-cover"
                />
              )}

              <p className="text-lg text-gray-600">
                Price per day:
                <span className="ml-2 font-semibold text-gray-900">
                  €{car.pricePerDay}
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h3 className="mb-4 text-xl font-semibold text-gray-800">
                Select Reservation Dates
              </h3>

              <Calendar
                reservations={reservations}
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h3 className="mb-4 text-xl font-semibold text-gray-800">
                Personal Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setFormField('firstName', e.target.value)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setFormField('lastName', e.target.value)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setFormField('email', e.target.value)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setFormField('phone', e.target.value)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h3 className="mb-4 text-xl font-semibold text-gray-800">
                Payment Method
              </h3>

              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition ${
                    form.paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={form.paymentMethod === 'CARD'}
                    onChange={() => setFormField('paymentMethod', 'CARD')}
                    className="h-5 w-5 text-indigo-600"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-gray-900">
                      Pay Online with Card
                    </div>
                    <div className="text-sm text-gray-500">
                      First we create the reservation and send you an email.
                      From the email you continue to payment.
                    </div>
                  </div>
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </label>

                <label
                  className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition ${
                    form.paymentMethod === 'ON_SPOT'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ON_SPOT"
                    checked={form.paymentMethod === 'ON_SPOT'}
                    onChange={() => setFormField('paymentMethod', 'ON_SPOT')}
                    className="h-5 w-5 text-indigo-600"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-gray-900">
                      Pay On-Site
                    </div>
                    <div className="text-sm text-gray-500">
                      Pay when you pick up the car at the office
                    </div>
                  </div>
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </label>
              </div>

              {form.paymentMethod === 'ON_SPOT' && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You will need to pay the full amount
                    when you arrive to pick up the car. Please bring a valid
                    payment method and identification.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="sticky top-10 h-fit rounded-2xl bg-white p-6 shadow">
            <h3 className="mb-6 text-xl font-semibold text-gray-800">
              Reservation Summary
            </h3>

            {!selectedStartDate && (
              <p className="text-sm text-gray-500">
                Select dates to see pricing details.
              </p>
            )}

            {selectedStartDate && selectedEndDate && (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pick-up:</span>
                    <span className="font-medium text-gray-800">
                      {selectedStartDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Drop-off:</span>
                    <span className="font-medium text-gray-800">
                      {selectedEndDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-800">
                      {days} {days === 1 ? 'day' : 'days'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium text-gray-800">
                      {form.paymentMethod === 'CARD'
                        ? 'Online Card'
                        : 'On-Site'}
                    </span>
                  </div>
                </div>

                <div className="my-4 border-t" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      €{car.pricePerDay} × {days} days
                    </span>
                    <span className="text-gray-800">€{total.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 text-lg font-bold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-indigo-600">€{total.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={submitting || !isFormValid}
                  className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {submitting
                    ? 'Processing...'
                    : form.paymentMethod === 'CARD'
                      ? 'Create Reservation'
                      : 'Confirm Reservation'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Calendar from '../../../components/reservations/Calendar';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { differenceInCalendarDays } from 'date-fns';

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images: string[];
}

interface Reservation {
  startDate: string | Date;
  endDate: string | Date;
  status: string;
}

export default function ReservationPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params?.id as string;

  const [car, setCar] = useState<Car | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'ON_SPOT'>(
    'CARD',
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { userData, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!carId) return;

    async function loadData() {
      try {
        const [carRes, reservationsRes] = await Promise.all([
          fetch(`/api/cars/${carId}`),
          fetch(`/api/cars/${carId}/reservation`),
        ]);

        if (!carRes.ok) throw new Error('Failed to load car');
        if (!reservationsRes.ok) throw new Error('Failed to load reservations');

        const carData = await carRes.json();
        const reservationsData = await reservationsRes.json();

        setCar(carData.car);
        setReservations(reservationsData.reservations || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    if (userData) {
      const nameParts = userData.name?.split(' ') || [];
      if (nameParts.length >= 2 && !firstName && !lastName) {
        setFirstName(nameParts[0]);
        setLastName(nameParts.slice(1).join(' '));
      }
      if (userData.email && !email) {
        setEmail(userData.email);
      }
      // Phone from user profile if available
      if ((userData as any).phone && !phone) {
        setPhone((userData as any).phone);
      }
    }
  }, [carId]);

  const calculateDays = () => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    return differenceInCalendarDays(selectedEndDate, selectedStartDate) + 1;
  };

  const calculateTotal = () => {
    if (!car) return 0;
    return calculateDays() * car.pricePerDay;
  };

  const days = calculateDays();
  const total = calculateTotal();

  const handleContinue = async () => {
    if (
      !selectedStartDate ||
      !selectedEndDate ||
      !car ||
      !firstName ||
      !lastName ||
      !email ||
      !phone
    ) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          startDate: selectedStartDate.toISOString(),
          endDate: selectedEndDate.toISOString(),
          firstName,
          lastName,
          email,
          phone,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create reservation');
      }

      // Redirect based on payment method
      if (paymentMethod === 'CARD') {
        router.push(`/payment/${data.reservation.id}`);
      } else {
        router.push(`/reservation/success?id=${data.reservation.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

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
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium">Back</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {car.make} {car.model}
              </h2>

              {car.images?.[0] && (
                <img
                  src={car.images[0]}
                  className="w-full h-64 object-cover rounded-xl mb-4"
                  alt="Car"
                />
              )}

              <p className="text-gray-600 text-lg">
                Price per day:
                <span className="font-semibold text-gray-900 ml-2">
                  €{car.pricePerDay}
                </span>
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Select Reservation Dates
              </h3>

              <Calendar
                reservations={reservations}
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                onDateSelect={(start, end) => {
                  setSelectedStartDate(start);
                  setSelectedEndDate(end);
                }}
              />
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Personal Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-gray-500 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Payment Method
              </h3>

              <div className="space-y-3">
                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-semibold text-gray-900">
                      Pay Online with Card
                    </div>
                    <div className="text-sm text-gray-500">
                      Secure online payment with your debit/credit card
                    </div>
                  </div>
                  <svg
                    className="w-8 h-8 text-gray-400"
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
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition ${
                    paymentMethod === 'ON_SPOT'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ON_SPOT"
                    checked={paymentMethod === 'ON_SPOT'}
                    onChange={() => setPaymentMethod('ON_SPOT')}
                    className="w-5 h-5 text-indigo-600"
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
                    className="w-8 h-8 text-gray-400"
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

              {paymentMethod === 'ON_SPOT' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You will need to pay the full amount
                    when you arrive to pick up the car. Please bring a valid
                    payment method and identification.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 h-fit sticky top-10">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">
              Reservation Summary
            </h3>

            {!selectedStartDate && (
              <p className="text-gray-500 text-sm">
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
                      {paymentMethod === 'CARD' ? 'Online Card' : 'On-Site'}
                    </span>
                  </div>
                </div>

                <div className="border-t my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      €{car.pricePerDay} × {days} days
                    </span>
                    <span className="text-gray-800">€{total.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                    <span className="text-gray-800">Total</span>
                    <span className="text-indigo-600">€{total.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={submitting}
                  className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {submitting
                    ? 'Processing...'
                    : paymentMethod === 'CARD'
                      ? 'Continue to Payment'
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

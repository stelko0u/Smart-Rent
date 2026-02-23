'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Calendar from '../../components/reservations/Calendar';

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
  }, [carId]);

  const calculateDays = () => {
    if (!selectedStartDate || !selectedEndDate) return 0;
    const diff = selectedEndDate.getTime() - selectedStartDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!car) return 0;
    return calculateDays() * car.pricePerDay;
  };

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
      const res = await fetch('/api/reservation', {
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create reservation');
      }

      router.push(`/payment/${data.reservation.id}`);
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

  const days = calculateDays();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-8">
          {/* Car Info */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-600">
              {car.make} {car.model}
            </h2>

            {car.images?.[0] && (
              <img
                src={car.images[0]}
                className="w-full h-88 object-cover rounded-xl mb-4"
                alt="Car"
              />
            )}

            <p className="text-gray-600">
              Price per day:
              <span className="font-semibold text-gray-900 ml-2">
                €{car.pricePerDay}
              </span>
            </p>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-600">
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

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-600">
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4 text-gray-600 text-base">
              <span className="flex flex-col">
                <label className="mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border rounded-lg px-4 py-2"
                />
              </span>
              <span className="flex flex-col">
                <label className="mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border rounded-lg px-4 py-2"
                />
              </span>
              <span className="flex flex-col">
                <label className="mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded-lg px-4 py-2 md:col-span-2"
                />
              </span>
              <span className="flex flex-col">
                <label className="mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border rounded-lg px-4 py-2 md:col-span-2"
                />
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - SUMMARY */}
        <div className="bg-white rounded-2xl shadow p-6 h-fit sticky top-10">
          <h3 className="text-xl font-semibold mb-6 text-gray-500">
            Reservation Summary
          </h3>

          {!selectedStartDate && (
            <p className="text-gray-500 text-sm">
              Select dates to see pricing details.
            </p>
          )}

          {selectedStartDate && selectedEndDate && (
            <>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Pick-up:</span>
                  <span className="text-gray-500">
                    {selectedStartDate.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Drop-off:</span>
                  <span className="text-gray-500">
                    {selectedEndDate.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Days:</span>
                  <span className="text-gray-500">{days}</span>
                </div>
              </div>

              <div className="border-t my-6" />

              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-500">Total:</span>
                <span className="text-indigo-600">${total.toFixed(2)}</span>
              </div>

              {error && (
                <div className="mt-4 text-red-600 text-sm">{error}</div>
              )}

              <button
                onClick={handleContinue}
                disabled={submitting}
                className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {submitting ? 'Processing...' : 'Continue to Payment'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

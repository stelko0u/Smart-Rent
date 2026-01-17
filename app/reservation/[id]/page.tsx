'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Calendar from '../../components/reservations/Calendar';
import { Car } from '../../types/types';
import { Reservation } from '../../types/types';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params?.id ? Number(params.id) : 0;

  const [car, setCar] = useState<Car | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const { userData, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!carId || carId <= 0) {
      router.push('/');
      return;
    }

    async function loadData() {
      try {
        const resCar = await fetch(`/api/car?id=${carId}`);
        if (!resCar.ok) throw new Error('Failed to load car');
        const carData = await resCar.json();

        const resRes = await fetch(`/api/reservations?carId=${carId}`);
        if (!resRes.ok) throw new Error('Failed to load reservations');
        const reservationData = await resRes.json();

        setCar(carData.cars?.[0] || null);
        setReservations(reservationData.reservations ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [carId, router]);

  const handleReserve = async () => {
    if (
      !userData ||
      !car ||
      !startDate ||
      !endDate ||
      !firstName ||
      !lastName ||
      !phone
    ) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          carId: car.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          firstName,
          lastName,
          email: userData.email,
          phone,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Reservation failed');
        return;
      }

      alert('Reservation successful!');
      // refresh reservations to update calendar
      setReservations([
        ...reservations,
        {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        } as any,
      ]);
    } catch (err) {
      console.error(err);
      alert('Reservation failed due to server error.');
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in to make a reservation.
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Car not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {car.make} {car.model}
            </h1>
            <p className="text-gray-600">{car.pricePerDay} EUR / day</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Car info + reservation form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-6">
          {car.images?.[0] ? (
            <img
              src={car.images[0]}
              alt={`${car.make} ${car.model}`}
              className="w-full h-96 object-cover rounded"
            />
          ) : (
            <div className="h-96 bg-gray-200 flex items-center justify-center rounded">
              No image
            </div>
          )}

          {/* Car info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Make:</strong> {car.make}
              </p>
              <p>
                <strong>Model:</strong> {car.model}
              </p>
              <p>
                <strong>Year:</strong> {car.year}
              </p>
              <p>
                <strong>Type:</strong> {car.carType}
              </p>
            </div>
            <div>
              <p>
                <strong>Transmission:</strong> {car.transmissionType}
              </p>
              <p>
                <strong>Fuel:</strong> {car.fuelType}
              </p>
            </div>
          </div>

          {/* Company info */}
          {car.company && (
            <div>
              <h3 className="font-semibold">Company</h3>
              <p>{car.company.name}</p>
              <p>{car.company.email}</p>
            </div>
          )}

          {/* Office info */}
          {car.office && (
            <div>
              <h3 className="font-semibold">Office</h3>
              <p>{car.office.name}</p>
              <p>{car.office.address}</p>
            </div>
          )}

          {/* Reservation form */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block font-medium">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block font-medium">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          <button
            disabled={
              !startDate || !endDate || !firstName || !lastName || !phone
            }
            onClick={handleReserve}
            className="w-full bg-indigo-600 text-white py-3 rounded disabled:opacity-50"
          >
            Reservation Now
          </button>
        </div>

        {/* Right: Calendar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Availability</h2>
          <Calendar
            reservations={reservations}
            selectedStart={startDate}
            selectedEnd={endDate}
            onSelect={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>
      </main>
    </div>
  );
}

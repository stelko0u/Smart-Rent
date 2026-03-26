'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSimpleReservation } from '@/lib/api/reservationApi';

const ReservationForm = () => {
  const router = useRouter();

  const [vehicleId, setVehicleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!vehicleId || !startDate || !endDate) {
      setError('All fields are required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);

      const reservation = await createSimpleReservation({
        vehicleId: Number(vehicleId),
        startDate,
        endDate,
      });

      // ако API-то връща id
      router.push(`/reservation/${reservation.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create reservation';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}

      <div>
        <label htmlFor="vehicleId" className="block">
          Vehicle ID
        </label>
        <input
          type="number"
          id="vehicleId"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="startDate" className="block">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          min={today}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="endDate" className="block">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          min={startDate || today}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-500 p-2 text-white disabled:opacity-60"
      >
        {loading ? 'Creating...' : 'Reserve'}
      </button>
    </form>
  );
};

export default ReservationForm;

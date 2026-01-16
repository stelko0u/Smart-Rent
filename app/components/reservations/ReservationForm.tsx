import React, { useState } from 'react';

const ReservationForm = () => {
    const [vehicleId, setVehicleId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!vehicleId || !startDate || !endDate || !userId) {
            setError('All fields are required');
            return;
        }

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vehicleId, startDate, endDate, userId }),
            });

            if (!response.ok) {
                throw new Error('Failed to create reservation');
            }

            // Handle successful reservation creation (e.g., redirect or show a success message)
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            <div>
                <label htmlFor="vehicleId" className="block">Vehicle ID</label>
                <input
                    type="text"
                    id="vehicleId"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                />
            </div>
            <div>
                <label htmlFor="startDate" className="block">Start Date</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                />
            </div>
            <div>
                <label htmlFor="endDate" className="block">End Date</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                />
            </div>
            <div>
                <label htmlFor="userId" className="block">User ID</label>
                <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="border rounded p-2 w-full"
                    required
                />
            </div>
            <button type="submit" className="bg-blue-500 text-white rounded p-2">Reserve</button>
        </form>
    );
};

export default ReservationForm;
import React, { useEffect, useState } from 'react';
import { Reservation } from '../../types';
import { fetchReservations } from '../../lib/api';

const ReservationList: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReservations = async () => {
            try {
                const data = await fetchReservations();
                setReservations(data);
            } catch (err) {
                setError('Failed to load reservations');
            } finally {
                setLoading(false);
            }
        };

        loadReservations();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="reservation-list">
            <h2 className="text-xl font-bold mb-4">Your Reservations</h2>
            <ul>
                {reservations.map((reservation) => (
                    <li key={reservation.id} className="border p-4 mb-2 rounded">
                        <h3 className="font-semibold">{reservation.vehicle.name}</h3>
                        <p>Pickup Date: {new Date(reservation.pickupDate).toLocaleDateString()}</p>
                        <p>Return Date: {new Date(reservation.returnDate).toLocaleDateString()}</p>
                        <p>Status: {reservation.status}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ReservationList;
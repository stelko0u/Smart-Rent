import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import ReservationList from '../reservations/ReservationList';

const UserDashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Please log in to view your dashboard.</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
            <h2 className="text-xl mb-2">Your Reservations</h2>
            <ReservationList />
        </div>
    );
};

export default UserDashboard;
import React from 'react';

const AdminDashboard: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="font-semibold">Total Rentals</h2>
                    <p className="text-xl">150</p>
                </div>
                <div className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="font-semibold">Total Revenue</h2>
                    <p className="text-xl">$12,000</p>
                </div>
                <div className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="font-semibold">Active Users</h2>
                    <p className="text-xl">300</p>
                </div>
            </div>
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Recent Reservations</h2>
                {/* Placeholder for recent reservations list */}
            </div>
        </div>
    );
};

export default AdminDashboard;
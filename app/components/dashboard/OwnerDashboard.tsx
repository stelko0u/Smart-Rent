import React, { useEffect, useState } from "react";
// Mock functions for build - replace with actual API calls
const getOwnerVehicles = async () => [];
const getOwnerStatistics = async () => ({ totalVehicles: 0, totalReservations: 0 });
import VehicleCard from "../vehicles/CarCard";
import Button from "../ui/Button";

const OwnerDashboard = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({ totalVehicles: 0, totalReservations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesData = await getOwnerVehicles();
        const statsData = await getOwnerStatistics();
        setVehicles(vehiclesData);
        setStatistics(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
      {statistics && (
        <div className="mb-4">
          <h2 className="text-xl">Statistics</h2>
          <p>Total Vehicles: {statistics.totalVehicles}</p>
          <p>Total Reservations: {statistics.totalReservations}</p>
        </div>
      )}
      <h2 className="text-xl mb-2">Your Vehicles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} car={vehicle} />
        ))}
      </div>
      <Button className="mt-4">Add New Vehicle</Button>
    </div>
  );
};

export default OwnerDashboard;

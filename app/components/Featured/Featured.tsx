"use client";

import React from "react";
import CarCard from "../vehicles/CarCard";

export default function FeaturedGrid({
  cars,
}: {
  cars: { id: number; name: string; type: string; pricePerDay: number; img: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}

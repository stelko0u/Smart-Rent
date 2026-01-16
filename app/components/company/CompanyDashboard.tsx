import React from 'react';

export type Car = {
  id: number;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  images?: string[];
  companyId?: number | null;
};

export default function CompanyDashboard({ cars }: { cars: Car[] }) {
  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Overview</h2>
      <p className="mb-4">Cars total: {cars.length}</p>
      <div>
        {cars.slice(0, 5).map((c) => (
          <div key={c.id} className="p-3 border rounded mb-2">
            <div className="font-semibold">{`${c.make} ${c.model}`}</div>
            <div className="text-sm text-gray-600">
              {c.year} — {c.pricePerDay} лв/ден
            </div>
          </div>
        ))}
        {cars.length === 0 && <p>No cars yet.</p>}
      </div>
    </section>
  );
}

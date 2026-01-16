import React from 'react';
import { Car } from './CompanyDashboard';

export default function ManageCars({
  cars,
  onEdit,
  onDelete,
  onDetails,
}: {
  cars: Car[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onDetails?: (id: number) => void;
}) {
  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Manage cars</h2>
      {cars.length === 0 ? (
        <p>No cars added yet.</p>
      ) : (
        <ul className="space-y-3">
          {cars.map((c) => (
            <li
              key={c.id}
              className="p-3 border rounded flex items-center gap-4"
            >
              <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-100 border">
                {c.images && c.images.length ? (
                  <img
                    src={c.images[0]}
                    alt={`${c.make} ${c.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="font-semibold">{`${c.make} ${c.model}`}</div>
                <div className="text-sm text-gray-600">
                  {c.year} — {c.pricePerDay} лв/ден
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.companyId ?? ''}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onDetails?.(c.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded"
                  aria-label={`Details ${c.make} ${c.model}`}
                >
                  Details
                </button>
                <button
                  onClick={() => onEdit?.(c.id)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded"
                  aria-label={`Edit ${c.make} ${c.model}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(c.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded"
                  aria-label={`Delete ${c.make} ${c.model}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

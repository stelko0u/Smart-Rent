import React, { useState } from 'react';
import { Car } from '@/app/types/database';
import EditCarModal from '../modals/EditCarModal';
import DeleteCarModal from '../modals/DeleteCarModal';
import { toast } from 'react-hot-toast';
import { CircleInfo, CircleTrash, PenCircle } from '../icons';

export default function ManageCars({
  cars,
  onRefresh,
}: {
  cars: Car[];
  onRefresh?: () => void;
}) {
  const [editCarId, setEditCarId] = useState<number | null>(null);
  const [deleteCarId, setDeleteCarId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    setEditCarId(id);
  };

  const handleDelete = (id: number) => {
    setDeleteCarId(id);
  };

  const handleDetails = (id: number) => {
    window.location.href = `/car/${id}`;
  };

  const confirmDelete = async () => {
    if (!deleteCarId) return;

    try {
      const res = await fetch(`/api/company/cars?id=${deleteCarId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete car');
        setDeleteCarId(null);
        return;
      }

      toast.success('Car deleted successfully');
      setDeleteCarId(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error('Failed to delete car');
      setDeleteCarId(null);
    }
  };

  const handleEditSuccess = () => {
    toast.success('Car updated successfully');
    setEditCarId(null);
    onRefresh?.();
  };

  const selectedCar = cars.find((c) => c.id === editCarId);

  return (
    <section>
      <h2 className="text-xl font-medium mb-4 text-gray-600">Manage cars</h2>
      {cars.length === 0 ? (
        <p>No cars added yet.</p>
      ) : (
        <ul className="space-y-3">
          {cars.map((c) => (
            <li
              key={c.id}
              className="p-3 border rounded flex items-center gap-4"
            >
              <div className="w-24 h-18 shrink-0 rounded overflow-hidden bg-gray-100 border">
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

              <div className="flex-1 text-gray-600">
                <div className="font-semibold">{`${c.make} ${c.model}`}</div>
                <div className="text-sm text-gray-600">
                  {c.year} — {c.pricePerDay}€ / per day
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.carType} • {c.transmissionType} • {c.fuelType}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDetails(c.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition hover:scale-105"
                  aria-label={`Details ${c.make} ${c.model}`}
                >
                  <p className="flex justify-center items-center gap-2">
                    <CircleInfo className="w-5 h-5" />
                    Details
                  </p>
                </button>
                <button
                  onClick={() => handleEdit(c.id)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-300 transition cursor-pointer hover:scale-105"
                  aria-label={`Edit ${c.make} ${c.model}`}
                >
                  <p className="flex justify-center items-center gap-2">
                    <PenCircle className="w-5 h-5" />
                    Edit
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded cursor-pointer hover:bg-red-200 transition hover:scale-105"
                  aria-label={`Delete ${c.make} ${c.model}`}
                >
                  <p className="flex justify-center items-center gap-2">
                    <CircleTrash className="w-5 h-5" />
                    Delete
                  </p>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit Modal */}
      {editCarId && selectedCar && (
        <EditCarModal
          car={selectedCar}
          onClose={() => setEditCarId(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteCarId && (
        <DeleteCarModal
          onConfirm={confirmDelete}
          onCancel={() => setDeleteCarId(null)}
        />
      )}
    </section>
  );
}
